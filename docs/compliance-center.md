# CLOUDPULSE — Compliance Center & Framework Alignment

## 1. Compliance Framework Mappings

| Framework | Version | Target Domain | Passing Controls | Evaluation Status |
| :--- | :---: | :--- | :---: | :---: |
| **`CIS Amazon Web Services Benchmark`** | `v2.0.0` | Cloud IAM, S3 Encryption, CloudTrail | $4 / 4$ | **`COMPLIANT`** |
| **`CIS Kubernetes Benchmark`** | `v1.8.0` | Pod Security Standards, Network Isolation | $3 / 3$ | **`COMPLIANT`** |
| **`NIST SP 800-53 Rev. 5`** | `Rev 5` | Access Control, Identification, Contingency | $3 / 4$ | **`PARTIAL (90%)`** |
| **`ISO/IEC 27001:2022`** | `2022` | Information Security Controls & Governance | $3 / 3$ | **`COMPLIANT`** |

---

## 2. Compliance Score Formula

$$\text{Compliance Score} = \frac{\sum \text{Passing Controls} + (0.5 \times \sum \text{Partial Controls})}{\text{Total Evaluated Controls}} \times 100$$
- `UNKNOWN` controls are never evaluated as `PASS`.
