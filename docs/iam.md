# CLOUDPULSE — AWS IAM & GitHub Actions OIDC Security

## 1. Least-Privilege IAM Architecture

```mermaid
flowchart LR
    GitHubActions["GitHub Actions CI/CD"] -->|OIDC Token Exchange| AWS_OIDC["AWS OIDC Identity Provider\n(token.actions.githubusercontent.com)"]
    AWS_OIDC -->|sts:AssumeRoleWithWebIdentity| DeployRole["cloudpulse-production-deployer Role"]
    DeployRole -->|Push Image| ECR["Amazon ECR Repositories"]
    DeployRole -->|Update Cluster| EKS["Amazon EKS Cluster"]

    ECSTasks["ECS / EKS Pod Workloads"] -->|Task Role| AppRole["cloudpulse-production-ecs-task Role"]
    AppRole -->|Push Logs & Metrics| CloudWatch["Amazon CloudWatch"]
    AppRole -->|Fetch Config| SSM["AWS SSM (/cloudpulse/production/*)"]
```

---

## 2. Policy Boundaries
- **Zero AdministratorAccess**: No roles or users grant wildcard `*` permissions.
- **Resource Scoping**: SSM parameter access is strictly restricted to the `/cloudpulse/production/*` namespace prefix.
- **OIDC Condition Keys**: GitHub deployment role requires matching exact repository and environment claims (`repo:cloudpulse/cloudpulse:environment:production`).
