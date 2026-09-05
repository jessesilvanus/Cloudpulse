# Circuit Breakers, Loop Protection & Idempotency

## Safety Safeguards

1. **Circuit Breaker Threshold**: If an automation policy encounters 5 consecutive execution failures, the policy transitions to `PAUSED` and triggers an urgent SRE alert.
2. **Loop Protection**: Continuous drift-remediate-drift cycles within a 15-minute window are detected as `AUTOMATION_LOOP_DETECTED` and immediately blocked to prevent flapping.
3. **Idempotency**: Every remediation queue item generates a unique cryptographic idempotency key (`idemp-<hash>`); replay attempts return existing execution state without re-executing AWS mutations.
