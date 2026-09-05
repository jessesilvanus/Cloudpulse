# CLOUDPULSE — Operational Recovery Runbooks

## 1. Kubernetes Pod Failure & CrashLoopBackOff Runbook (`rrb-pod-failure`)

- **Target Failure**: Pod Termination / Repeated CrashLoopBackOff.
- **RTO Target**: $\le 30\text{ seconds}$.
- **Detection**:
  1. Prometheus alert `alt-pod-restarts` firing.
  2. Kubelet pod status reporting `CrashLoopBackOff` or `Error`.
- **Diagnosis**:
  ```bash
  kubectl describe pod <pod-name> -n cloudpulse
  kubectl logs <pod-name> -n cloudpulse --previous
  ```
- **Containment**:
  1. Verify sibling replicas are active in the Kubernetes Service endpoints.
  2. Prevent horizontal autoscaler downscaling during investigation.
- **Recovery Steps**:
  1. If memory leak: Increase container memory limits in Helm `values-prod.yaml`.
  2. If process deadlock: Trigger safe automated pod restart via CLOUDPULSE console.
- **Verification**:
  1. Ensure pod transitions to `Running` and passes readiness probes (`/health/ready`).
  2. Verify transaction latency returns to normal baseline.

---

## 2. Failed Deployment Atomic Rollback Runbook (`rrb-deployment-rollback`)

- **Target Failure**: Elevated 5xx errors following a new release rollout.
- **RTO Target**: $\le 60\text{ seconds}$.
- **Recovery Steps**:
  ```bash
  # Step 1: Pause deployment rollout immediately
  kubectl rollout pause deployment/<service> -n cloudpulse

  # Step 2: Roll back to previous known-good revision
  kubectl rollout undo deployment/<service> -n cloudpulse

  # Step 3: Verify rollout status
  kubectl rollout status deployment/<service> -n cloudpulse
  ```
