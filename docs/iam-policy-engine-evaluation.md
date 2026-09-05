# CLOUDPULSE: IAM Policy Evaluation Engine & Decision Logic

---

## 1. Evaluation Algorithm

$$\text{Identity} + \text{Action} + \text{Resource} + \text{Context} \longrightarrow \text{Policy Engine} \longrightarrow \text{Decision (ALLOW / DENY / CONDITIONAL)}$$

1. **Explicit DENY Precedence**: If any attached policy has `effect: 'DENY'` matching the action/resource (e.g. `DenyProductionDatabaseDeletion`), the request is immediately denied with `CRITICAL` risk level.
2. **Admin Privilege Check**: Identities with `privilegeLevel: 'ADMIN'` and active MFA are granted access.
3. **Role & Policy Scoping**: Operators are allowed workload and traffic operations; developers are granted read telemetry permissions.
4. **Conditional Gating**: Unmatched production access requests return `CONDITIONAL`, requiring a temporary Just-In-Time (JIT) access request.
