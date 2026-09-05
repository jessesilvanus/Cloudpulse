# Baseline Reconciliation & Visual Diff Model

## Visual Diff Specifications

The visual diff engine provides unambiguous, structured comparisons between authorized specifications and live AWS telemetry:

### Drift `drift-aws-ec2-01`
```json
// EXPECTED (Baseline: base-aws-ec2-staging v1.2.0)
{
  "monitoring": {
    "state": "enabled"
  }
}

// ACTUAL (Live AWS DescribeInstances)
{
  "monitoring": {
    "state": "disabled"
  }
}
```

---

## Reconciliation Lifecycle

1. **Scheduled / Event-Triggered**: Ingests CloudTrail change notification.
2. **Deterministic Diff**: Compares JSON schema trees.
3. **Drift Record Creation**: Labels changed fields without modifying cloud resources.
4. **Governance Fusion**: Evaluates policy impact (`pol-aws-ec2-monitoring-enabled`).
