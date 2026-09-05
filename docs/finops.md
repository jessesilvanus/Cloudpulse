# CLOUDPULSE — Cloud Cost Intelligence & FinOps Operating Model

## 1. FinOps Architecture

CLOUDPULSE provides continuous cloud cost visibility, budget enforcement, and resource optimization across AWS infrastructure and Kubernetes workloads.

```mermaid
flowchart TB
    subgraph DataSources["1. Cloud Cost Sources"]
        AWSBilling["AWS Cost Explorer / CUR\n(Classification: REAL)"]
        K8sUsage["Kubernetes Node & Pod Allocation\n(Classification: ESTIMATED)"]
        DemoProv["Local Cost Provider\n(Classification: DEMO)"]
    end

    subgraph Normalization["2. Ingestion & Normalization Layer"]
        Engine["FinOps Normalization Engine\n(Currency, Dates, Dimensional Grouping)"]
    end

    subgraph Intelligence["3. Analytics & Optimization Engine"]
        Alloc["Cost Allocation (Env, Team, Service)"]
        Budgets["Multi-Threshold Budget Gate (80% / 95% / 100%)"]
        Anomalies["Statistical Anomaly Detector (>2.5σ Deviation)"]
        Forecast["Run-Rate Month-End Projection"]
        Rightsizing["Resource Rightsizing & Waste Detection"]
    end

    subgraph Presentation["4. SRE & FinOps Console"]
        UI["SRE & FinOps Dashboard\n(Real vs Estimated Data Indicators)"]
    end

    DataSources --> Normalization --> Intelligence --> Presentation
```

---

## 2. FinOps Principles
1. **Truth in Data Classification**: Every cost metric is explicitly tagged as `REAL` (AWS Billing API), `ESTIMATED` (Kubernetes allocation), or `DEMO` (local provider).
2. **Safe Optimization Only**: Rightsizing recommendations are strictly `REVIEW_REQUIRED`; no automated destructive downsizing.
3. **SRE & FinOps Alignment**: Correlating infrastructure cost changes with deployment events, scaling policies, and availability SLOs.
