# Remediation Planning & Pre-Flight Validation Engine

## Pre-Flight Safety Verification

Before any mutating operation is performed against an AWS account:

1. **Resource Existence Check**: Target resource must be verified in the live AWS account and region.
2. **Configuration Match**: Ensure resource attributes have not changed since plan creation.
3. **Approval Status**: Verify plan status is `APPROVED` by an authorized principal with the required role.
4. **Tenant Isolation**: Strictly assert workspace boundaries before allowing action execution.
