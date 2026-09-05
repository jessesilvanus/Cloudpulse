# CLOUDPULSE: Parameterized Resource Templates & Versioning

---

## 1. Golden Path Kubernetes Template (`tmpl-k8s-001`)

```yaml
id: tmpl-k8s-001
name: microservice-workload
version: v2.4.0
category: KUBERNETES
parameters:
  - name: serviceName
    type: text
    required: true
  - name: replicas
    type: number
    default: 3
  - name: cpuLimit
    type: select
    allowedValues: ["250m", "500m", "1000m"]
defaults:
  replicas: 3
  cpuLimit: "500m"
  memoryLimit: "512Mi"
policies:
  - require-team-tag
  - enforce-non-root-user
  - deny-privileged-container
securityRequirements:
  - readOnlyRootFilesystem
  - dropAllCapabilities
costModel:
  baseMonthlyCost: 35.00
  currency: USD
provisioningWorkflow: k8s-helm-operator-v2
rollbackStrategy: kubectl rollout undo deployment/${serviceName}
verificationStrategy: curl /health/ready probe & 3 consecutive HTTP 200 responses
```
