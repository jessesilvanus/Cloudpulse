# CLOUDPULSE — Amazon EKS Production Orchestration Guide

## 1. Overview
This document details the production Amazon EKS deployment architecture for CLOUDPULSE, including Managed Node Groups with Spot instances, AWS Load Balancer Controller integration, and IAM Roles for Service Accounts (IRSA).

---

## 2. EKS Cluster Architecture

- **Kubernetes Version**: `1.30`
- **Control Plane**: Highly available across 3 Availability Zones with private and public endpoint access enabled.
- **Worker Node Groups**: AWS Managed Node Group deployed in private subnets across `us-east-1a` and `us-east-1b`.
- **Spot Instance Optimization**: `capacity_type = "SPOT"` using `t3.medium` instances (2 vCPU, 4 GB RAM), reducing worker node compute cost by ~70%.

---

## 3. AWS Load Balancer Controller & Ingress Routing

The Kubernetes Ingress object is reconciled by the AWS Load Balancer Controller to automatically provision an Application Load Balancer (ALB) with IP-mode target groups:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cloudpulse-ingress
  namespace: cloudpulse
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/healthcheck-path: /health
```

---

## 4. Connecting to EKS

```bash
# Update local kubeconfig
aws eks update-kubeconfig --region us-east-1 --name cloudpulse-production-eks

# Verify cluster connectivity
kubectl get nodes -o wide
```
