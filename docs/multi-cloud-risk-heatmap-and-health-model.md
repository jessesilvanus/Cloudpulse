# CLOUDPULSE Multi-Cloud Risk Heatmap & Health Model

## Overview

The **CLOUDPULSE Multi-Cloud Risk Heatmap & Health Model** provides executive leadership, SecOps, SRE, and FinOps teams with a single pane of glass to immediately understand risk concentration across providers (AWS, Azure, GCP, Kubernetes), geographical regions, clusters, and business services.

---

## 6-Pillar Enterprise Risk Matrix

Every resource, service, and provider is continuously evaluated across 6 critical operational pillars:

| Pillar | Focus Area | Source Engines | Scoring Metric |
| :--- | :--- | :--- | :--- |
| **Security** | Vulnerabilities, IAM overprivilege, exposed ports, compliance violations | `RealCloudSecurityEngine` | Severity-weighted findings count + Blast Radius score |
| **Reliability** | SLO error budget burn, service latency, pod restarts, crashloops | `SreReliabilityControlEngine` | Error budget depletion rate + MTBF degradation |
| **Governance** | Policy drift, untagged assets, unauthorized configuration changes | `EnterpriseWorkflowEngine` | Non-compliant resource ratio (%) |
| **FinOps** | Idle waste, unattached disks, forecast budget overruns, unit economics | `RealMultiCloudFinOpsEngine` | Unallocated spend ($) + Projected budget variance (%) |
| **Resilience** | Single points of failure (SPOF), backup staleness, RTO/RPO gaps | `RealCloudResilienceEngine` | Recovery capability score + SLA breach risk |
| **Operations** | Outdated runbooks, pending approvals, unverified remediations | `EnterpriseWorkflowEngine` | MTTR velocity + Operational debt index |

---

## Heatmap Cell Risk Formulation

Each cell $C(entity, pillar)$ in the heatmap matrix is assigned a numeric risk score $R \in [0, 100]$:

$$R = \min\left(100, \sum_{i=1}^{n} w_i \cdot \text{Impact}(f_i) \times \text{ExposureFactor}(entity)\right)$$

Where:
- $\text{Impact}(f_i)$: Base impact of finding or anomaly $f_i$ (e.g., Critical = 40, High = 20, Medium = 10, Low = 2).
- $\text{ExposureFactor}(entity)$: Multiplier based on internet exposure, tier-1 criticality, and production environment ($1.0 - 2.5$).

### Risk Level Categorization

| Risk Score Range | Heatmap Level | Visual Indicator | Action Requirement |
| :--- | :--- | :--- | :--- |
| **75 - 100** | `CRITICAL` | Deep Red (`#dc2626`) | Immediate P0 executive incident mobilization |
| **50 - 74** | `HIGH` | Amber-Red (`#ea580c`) | Priority decision required within 4 hours |
| **25 - 49** | `MEDIUM` | Yellow (`#eab308`) | Backlog remediation item |
| **0 - 24** | `LOW` | Green (`#16a34a`) | Nominal operational state |

---

## Global Multi-Cloud Health Formulation

The Global Cloud Health Index ($H_{global} \in [0, 100]$) is computed as an inversely proportional function of cross-pillar risk across active connected estates:

$$H_{global} = 100 - \sum_{p \in \text{Pillars}} \alpha_p \cdot \bar{R}_p$$

Where:
- $\alpha_p$: Pillar weight ($\alpha_{sec} = 0.25, \alpha_{rel} = 0.25, \alpha_{res} = 0.20, \alpha_{fin} = 0.15, \alpha_{gov} = 0.10, \alpha_{ops} = 0.05$).
- $\bar{R}_p$: Normalized mean risk score across all connected providers for pillar $p$.

### Health State Transitions

- **`HEALTHY` ($H \ge 90$)**: All systems operational with negligible risk.
- **`DEGRADED` ($70 \le H < 90$)**: Isolated P1/P2 issues or single-pillar degradation.
- **`CRITICAL` ($H < 70$)**: Active P0 situation, multi-region degradation, or severe security breach.

---

## Real-Time Data Freshness & Provider Coverage Telemetry

To ensure decision makers never act on stale or incomplete data, the health model continuously computes:
1. **Telemetry Freshness**: Maximum and average age of data ingested from AWS CloudWatch/SecurityHub, Azure Monitor, GCP Operations, and K8s API.
2. **Provider Coverage %**: Total active accounts and clusters currently streaming valid telemetry vs configured targets.
3. **Truth-in-Labeling Markers**: Every metric card and heatmap cell explicitly renders its derivation status (`LIVE`, `DERIVED`, `FIXTURE`).
