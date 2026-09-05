# CLOUDPULSE — Resource Rightsizing & Waste Elimination

## 1. Rightsizing Workflow Governance

To guarantee production safety, CLOUDPULSE enforces strict operator oversight:

```mermaid
flowchart LR
    Analyze["1. ANALYZE\n(Evaluate 30d P95 CPU/RAM)"] --> Recommend["2. RECOMMEND\n(Generate Downscope Plan)"]
    Recommend --> Estimate["3. ESTIMATE IMPACT\n(Calculate $ / Month Savings)"]
    Estimate --> Approval["4. OPERATOR APPROVAL\n(Require Human Sign-Off)"]
    Approval --> Execute["5. ACTION\n(Apply Manifest in Staging)"]
```

---

## 2. Waste Identification Engine
- **Underutilized Workloads**: Workloads running consistently at $<25\%$ of requested CPU or memory.
- **Idle Storage & Disks**: Detached EBS gp3 volumes and untagged ECR container layers older than 30 days.
- **Idle Network Endpoints**: Provisioned NAT Gateways without active subnets.
