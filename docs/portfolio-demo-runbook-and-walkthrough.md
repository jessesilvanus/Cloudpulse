# CLOUDPULSE: Portfolio Presentation & Live Demo Runbook

**Creator**: Jesse Silvanus  
**Platform Version**: v1.0.0 (FINAL)

---

## 1. Quick Launch & Verification

```bash
# 1. Install & Build Monorepo
pnpm install
pnpm --filter @cloudpulse/shared build
pnpm -r build

# 2. Run Test Suites
pnpm test

# 3. Start Live Local Services
pnpm dev:services   # Starts api-gateway (:4000), order-service (:4001), payment-service (:4002)
pnpm --filter @cloudpulse/api dev    # Express API (:3001)
pnpm --filter @cloudpulse/web dev    # React + Vite Frontend (:5173)

# 4. Run Smoke Test
pnpm --filter @cloudpulse/api exec tsx ../../test/cloud-smoke-test.ts
```

---

## 2. Recommended Portfolio Demo Sequence

1. **Enterprise Command Center** (`http://localhost:5173/overview`):
   - Review the **Enterprise Health Score** ($88.4/100$, $+1.2\%$ trend) and category contributors.
   - Inspect the **Situation Room Event Stream** and **10-Point Grounded AI Briefing**.
   - Switch to **Global Cloud Estate & Scenario Simulator** tab and trigger the **What-If Regional Outage Drill** ($42\text{s}$ failover RTO).
2. **Observability & Distributed Tracing** (`http://localhost:5173/traces`):
   - Inspect OpenTelemetry trace waterfalls across `api-gateway`, `order-service`, and `payment-service`.
   - Click trace logs to view Loki log-to-trace correlation.
3. **Reliability & SRE Center** (`http://localhost:5173/slos` & `/incidents`):
   - Inspect multi-window burn rate alerts and incident triage workflows.
4. **Global Command Palette** (`Cmd+K` / `Ctrl+K`):
   - Search across all domains (`FinOps`, `Security`, `Compliance`, `Resilience`, `AI`).
