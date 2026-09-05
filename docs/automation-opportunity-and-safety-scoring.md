# Automation Opportunity & Safety Scoring Engine

## Automation Eligibility Assessment

The engine evaluates governance controls against strict automation criteria:

1. **`SAFE_AUTOMATION_CANDIDATE`**:
   - Action is registered in the Phase 54 allowlist.
   - Action is fully reversible with zero workload downtime.
   - Pre-flight checks and post-read verification probes are implemented.
   - Historical success rate is 100%.

2. **`APPROVAL_REQUIRED`**:
   - Action modifies external or public access controls (e.g., S3 Public Shield).
   - Requires explicit human approval before execution.
