# CLOUDPULSE — Operational Runbooks & Safe Automated Remediation

## 1. Runbook Structure
Every production alert links directly to a standardized operational runbook containing:
1. **Symptoms**: Observable telemetry anomalies.
2. **Possible Causes**: Known system failure patterns.
3. **Investigation Steps**: Exact queries in Prometheus, Loki, and Tempo.
4. **Diagnostic Commands**: Copyable CLI commands.
5. **Mitigation Steps**: Safe recovery operations.
6. **Escalation Path**: On-call ownership.
7. **Recovery Verification**: Success criteria.

---

## 2. Safe Automated Remediations

| Action ID | Action Name | Target Service | Safety Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| `act-restart-payment` | Restart Payment Service | `payment-service` | `safe_automatic` | Graceful rolling restart of payment pods to clear deadlock |
| `act-probe-health` | Force Health Probe | `all` | `safe_automatic` | Immediate health probe across all microservices |
| `act-refresh-collector`| Refresh OTel Pipeline | `otel-collector` | `safe_automatic` | Clears collector buffer memory |

**Audit Guarantee**: All automated and manual remediation actions write an immutable record to the Remediation Audit Log.
