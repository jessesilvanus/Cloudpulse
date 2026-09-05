# CLOUDPULSE: Pod Failure Troubleshooting & Root Cause Analysis (RCA)

---

## 1. CrashLoopBackOff & OOMKilled Diagnostics

- **Target Pod**: `payment-service-9b1e4-zz44k` (`cloudpulse-prod`)
- **Container State**: `waiting: CrashLoopBackOff (exit code 137: OOMKilled)`
- **Restart Count**: $4\times$
- **Root Cause**: Memory limit of $4096\text{Mi}$ was exceeded during high fraud batch scan processing.
- **Remediation**: Scale container memory limit to $6144\text{Mi}$ and trigger rolling restart.
