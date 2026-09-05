# Continuous Control Health & Evidence Quality Model

## Evidence Quality Dimensions

CLOUDPULSE scores evidence quality independently from compliance results:

1. **`FRESH`**: Direct probe or CloudTrail event received within the last 15 minutes.
2. **`AGING`**: Evidence captured within 15–60 minutes.
3. **`STALE`**: Evidence older than 60 minutes requiring resynchronization before high-confidence decisions.
4. **`MISSING`**: Required AWS Config or CloudWatch metric source is unconfigured.

## Multi-Source Evidence Attribution

Every governance finding attributes its source:
- `AWS CloudTrail` for real-time mutating API events.
- `AWS Config` for configuration baseline snapshots.
- `Amazon CloudWatch` for high-resolution 1-minute metrics.
- `AWS Direct Probe API` for verified live read checks.
