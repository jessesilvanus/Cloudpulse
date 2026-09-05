# CLOUDPULSE — Disaster Scenarios Catalog

## 1. Disaster Scenarios Catalog

| Scenario ID | Name | Target Component | Failure Type | Expected Self-Healing Behavior | Target RTO | Last Result |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **`SC-001`** | **Single Pod Termination** | `payment-service` | `pod_failure` | ReplicaSet controller schedules replacement pod within 15s. | 30s | `PASSED` |
| **`SC-002`** | **Container Process Crash** | `order-service` | `container_crash` | Kubelet liveness probe detects failure and restarts container. | 30s | `PASSED` |
| **`SC-003`** | **Worker Node Drain** | `k8s-worker-nodes` | `node_drain` | PodDisruptionBudget ensures seamless workload eviction. | 60s | `PASSED` |
| **`SC-004`** | **Bad Deployment Canary** | `api-gateway` | `deployment_failure` | RollingUpdate canary fails readiness probe; pauses rollout. | 45s | `PASSED` |
| **`SC-005`** | **Database Starvation** | `payment-service` | `db_starvation` | Circuit breaker trips; transactions retry gracefully. | 60s | `SIMULATED` |
| **`SC-006`** | **Network Policy Drop** | `api-gateway` | `network_isolation` | Calico NetworkPolicy isolates unauthorized lateral traffic. | 30s | `SIMULATED` |
