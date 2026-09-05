# CLOUDPULSE — Chaos Safety, Pre-Flight Gates & Rollback Invariants

## 1. Safety Mode Invariants

1. **Default Mode**: `SIMULATION` / `TEST`.
2. **Pre-Flight Validation**:
   - Verify target workload is running and healthy.
   - Verify active observability and distributed tracing are operational.
   - Verify rollback plan is available and deterministic.
3. **Automatic Abort Thresholds**:
   - API error rate exceeds $15\%$.
   - Experiment duration exceeds configured timeout.
   - Unexpected cascading dependency failure detected.
4. **Guaranteed Rollback**:
   - Every failure injector implements idempotent rollback logic executed automatically on abort or test completion.
