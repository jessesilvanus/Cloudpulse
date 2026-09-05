# CLOUDPULSE — Vendor Lock-in & Dependency Analysis

## 1. Proprietary Service Dependency Audit

| Domain | CloudPulse Implementation | Proprietary Alternative | Lock-In Rating |
| :--- | :--- | :--- | :---: |
| **Compute & Runtime** | Open Container Initiative (OCI) Docker Containers on Kubernetes | AWS Lambda / ECS Proprietary Task Definitions | **`LOW`** |
| **Telemetry Ingestion** | OpenTelemetry SDK, W3C Tracing, Prometheus, Loki | AWS CloudWatch Logs Insights, X-Ray | **`LOW`** |
| **Ingress Routing** | Standard Ingress / Nginx / Envoy Gateway | AWS API Gateway Custom Extensions | **`LOW`** |
| **Database Access** | Wire-compatible standard PostgreSQL connection strings | DynamoDB / Aurora Serverless proprietary APIs | **`LOW`** |
| **IAM Authentication** | OAuth2 / OIDC / Kubernetes ServiceAccounts | AWS IAM exclusive instance profile bindings | **`MEDIUM`** |
