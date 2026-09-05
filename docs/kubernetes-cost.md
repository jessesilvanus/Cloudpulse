# CLOUDPULSE — Kubernetes & EKS FinOps Cost Optimization

## 1. Amazon EKS Monthly Cost Breakdown (`us-east-1`)

| Component | Sizing & Allocation | Monthly Cost | Cost Category | FinOps Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **EKS Control Plane** | 1 Managed Cluster | **$73.00 / mo** ($0.10/hr) | Fixed | Fixed AWS fee. Share single cluster across non-production namespaces. |
| **EC2 Spot Worker Nodes** | 2 $\times$ `t3.medium` Spot (2 vCPU, 4GB) | **~$12.50 / mo** | Compute | Spot instances save ~70% over on-demand ($0.0085/hr vs $0.0416/hr). |
| **AWS Application Load Balancer** | 1 Ingress ALB | **~$18.00 / mo** + LCU | Ingress | Ingress controller shares 1 ALB across all services via path routing. |
| **EBS Storage (Persistent Volumes)** | 3 $\times$ 10Gi `gp3` Volumes | **~$2.40 / mo** | Storage | Persistent TSDB storage for Prometheus, Loki, and Tempo. |
| **Amazon ECR** | 6 Repositories (~10 GB images) | **~$1.00 / mo** | Registry | Automated 14-day untagged image expiration. |
| **CloudWatch EKS Logs** | Control plane log streams | **~$3.00 / mo** | Observability | 30-day retention policy. |
| **Total Base EKS Cost** | **With Spot Worker Nodes** | **~$109.90 / month** | Total | Economical multi-node Kubernetes cluster. |

---

## 2. FinOps Rules for EKS

1. **Use Spot Capacity**: Always configure `capacity_type = "SPOT"` for dev, staging, and portfolio EKS clusters.
2. **Consolidate Ingress**: Never use `type: LoadBalancer` on every Service (which creates a separate $18/mo ALB per service). Use a single Ingress controller.
3. **Automated HPA Scaling**: Pods scale out on load and scale back to baseline replicas when traffic subsides.
4. **Teardown Command**:
```bash
terraform destroy -target=module.eks -auto-approve
```
