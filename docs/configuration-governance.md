# CLOUDPULSE — Configuration Governance & Drift Detection

## 1. Multi-Cloud Tag Governance

CLOUDPULSE enforces required resource metadata tags across AWS, Azure, GCP, and Kubernetes:
- `Environment`: (`production` / `staging` / `development`)
- `Project`: `cloudpulse`
- `Owner`: Designated team email or service principal
- `CostCenter`: Aligned FinOps allocation center

---

## 2. Infrastructure Drift Detection
- Detects discrepancies between declared Terraform/Kubernetes manifests and live cloud provider APIs.
- Flags unapproved manual changes, security group port exposure, and untagged resources.
