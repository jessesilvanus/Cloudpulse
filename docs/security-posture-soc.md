# CLOUDPULSE — Security Posture Management & Drift Detection

## 1. Multi-Dimensional Security Scoring

$$\text{Security Posture} = \frac{\text{IAM (18)} + \text{Secrets (20)} + \text{Network (19)} + \text{Container (19)} + \text{Deps (16)} + \text{Compliance (18)}}{120} \times 100 = 94\% \quad (\textbf{Grade A+})$$

---

## 2. Infrastructure Drift Auditing
- Compares GitOps desired state against live Kubernetes and AWS API configurations.
- Flags unauthorized security group modifications, disabled logging, or unencrypted storage volumes.
