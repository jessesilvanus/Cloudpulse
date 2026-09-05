# CLOUDPULSE — Cost Allocation, Tagging Governance & Multi-Cloud Normalization

## 1. Kubernetes Workload Cost Allocation Formula

Because AWS bills at the EC2 node level rather than individual pods, CLOUDPULSE calculates estimated pod cost using weighted CPU and memory reservation:

$$\text{Cost}_{\text{Pod}} = \left[ 0.60 \times \left(\frac{\text{CPU Requested}}{\text{Node Total CPU}}\right) + 0.40 \times \left(\frac{\text{Memory Requested}}{\text{Node Total Memory}}\right) \right] \times \text{Node Hourly Cost} \times 730\text{ hours}$$

---

## 2. Tagging Governance & Coverage Scoring
- **Mandatory Tags**: `environment`, `team`, `service`, `owner`.
- **Current Coverage**: **`91.7%`** (22 of 24 cloud resources fully tagged).
- **Non-Compliant Resources**: Audited and flagged in the FinOps dashboard with automated remediation recommendations.

---

## 3. Dimensional Allocation Breakdowns
- **By Environment**: Production ($72\%$), Staging ($18\%$), Development ($10\%$).
- **By Team**: Platform Engineering ($45\%$), Checkout Saga ($35\%$), SRE & Observability ($20\%$).
- **Allocation Confidence**: `DIRECT` (AWS CUR API), `TAGGED` (Kubernetes labels), `INFERRED` (multi-tenant ALB traffic split).

