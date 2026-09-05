# Dependency Reliability, Cascading Failure Paths & Single Points of Failure (Phase 63)

## 1. Dependency Reliability Modeling

Modern cloud-native services do not fail in isolation. A failure in a downstream database, third-party payment gateway, or IAM identity provider cascades upward across the topology.

CLOUDPULSE models dependencies across multi-cloud and Kubernetes topologies with explicit evidence classification:
- `CONFIRMED`: Real trace-span calls observed via distributed tracing (Tempo / OpenTelemetry).
- `DERIVED`: Network flow or service mesh telemetry (Envoy access logs / VPC Flow Logs).
- `INFERRED`: Infrastructure relationship from Knowledge Graph (e.g. EC2 instance attached to RDS cluster).

---

## 2. Cascading Failure Risk Analysis

### 2.1 Propagation Probability Formulation
The probability that a failure in dependency $D$ propagates to service $S$ is modeled as:

$$P_{\text{cascade}}(S \leftarrow D) = P_{\text{fail}}(D) \times (1 - C_{\text{resilience}}(S, D)) \times W_{\text{criticality}}(S, D)$$

Where:
- $P_{\text{fail}}(D)$: Measured failure rate or error rate of dependency $D$.
- $C_{\text{resilience}}(S, D)$: Resilience coefficient ($0.0 \le C \le 1.0$) determined by circuit breakers, fallbacks, retry budgets, and timeouts.
- $W_{\text{criticality}}(S, D)$: 1.0 for hard synchronous dependencies, 0.3 for asynchronous queues / background tasks.

### 2.2 Blast Radius & Propagation Paths
When a Tier-0 or Tier-1 service experiences high error rates, CLOUDPULSE traverses the upstream dependency graph to identify all affected consumer services:

```
[payment-service] (Degraded / High Latency)
       │
       ├──► [order-service] (Upstream: HTTP 504 Gateway Timeouts)
       │           │
       │           └──► [api-gateway] (Upstream: Ingress Rejections)
       │
       └──► [customer-billing-worker] (Upstream: Queue Backlog Accumulation)
```

---

## 3. Single Point of Failure (SPOF) Analysis

A component is flagged as an **SRE Single Point of Failure (SPOF)** if:
1. It supports Tier-0 or Tier-1 critical business paths.
2. It lacks active-active multi-region or multi-AZ redundancy.
3. A failure causes immediate service outage without automated failover.

### 3.1 SPOF Evaluation Matrix

| SPOF Entity | Affected Services | Failure Domain | Impact | Mitigation Status | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `rds-prod-postgres-primary` | `payment-service`, `order-service` | `AWS:us-east-1` (Single-AZ) | High Latency & Outage | `PARTIALLY_MITIGATED` | Enable Multi-AZ standby replica with automatic DNS failover |
| `azure-vault-production-eastus` | `auth-service` | `Azure:eastus` (Single Region) | Secret Retrieval Lockout | `UNMITIGATED` | Configure Azure Key Vault multi-region disaster recovery replication |
| `k8s-coredns-deployment` | All Cluster Workloads | `K8s:kube-system` | Cluster DNS Outage | `MITIGATED` | Deployed across 3 replicas with anti-affinity and NodeLocal DNSCache |

---

## 4. Failure Domain Concentration

CLOUDPULSE aggregates services and critical workloads by cloud provider, region, and availability zone to evaluate concentration risk:

$$\text{Concentration Risk Index} = \frac{\sum_{\text{tier}=0,1} \text{Workloads in Domain } D}{\text{Total Tier 0,1 Workloads}}$$

If $> 60\%$ of Tier-0 services reside in a single failure domain (e.g. `aws:us-east-1`), the platform raises an architectural resilience alert.

---

## 5. Release Risk Guard & Error Budget Gating

The **Release Risk Guard** acts as an automated CI/CD deployment gate:

```
[Incoming CI/CD Release Candidate]
                │
                ▼
[Release Risk Guard Evaluator]
  ├─ Error Budget Status: Remaining % >= 20%?
  ├─ SLO Compliance: All SLOs in ACHIEVING state?
  ├─ Active Incidents: 0 linked SEV-1/SEV-2 incidents?
  ├─ Burn Rate: 1h burn rate < 2.0x?
  └─ Dependency Health: No upstream cascading failures?
                │
        ┌───────┴───────┐
        ▼               ▼
    [PASS / WARN]    [BLOCK]
   Deploy Allowed   Deploy Frozen until Budget / Stability Restored
```

---

## 6. Fresh-Read Post-Remediation Verification

After an operator or auto-remediation triggers an action (e.g., pod restart, replica scaling, cache eviction), CLOUDPULSE executes fresh-read verification:
1. Queries live telemetry directly with cache-bypassing fresh read timestamp.
2. Compares pre-remediation vs current fresh metric readings against SLO thresholds.
3. Classifies outcome into `RECOVERED`, `PARTIALLY_RECOVERED`, or `NOT_RECOVERED`.
4. Records an immutable audit log entry for compliance and postmortem tracking.
