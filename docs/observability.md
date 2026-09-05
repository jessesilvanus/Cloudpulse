# CLOUDPULSE — Advanced Observability Architecture

## 1. Master Observability Pipeline

CLOUDPULSE implements a unified three-pillar telemetry pipeline connecting OpenTelemetry distributed tracing, Prometheus TSDB metrics, and Grafana Loki structured logs:

```mermaid
flowchart TB
    subgraph Ingress["1. Application Ingress & Context Injection"]
        Client["Web Client / API Consumer"]
        Gateway["API Gateway (Generates traceId, spanId, requestId)"]
    end

    subgraph ServiceLayer["2. Microservices & Context Propagation"]
        OrderService["Order Service (W3C traceparent propagation)"]
        PaymentService["Payment Service (OTel Spans + Error Traps)"]
        Database["PostgreSQL Database / Storage"]
    end

    subgraph TelemetryEngine["3. Telemetry Ingestion & TSDB Storage"]
        OTLP["OTLP Traces Ingestion (:4318)"]
        Prometheus["Prometheus Metrics TSDB"]
        Loki["Loki Structured Log Indexer"]
    end

    subgraph CorrelationEngine["4. Three-Pillar Correlation & RCA"]
        Correlation["Correlation Engine\n(Trace ID ↔ Log ID ↔ Metric Spike)"]
        ServiceMap["Dynamic Service Map & Health"]
        RCA["Deterministic Root Cause Analysis"]
    end

    Client --> Gateway --> OrderService --> PaymentService --> Database
    Gateway -.-> TelemetryEngine
    OrderService -.-> TelemetryEngine
    PaymentService -.-> TelemetryEngine
    TelemetryEngine --> CorrelationEngine
```

---

## 2. Core Pillars & RED/USE Metrics
- **RED Metrics**: Rate (req/s), Errors (%), Duration (P50, P90, P95, P99) per microservice.
- **USE Metrics**: Utilization (%), Saturation (%), Errors (count) across Kubernetes nodes and pods.
