# CLOUDPULSE: Compliance Frameworks & Control Mappings

---

## 1. Supported Frameworks & Control Matrix

| Framework Name | Category | Support Level | Passing / Total Controls | Posture Score |
| :--- | :---: | :---: | :---: | :---: |
| `CIS Amazon Web Services Foundations Benchmark v2.0` | CIS | `SUPPORTED` | $16 / 18$ | **88.9%** |
| `NIST Special Publication 800-53 Revision 5` | NIST | `SUPPORTED` | $13 / 14$ | **92.8%** |
| `SOC 2 Type II Security & Availability Controls` | SOC2 | `PARTIALLY_SUPPORTED` | $9 / 11$ | **81.8%** |

---

## 2. Core Control Mappings

- **`CIS-AWS-1.16` (IAM MFA)**: Enforce hardware or virtual MFA on all identities with console passwords (`COMPLIANT`).
- **`NIST-SC-28` (KMS Encryption)**: Enforce customer-managed KMS encryption across databases and snapshots (`NON_COMPLIANT`).
- **`K8S-PSS-01` (Non-Root Execution)**: Require containers to run as non-root UID $> 1000$ (`PARTIAL`).
