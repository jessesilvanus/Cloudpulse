import { Router, type IRouter, type Request, type Response } from 'express';
import type { ApiResponse } from '@cloudpulse/shared';
import { telemetryManager } from '../providers/telemetryManager.js';
import type { TelemetryStatus } from '../providers/interfaces.js';

export const telemetryRouter: IRouter = Router();

// GET /api/v1/telemetry/status
telemetryRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await telemetryManager.getStatus();
    const body: ApiResponse<TelemetryStatus> = {
      ok: true,
      data: status,
      meta: {
        timestamp: new Date().toISOString(),
        version: '0.0.2',
      },
    };
    return res.status(200).json(body);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/v1/telemetry/mode
telemetryRouter.post('/mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode === 'live' || mode === 'demo') {
    telemetryManager.setMode(mode);
    return res.status(200).json({ ok: true, mode: telemetryManager.getMode() });
  }
  return res.status(400).json({ ok: false, error: 'Mode must be "live" or "demo"' });
});

// POST /api/v1/telemetry/simulate (Send real request or set failure mode)
telemetryRouter.post('/simulate', async (req: Request, res: Response) => {
  const { action, failureMode } = req.body;
  const gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:4000';
  const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002';

  if (action === 'set_failure_mode') {
    try {
      const response = await fetch(`${paymentUrl}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: failureMode || 'NORMAL' }),
      });
      const data = await response.json();
      return res.status(200).json({ ok: true, result: data });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: `Could not reach payment service: ${err.message}` });
    }
  }

  // Default action: Trigger a live checkout flow
  try {
    const checkoutRes = await fetch(`${gatewayUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: `cust-${Math.floor(Math.random() * 9000 + 1000)}`,
        items: [{ sku: 'SKU-LIVE-FLOW', quantity: 1, price: 189.0 }],
        totalAmount: 189.0,
      }),
    });
    const result = await checkoutRes.json();
    return res.status(checkoutRes.status).json({ ok: checkoutRes.ok, result });
  } catch (err: any) {
    return res.status(503).json({ ok: false, error: `Could not reach API gateway: ${err.message}` });
  }
});
