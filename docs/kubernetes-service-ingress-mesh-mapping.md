# CLOUDPULSE: Kubernetes Service Discovery, Ingress & Mesh Mapping

---

## 1. End-to-End Ingress & Mesh Pipeline

$$\text{Client} \longrightarrow \text{K8s Ingress (ALB/Nginx)} \longrightarrow \text{API Gateway Pod} \longrightarrow \text{Istio Envoy Sidecar} \longrightarrow \text{Backend Service (ClusterIP)}$$

- **ClusterIP Services**:
  - `api-gateway.cloudpulse-prod.svc.cluster.local:4000`
  - `order-service.cloudpulse-prod.svc.cluster.local:4001`
  - `payment-service.cloudpulse-prod.svc.cluster.local:4002`
