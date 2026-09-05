# CLOUDPULSE: Governed Policy Exceptions & Compensating Controls

---

## 1. Exception Governance Lifecycle

$$\text{Request} \longrightarrow \text{Compensating Control Review} \longrightarrow \text{CISO Approval} \longrightarrow \text{Active with Expiration} \longrightarrow \text{Auto-Expiration}$$

- **Zero Permanent Silent Bypasses**: All policy exceptions require an explicit `expiresAt` timestamp and verified `compensatingControl`.
- **Active Exception**: `exc-legacy-auth-bypass-01` (Compensating control: Build VPC CIDR restriction `10.0.128.0/24`, expires `2026-09-30`).
