# CLOUDPULSE — Network Security & Zero-Trust Isolation

## 1. VPC Network Segmentation

- **Public Subnets** (`10.0.0.0/20`, `10.0.16.0/20`): Contain Internet-facing Application Load Balancers only.
- **Private Subnets** (`10.0.64.0/20`, `10.0.80.0/20`): Contain all container workloads, ECS tasks, and EKS worker nodes. No public IPv4 addresses assigned.

---

## 2. Kubernetes Zero-Trust NetworkPolicies

Every microservice in namespace `cloudpulse` is isolated by Kubernetes NetworkPolicies:

```
[Ingress Controller]
        │ (TCP 80, 3001, 4000)
        ▼
 [Web / API / Gateway]
        │ (TCP 4001)
        ▼
  [Order Service]
        │ (TCP 4002)
        ▼
 [Payment Service]
        │ (OTLP 4317 / 4318)
        ▼
[OTel Collector & TSDBs]
```

- Inbound connections from unauthorized pods or namespaces are **blocked by default**.
