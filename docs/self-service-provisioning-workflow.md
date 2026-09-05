# CLOUDPULSE: Self-Service Provisioning Workflow & Multi-Step Wizard

---

## 1. Multi-Step Self-Service Request Lifecycle

1. **Service Selection**: Choose approved capability from Marketplace catalog.
2. **Parameter Configuration**: Input workload names, pod replicas, and CPU/memory bounds.
3. **Multi-Cloud Policy Check**: Automated evaluation against Phase 25 guardrails (denies unapproved regions like `ap-unapproved-region`).
4. **FinOps Cost Estimation**: Computes projected monthly spend delta before submission ($3 \times \$35.00 = \$105.00/\text{mo}$).
5. **Security Gating**: Asserts non-root user execution, KMS encryption keys, and read-only root filesystems.
6. **Separation of Duties Approval**: Production requests require approval from an independent SRE lead (`requester !== approver`).
7. **Simulated Sandbox Provisioning**: DRY_RUN mode validates provisioning steps with zero real cloud mutations.
8. **Automated Registration**: Successfully provisioned services register into the Central Resource Registry with health probes.
