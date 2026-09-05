import express from 'express';
import cors from 'cors';
import {
  initOpenTelemetry,
  openTelemetryMiddleware,
  prometheusMetricsHandler,
  logger,
  type TracedRequest,
} from '@cloudpulse/instrumentation';

const SERVICE_NAME = 'payment-service';
const PORT = process.env.PAYMENT_SERVICE_PORT || process.env.PORT || 4002;

// Initialize OpenTelemetry SDK for this service
initOpenTelemetry(SERVICE_NAME);

const app = express();
app.use(cors());
app.use(express.json());

// Attach OpenTelemetry HTTP auto-tracing and W3C context propagation
app.use(openTelemetryMiddleware());

// Failure simulation mode: 'NORMAL' | 'SLOW' | 'ERROR'
let failureMode: 'NORMAL' | 'SLOW' | 'ERROR' = 'NORMAL';

// GET /health
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: 'v1.0.0',
    failureMode,
  });
});

// GET /metrics (Prometheus scraping)
app.get('/metrics', prometheusMetricsHandler(SERVICE_NAME));

// POST /config (Update failure mode dynamically)
app.post('/config', (req, res) => {
  const { mode } = req.body;
  if (mode === 'NORMAL' || mode === 'SLOW' || mode === 'ERROR') {
    failureMode = mode;
    logger.info(`Updated failure mode to ${failureMode}`);
    return res.status(200).json({ status: 'ok', failureMode });
  }
  return res.status(400).json({ error: 'Invalid mode. Use NORMAL, SLOW, or ERROR.' });
});

// POST /payments/process
app.post('/payments/process', async (req: TracedRequest, res) => {
  const { orderId, amount, currency = 'USD' } = req.body;

  logger.info(`Received payment authorization request for order ${orderId} ($${amount})`, {
    orderId,
    amount,
    currency,
    failureMode,
  });

  if (failureMode === 'ERROR') {
    logger.error(`Database connection pool exhausted during transaction commit for order ${orderId}`, {
      orderId,
      db_pool_active: 100,
      db_pool_idle: 0,
      error_code: 'DB_POOL_EXHAUSTED',
    });
    return res.status(500).json({
      error: 'Database connection pool exhausted during transaction commit',
      code: 'DB_POOL_EXHAUSTED',
      orderId,
    });
  }

  if (failureMode === 'SLOW') {
    logger.warn(`High latency detected in payment tokenization provider (1200ms delay injected)`, {
      orderId,
      injectedDelayMs: 1200,
    });
    await new Promise((r) => setTimeout(r, 1200));
  } else {
    // Normal processing delay (15-30ms)
    await new Promise((r) => setTimeout(r, 20));
  }

  const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  logger.info(`Payment authorized successfully: ${paymentId} for order ${orderId}`, {
    paymentId,
    orderId,
    amount,
    status: 'AUTHORIZED',
  });

  return res.status(200).json({
    paymentId,
    orderId,
    amount,
    currency,
    status: 'AUTHORIZED',
    processedAt: new Date().toISOString(),
  });
});

// GET /payments/:id
app.get('/payments/:id', (req: TracedRequest, res) => {
  const { id } = req.params;
  logger.info(`Lookup payment record: ${id}`, { paymentId: id });
  return res.status(200).json({
    paymentId: id,
    status: 'AUTHORIZED',
    amount: 149.99,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  });
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

