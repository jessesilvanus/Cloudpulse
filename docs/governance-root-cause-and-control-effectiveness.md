# Governance Root Cause & Control Effectiveness Model

## Root Cause Hypotheses Categorization

The engine evaluates recurring governance violations and configuration drift against evidence-backed root cause categories:

1. **`MANUAL_CONFIG`**: Out-of-band AWS Console or CLI changes bypassing IaC pipelines.
2. **`IAC_MISMATCH`**: Terraform or CloudFormation drift against live AWS infrastructure.
3. **`POLICY_WEAKNESS`**: Incomplete or underscoped policy rules causing false negatives.
4. **`EXPIRED_EXCEPTION`**: Temporary waivers reaching their end-of-life date without renewal.
5. **`AUTOMATION_FAILURE`**: Auto-remediation circuit breaker tripping or permission failures.

## Control Effectiveness Scoring

Controls are continuously evaluated on violation recurrence, detection latency, remediation success, and post-read verification reliability.
