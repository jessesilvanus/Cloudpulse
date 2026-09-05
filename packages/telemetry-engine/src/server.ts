import express from 'express';
import cors from 'cors';
import { receiverRouter } from './receiver.js';
import { queryRouter } from './queryApi.js';

export function createTelemetryApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Ingestion routes
  app.use(receiverRouter);

  // Query API routes (Prometheus, Loki, Tempo, Status)
  app.use(queryRouter);

  return app;
}

export function startTelemetryEngine(port = 4318): Promise<void> {
  const app = createTelemetryApp();
  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`[CloudPulse Telemetry Engine] Listening on http://localhost:${port} (OTLP HTTP + Query API)`);
      resolve();
    });
  });
}
