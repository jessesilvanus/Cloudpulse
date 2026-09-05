# CLOUDPULSE: Savings Opportunities & Verified Realized Savings Workflow

---

## 1. Savings Verification Lifecycle

$$\text{Identified Opportunity} \longrightarrow \text{Operator Approval} \longrightarrow \text{Execution Playbook} \longrightarrow \text{Post-Change Telemetry} \longrightarrow \text{Verified Realized Savings}$$

---

## 2. Active Opportunities & Verified Savings

- **Active Opportunities**:
  - `opp-rds-storage-tiering`: Aurora automated storage tiering ($+\$65.00/\text{mo}$, $92\%$ confidence).
  - `opp-k8s-pod-rightsizer`: Kubernetes container memory rightsizing ($+\$45.00/\text{mo}$, $88\%$ confidence).
  - `opp-nat-gateway-consolidation`: Staging NAT gateway consolidation ($+\$75.00/\text{mo}$, $95\%$ confidence).
- **Verified Realized Savings**:
  - `sav-pg-index-tune`: PostgreSQL index tuning (Baseline: $\$320/\text{mo}$, Post-change: $\$240/\text{mo}$, Verified: **`$80.00/mo`**, Status: `VERIFIED`).
  - `sav-orphan-ebs-purge`: Unattached EBS volume cleanup (Baseline: $\$180/\text{mo}$, Post-change: $\$75/\text{mo}$, Verified: **`$105.00/mo`**, Status: `VERIFIED`).
