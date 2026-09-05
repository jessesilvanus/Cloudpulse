# Root-Cause Hypothesis Scoring & Evidence Timeline

## Hypothesis Confidence Scoring Rubric

Hypothesis confidence scores (0–100%) are calculated using four empirical criteria:

1. **Temporal Proximity (+30 pts)**: Change event occurred within 5 minutes of telemetry anomaly.
2. **Direct Resource ARN Matching (+30 pts)**: Explicit ARN correlation between CloudTrail event and CloudWatch dimension.
3. **Cross-Signal Agreement (+25 pts)**: Metric deviation matches alarm threshold criteria.
4. **Telemetry Gaps (-15 pts)**: Missing operational telemetry (e.g. Memory metric absent).

---

## Evidence Timeline for `inc-aws-cw-01`

```
2026-09-03T09:00:00Z ── [CHANGE] CloudTrail: dev-automation started AWS-StartSSMSession
2026-09-03T09:04:00Z ── [METRIC] CloudWatch: CPUUtilization jumped from 24.0% to 78.5% (+227%)
2026-09-03T09:06:00Z ── [ALARM]  CloudWatch: Alarm Staging-High-CPU-Utilization -> ALARM
2026-09-03T09:06:15Z ── [RCA]    CLOUDPULSE: Incident inc-aws-cw-01 detected & correlated
```
