# CLOUDPULSE — Site Reliability Engineering (SRE) Architecture

## 1. Overview & Vision
CLOUDPULSE transforms raw distributed telemetry (Metrics, Logs, Traces) into actionable SRE intelligence, enabling automated error budget tracking, multi-window burn rate alerting, structured incident response, operational runbooks, and continuous postmortem learning.

---

## 2. SRE Lifecycle Flow

```mermaid
flowchart TB
    subgraph TelemetryLayer["1. Distributed Telemetry Layer"]
        Metrics["Prometheus TSDB Metrics\n(Golden Signals)"]
        Logs["Grafana Loki Log Streams\n(Correlated Logs)"]
        Traces["Grafana Tempo Traces\n(W3C Span Trees)"]
    end

    subgraph SreEngine["2. SRE Analysis Engine"]
        SLIEngine["SLI Engine\n(Availability, Latency, Error Rate)"]
        SLOEngine["SLO Engine\n(99.9% Target, Error Budget)"]
        BurnRate["Burn Rate Calculator\n(Short 5m & Long 1h Windows)"]
    end

    subgraph AlertIncident["3. Alerting & Incident Response"]
        Alerts["Multi-Tier Alerts\n(Critical, High, Medium, Low, Info)"]
        Incidents["Incident Lifecycle\n(Triggered -> Investigating -> Mitigating -> Resolved)"]
        Timeline["Chronological Incident Timeline"]
    end

    subgraph RemediationPostmortem["4. Mitigation & Continuous Learning"]
        Runbooks["Operational Runbooks & Commands"]
        AutoRemediation["Safe Automated Remediation\n(Pod Restart, Health Re-probe, Collector Refresh)"]
        AuditLog["Immutable Remediation Audit Log"]
        Postmortems["Blameless Postmortems & 5-Whys"]
        ActionItems["Action Item Tracking (P0 - P3)"]
    end

    TelemetryLayer --> SreEngine
    SLIEngine --> SLOEngine --> BurnRate --> Alerts --> Incidents --> Timeline
    Incidents --> Runbooks --> AutoRemediation --> AuditLog
    Incidents --> Postmortems --> ActionItems
```

---

## 3. Four Golden Signals
1. **Latency**: Round-trip request processing time tracked at P50, P95, and P99 percentiles.
2. **Traffic (Throughput)**: Requests per second (RPS) handled by the ingress and microservice mesh.
3. **Errors**: Ratio of HTTP 5xx responses or unhandled exceptions against total requests.
4. **Saturation**: CPU utilization percentage and memory usage across container tasks and worker nodes.
