# CLOUDPULSE: Just-In-Time (JIT) Access Requests & Approval Workflows

---

## 1. JIT Access Lifecycle

$$\text{Request} \longrightarrow \text{Risk Assessment} \longrightarrow \text{Separation of Duties Approval} \longrightarrow \text{Auto-Expiration} \longrightarrow \text{Audit Log}$$

- **Separation of Duties Enforcement**: The engine strictly forbids self-approval (`requester !== approver`).
- **Time-Bounded Grants**: Access is granted with explicit auto-expiration timestamps (e.g., $30\text{ minutes}$ for emergency schema read).
