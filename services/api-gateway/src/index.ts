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

const SERVICE_NAME = 'api-gateway';
const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 4000;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4001';

// Initialize OpenTelemetry SDK for this service
initOpenTelemetry(SERVICE_NAME);

const app = express();
app.use(cors());
app.use(express.json());

// Attach OpenTelemetry HTTP auto-tracing and W3C context propagation
app.use(openTelemetryMiddleware());

// GET /health
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: 'v1.0.0',
    orderServiceUrl: ORDER_SERVICE_URL,
  });
});

// GET /metrics (Prometheus scraping)
app.get('/metrics', prometheusMetricsHandler(SERVICE_NAME));

// POST /api/checkout (Distributed Request Root: Gateway -> Orders -> Payments)
app.post('/api/checkout', async (req: TracedRequest, res) => {
  const { customerId = 'cust-4821', items = [{ sku: 'SKU-CLOUD-99', quantity: 1, price: 149.99 }], totalAmount = 149.99 } = req.body;

  logger.info(`Received ingress checkout request from customer ${customerId}`, {
    customerId,
    itemCount: items.length,
    totalAmount,
  });

  try {
    // Forward to order-service with traceparent header
    const orderResponse = await tracedFetch(`${ORDER_SERVICE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        items,
        totalAmount,
      }),
    });

    const responseData = await orderResponse.json().catch(() => ({}));

    if (!orderResponse.ok) {
      logger.error(`Checkout transaction failed: order service returned ${orderResponse.status}`, {
        httpStatus: orderResponse.status,
        details: responseData,
      });
      return res.status(orderResponse.status).json({
        error: 'Checkout failed',
        details: responseData,
      });
    }

    logger.info(`Checkout completed successfully: order ${responseData.orderId}`, {
      orderId: responseData.orderId,
      status: 'SUCCESS',
    });

    return res.status(200).json({
      status: 'SUCCESS',
      order: responseData,
      traceId: req.traceId,
    });
  } catch (err: any) {
    logger.error(`Checkout failed due to network error calling order-service: ${err.message}`, {
      error: err.message,
    });
    return res.status(503).json({
      error: 'Order processing service unavailable',
      message: err.message,
    });
  }
});

// GET /api/orders
app.get('/api/orders', async (_req: TracedRequest, res) => {
  try {
    const response = await tracedFetch(`${ORDER_SERVICE_URL}/orders`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(503).json({ error: 'Order service unavailable', message: err.message });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', async (req: TracedRequest, res) => {
  try {
    const { id } = req.params;
    const response = await tracedFetch(`${ORDER_SERVICE_URL}/orders/${id}`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(503).json({ error: 'Order service unavailable', message: err.message });
  }
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

