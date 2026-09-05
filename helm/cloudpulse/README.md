# CLOUDPULSE Helm Chart

## Overview
This Helm chart packages the complete CLOUDPULSE SRE Console, API Gateway, microservice mesh (`api-gateway`, `order-service`, `payment-service`, `traffic-generator`), and telemetry pipeline (`otel-collector`, `prometheus`, `loki`, `tempo`) for Kubernetes and Amazon EKS.

---

## Quick Start

```bash
# Add/update local repository dependencies
helm lint ./helm/cloudpulse

# Install development environment (single-replica, lightweight)
helm install cloudpulse ./helm/cloudpulse -f ./helm/cloudpulse/values-dev.yaml -n cloudpulse --create-namespace

# Install production environment on Amazon EKS (multi-replica, HPA, ALB ingress)
helm install cloudpulse ./helm/cloudpulse -f ./helm/cloudpulse/values-prod.yaml -n cloudpulse --create-namespace
```

---

## Configuration Matrix

| Parameter | Description | Default |
| :--- | :--- | :--- |
| `global.environment` | Deployment stage (`development` / `production`) | `production` |
| `web.replicaCount` | Replicas for SRE Console Web SPA | `2` |
| `web.autoscaling.enabled` | Enable HorizontalPodAutoscaler for Web | `true` |
| `api.replicaCount` | Replicas for Telemetry API Gateway | `2` |
| `api.autoscaling.enabled` | Enable HorizontalPodAutoscaler for API | `true` |
| `ingress.className` | Ingress class (`nginx` for local, `alb` for AWS) | `nginx` |
| `networkPolicy.enabled` | Enforce zero-trust pod isolation | `true` |
