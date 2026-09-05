# Change-to-Alarm Causation vs Correlation Model

## Causation vs Correlation Standard

CLOUDPULSE explicitly protects users from assuming causality when only temporal proximity exists:

1. **`CORRELATED`**: Change event occurred within proximity window; resource is a potential contributing factor.
2. **`CONFIRMED CAUSE`**: Direct, irrefutable evidence exists (e.g. security group rule explicitly severed port 5432 ingress traffic).
3. **`INSUFFICIENT EVIDENCE`**: Correlation cannot be established with current AWS permissions.
