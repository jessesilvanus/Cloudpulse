# CLOUDPULSE — Failure Injection Catalog & Simulation Abstraction

## 1. Controlled Failure Injection Catalog

| Failure Type | Target Workload | Simulation Mechanism | Expected System Response |
| :--- | :--- | :--- | :--- |
| **`high_latency`** | `payment-service` | Injected 1500ms delay | Saga coordinator triggers timeout & graceful 504. |
| **`pod_failure`** | `order-service` | SIGTERM pod kill | Kubernetes ReplicaSet launches replacement within 15s. |
| **`container_crash`**| `api-gateway` | Process unresponsiveness | Kubelet liveness probe detects failure and restarts container. |
| **`node_drain`** | EKS Worker Node | `kubectl drain` simulation | Pods evict smoothly to healthy nodes respecting PDBs. |
| **`deployment_failure`**| `api-gateway` | Broken canary pod | Readiness probe fails; RollingUpdate halts automatically. |

---

## 2. Failure Injector Abstraction

```typescript
export interface FailureInjector {
  validate(target: string): Promise<boolean>;
  prepare(experiment: ChaosExperiment): Promise<void>;
  execute(experiment: ChaosExperiment): Promise<ExecutionResult>;
  rollback(experiment: ChaosExperiment): Promise<void>;
  status(experimentId: string): Promise<ExperimentStatus>;
}
```
