import express from 'express';
import cors from 'cors';
import {
  initOpenTelemetry,
  openTelemetryMiddleware,
  prometheusMetricsHandler,
  logger,
  tracedFetch,
  type TracedRequest,
} from '@cloudpulse/instrumentation';

const SERVICE_NAME = 'order-service';
const PORT = process.env.ORDER_SERVICE_PORT || process.env.PORT || 4001;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002';

// Initialize OpenTelemetry SDK for this service
initOpenTelemetry(SERVICE_NAME);

const app = express();
app.use(cors());
app.use(express.json());

// Attach OpenTelemetry HTTP auto-tracing and W3C context propagation
app.use(openTelemetryMiddleware());

// In-memory orders cache
const ordersDb: any[] = [];

// GET /health
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: 'v1.0.0',
    paymentServiceUrl: PAYMENT_SERVICE_URL,
  });
});

// GET /metrics (Prometheus scraping)
app.get('/metrics', prometheusMetricsHandler(SERVICE_NAME));

// POST /orders
app.post('/orders', async (req: TracedRequest, res) => {
  const { customerId, items = [], totalAmount = 149.99 } = req.body;
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  logger.info(`Creating order ${orderId} for customer ${customerId || 'cust-anon'} ($${totalAmount})`, {
    orderId,
    customerId,
    itemCount: items.length,
    totalAmount,
  });

  // Call payment-service to process payment with W3C traceparent propagation
  try {
    const paymentResponse = await tracedFetch(`${PAYMENT_SERVICE_URL}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        amount: totalAmount,
        currency: 'USD',
      }),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json().catch(() => ({}));
      logger.error(`Payment processing failed for order ${orderId} (${paymentResponse.status})`, {
        orderId,
        httpStatus: paymentResponse.status,
        error: errorData,
      });

      return res.status(500).json({
        error: 'Payment processing failed',
        orderId,
        details: errorData,
      });
    }

    const paymentResult = await paymentResponse.json();
    const orderRecord = {
      orderId,
      customerId: customerId || 'cust-anon',
      status: 'CONFIRMED',
      totalAmount,
      items,
      paymentId: paymentResult.paymentId,
      createdAt: new Date().toISOString(),
    };

    ordersDb.unshift(orderRecord);
    if (ordersDb.length > 100) ordersDb.pop();

    logger.info(`Order ${orderId} confirmed successfully with payment ${paymentResult.paymentId}`, {
      orderId,
      paymentId: paymentResult.paymentId,
      status: 'CONFIRMED',
    });

    return res.status(201).json(orderRecord);
  } catch (err: any) {
    logger.error(`Failed to reach downstream payment-service for order ${orderId}: ${err.message}`, {
      orderId,
      error: err.message,
    });
    return res.status(502).json({
      error: 'Downstream payment gateway unreachable',
      orderId,
      message: err.message,
    });
  }
});

// GET /orders
app.get('/orders', (_req: TracedRequest, res) => {
  logger.info(`Listing recent orders (count: ${ordersDb.length})`);
  return res.status(200).json({
    orders: ordersDb,
    total: ordersDb.length,
  });
});

// GET /orders/:id
app.get('/orders/:id', (req: TracedRequest, res) => {
  const { id } = req.params;
  const order = ordersDb.find((o) => o.orderId === id);
  if (!order) {
    logger.warn(`Order not found: ${id}`);
    return res.status(404).json({ error: `Order ${id} not found` });
  }
  logger.info(`Found order ${id}`);
  return res.status(200).json(order);
});

// GET /ready
app.get('/ready', (_req, res) => {
  res.status(200).json({ status: 'ready', service: SERVICE_NAME });
});

const server = app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] Listening on http://localhost:${PORT}`);
});

function shutdown(signal: string) {
  logger.info(`[${SERVICE_NAME}] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info(`[${SERVICE_NAME}] HTTP server closed.`);
    process.exit(0);
  });
  setTimeout(() => {
    logger.error(`[${SERVICE_NAME}] Forcefully exiting on timeout.`);
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

