# CLOUDPULSE: SRE Operational Runbooks & Reliability Workflows

---

## 1. Operational Runbooks Catalog

### 1. `rb-lat-001`: High Ingress Latency Mitigation & Pod Scaling
- **Trigger**: P95 latency $> 120\text{ms}$ for 3 consecutive 1-minute evaluation windows.
- **Steps**:
  1. *Automated Diagnostic*: Query upstream microservice response times via OTel span waterfall (`SAFE`).
  2. *Automated Diagnostic*: Inspect Kubernetes HPA replica counts and CPU metrics (`SAFE`).
  3. *Operator Action*: Scale horizontal pod replicas ($+2$) if CPU saturation $> 70\%$ (`LOW_RISK`).

### 2. `rb-err-002`: Order Service Connection Pool Exhaustion Recovery
- **Trigger**: HTTP 500 error rate $> 0.5\%$ over 5-minute window.
- **Steps**:
  1. *Automated Diagnostic*: Capture active PostgreSQL/Redis connection pool metrics (`SAFE`).
  2. *Operator Action*: Execute graceful pod rolling restart under SRE supervision (`HIGH_RISK`).

---

## 2. On-Call Handoff Summary Structure

Every shift handoff generates an automated summary comprising:
- Active incidents & P1/P2 resolution statuses
- Monitored microservice health and tier classifications
- Breached or at-risk SLOs and remaining error budget percentages
- Top capacity and dependency findings scheduled for remediation
