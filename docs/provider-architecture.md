# CLOUDPULSE — Provider Architecture & Adapter Interface

## 1. Provider Adapter Specification

Every cloud integration implements the `CloudProviderAdapter` contract:

```typescript
export interface CloudProviderAdapter {
  provider: CloudProviderType;
  getAccount(): CloudAccount;
  getCapabilities(): ProviderCapabilities;
  getResources(): CloudResource[];
  getCompute(): ComputeResource[];
  getStorage(): StorageResource[];
  getNetworking(): NetworkResource[];
  getKubernetesClusters(): KubernetesCluster[];
}
```

---

## 2. Capabilities & Graceful Degradation
If a provider lacks support for an advanced capability (e.g. detailed cost breakdown in unauthenticated Azure demo mode), the adapter reports `unavailable` or `demo`. The control plane renders honest notices rather than crashing or inventing metrics.
