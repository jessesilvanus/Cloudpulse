# CLOUDPULSE Platform Operational Runbooks & Disaster Recovery

## 1. Operational Runbooks Summary

This document provides standardized procedures for platform operations, incident remediation, maintenance governance, and disaster recovery.

---

## 2. Runbook SOP-01: Circuit Breaker Trip & Upstream Cloud Provider Outage

### Symptoms
- Cloud SDK Circuit Breaker transitions to `OPEN` status.
- UI displays degraded cloud adapter state (e.g. `azure-monitor-api` or `aws-cloudwatch-api`).
- Logs show repeated `504 Gateway Timeout` or `429 Too Many Requests` from cloud provider endpoints.

### Procedure
1. **Verify Isolation**: Ensure platform core liveness (`/health/live`) is unaffected.
2. **Inspect Circuit Breaker Status**:
   ```bash
   curl -H "x-tenant-id: tenant-cloudpulse-main" http://localhost:3001/api/v1/platform/rate-limits
   ```
3. **Analyze Upstream Status**: Check the official AWS Health Dashboard, Azure Service Health, or Google Cloud Status page.
4. **Automatic Recovery**: The circuit breaker automatically tests upstream connectivity after a 30-second half-open window.
5. **Manual Reset** (if verified healthy): Trigger an on-demand sync from the Cloud Connections dashboard.

---

## 3. Runbook SOP-02: Dead Letter Queue (DLQ) Triage & Manual Task Replay

### Symptoms
- Background sync job exceeds max retry limit (3 retries).
- Worker tab displays non-empty DLQ count.

### Procedure
1. **List DLQ Records**:
   ```bash
   curl -H "x-tenant-id: tenant-cloudpulse-main" http://localhost:3001/api/v1/platform/workers/dlq
   ```
2. **Review Failure Context**: Inspect the error payload, stack trace, and timestamp.
3. **Execute Governed Retry**:
   ```bash
   curl -X POST -H "x-tenant-id: tenant-cloudpulse-main" -H "Authorization: Bearer <OPERATOR_JWT>" \
     http://localhost:3001/api/v1/platform/workers/dlq/<JOB_ID>/retry
   ```
4. **Confirm Resolution**: Verify the task status transitions from `PENDING` to `RETRIED` and DLQ depth returns to 0.

---

## 4. Runbook SOP-03: Platform Maintenance Window Governance

### Scheduling a Maintenance Window
1. Navigate to the `/platform` dashboard or execute:
   ```bash
   curl -X POST -H "Content-Type: application/json" -H "x-tenant-id: tenant-cloudpulse-main" \
     -H "Authorization: Bearer <ADMIN_JWT>" \
     -d '{"title":"Aurora PostgreSQL Minor Upgrade","reason":"Applying security patch v16.3","scope":"DATABASE_MIGRATION"}' \
     http://localhost:3001/api/v1/platform/maintenance
   ```
2. **Conflict Prevention**: Overlapping maintenance windows are rejected by the engine with a 409 conflict error.
3. **Canceling / Completing**:
   ```bash
   curl -X DELETE -H "x-tenant-id: tenant-cloudpulse-main" -H "Authorization: Bearer <ADMIN_JWT>" \
     http://localhost:3001/api/v1/platform/maintenance
   ```

---

## 5. Runbook SOP-04: Disaster Recovery & Rollback Procedures

### Scenario A: Broken Container Image Deployment
1. **Automated Rollback**: The GitHub Actions production pipeline automatically rolls back if the 19-step smoke test fails.
2. **Manual Kubernetes Rollback**:
   ```bash
   kubectl rollout undo deployment/cloudpulse-api -n cloudpulse
   kubectl rollout undo deployment/cloudpulse-web -n cloudpulse
   ```
3. **Helm Rollback**:
   ```bash
   helm rollback cloudpulse -n cloudpulse
   ```

### Scenario B: Database Aurora Point-in-Time Recovery (PITR)
1. Initiate PITR restore in AWS RDS Console to a target timestamp prior to corruption.
2. Update the Kubernetes Secret `cloudpulse-secrets` with the new Aurora endpoint:
   ```bash
   kubectl create secret generic cloudpulse-secrets \
     --from-literal=DATABASE_URL="postgres://user:pass@aurora-restored.cluster.us-east-1.rds.amazonaws.com:5432/cloudpulse" \
     --dry-run=client -o yaml | kubectl apply -n cloudpulse -f -
   ```
3. Restart API pods:
   ```bash
   kubectl rollout restart deployment/cloudpulse-api -n cloudpulse
   ```
4. Verify `/health/dependencies` confirms database pool health.
