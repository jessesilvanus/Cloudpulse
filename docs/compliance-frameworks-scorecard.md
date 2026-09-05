# CLOUDPULSE: Industry Compliance Frameworks & Governance Scorecard

---

## 1. Compliance Framework Control Mappings

| Compliance Framework | Control ID | Control Name | Mapped Policies | Passing | Failing | Compliance Rate |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| **SOC 2 Type II** | `CC6.1` | Logical Access & Container Integrity | `pol-signed-images`, `pol-nonroot-containers` | $3$ | $0$ | **`100.0%`** |
| **ISO / IEC 27001** | `A.12.1.2` | Change Management & Secure Supply Chain | `pol-signed-images` | $3$ | $0$ | **`100.0%`** |
| **CIS Kubernetes Benchmark** | `CIS-5.2.6` | Minimize the admission of root containers | `pol-nonroot-containers` | $3$ | $0$ | **`100.0%`** |

---

## 2. Governance Scorecard Formulation

$$\text{Governance Score} = 0.25 \times \text{Compliance Rate} + 0.25 \times \text{Policy Coverage} + 0.20 \times \text{Ownership} + 0.15 \times \text{Exceptions} + 0.15 \times \text{Evidence}$$

- **Overall Governance Score**: **`96.2 / 100`**
- **Compliance Rate**: **`95.0%`**
- **Policy Coverage**: **`100.0%`**
- **Ownership Coverage**: **`100.0%`**
- **Evidence Attestation**: **`100.0%`**
