# CLOUDPULSE — Kubernetes Security Operations & Pod Sandboxing

## 1. Kubernetes SOC Controls

1. **Non-Root Execution**: Enforced `runAsNonRoot: true` and `runAsUser: 1000` (node) / `101` (nginx) across all manifests.
2. **Read-Only Root Filesystem**: Temporary directories isolated to memory-backed `emptyDir` mounts.
3. **Capabilities Dropped**: `ALL` Linux capabilities explicitly dropped in `securityContext`.
4. **NetworkPolicy Isolation**: Default-deny ingress with explicit service mesh whitelist.
5. **Runtime Auditing**: Ingestion of Kubernetes API audit logs to detect unauthorized secret access and exec probes.
