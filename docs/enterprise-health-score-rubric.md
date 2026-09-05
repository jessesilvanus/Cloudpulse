# CLOUDPULSE: Enterprise Health Score Rubric & Mathematical Formulation

---

## 1. Mathematical Formulation

$$\text{Enterprise Health} = \sum_{i=1}^{6} w_i \cdot S_i$$

Where:
- $w_{\text{rel}} = 0.25$ (Reliability & Availability: **$92.0$**)
- $w_{\text{sec}} = 0.20$ (Zero Trust Security: **$88.0$**)
- $w_{\text{res}} = 0.15$ (Disaster Recovery & Resilience: **$91.0$**)
- $w_{\text{inf}} = 0.15$ (Infrastructure & Kubernetes: **$90.0$**)
- $w_{\text{cmp}} = 0.15$ (Compliance & Governance: **$84.0$**)
- $w_{\text{fin}} = 0.10$ (FinOps & Unit Economics: **$80.0$**)

$$\text{Enterprise Health Score} = 0.25(92) + 0.20(88) + 0.15(91) + 0.15(90) + 0.15(84) + 0.10(80) = \mathbf{88.4 / 100}$$
