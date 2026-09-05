# CLOUDPULSE — Secrets Management & Rotation Strategy

## 1. Secrets Security Tenets

1. **Zero Committed Secrets**: Verified across 164 files in the repository.
2. **Environment Variable Decoupling**: Sensitive credentials (`DATABASE_AUTH_KEY`, `PAYMENT_GATEWAY_TOKEN`) are injected dynamically via AWS SSM Parameter Store or Kubernetes Secrets at runtime.
3. **No Secrets in Frontend**: Client bundles contain only public API endpoints; internal tokens are strictly isolated to server-side Node.js containers.

---

## 2. Secrets Rotation Procedure

1. **Generate New Credential**: Generate new key/token in the target subsystem.
2. **Update Cloud Secret Store**: Update parameter in AWS SSM (`/cloudpulse/production/*`) or apply new Kubernetes Secret manifest.
3. **Trigger Graceful Rolling Restart**:
   ```bash
   kubectl rollout restart deployment/cloudpulse-api -n cloudpulse
   ```
4. **Verify Application Health**: Confirm `/health/ready` returns 200 OK across all instances.
5. **Invalidate Old Credential**: Revoke previous key in the upstream provider after all tasks report operational status.
