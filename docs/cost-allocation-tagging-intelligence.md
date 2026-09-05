# CLOUDPULSE: Cost Allocation & Tagging Intelligence

---

## 1. Cost Allocation Readiness Score Formulation

The Cost Allocation Readiness Score ($96.5 / 100$) evaluates resource metadata governance across four dimensions:

$$\text{Readiness Score} = w_1 \cdot T_{\text{coverage}} + w_2 \cdot O_{\text{ownership}} + w_3 \cdot A_{\text{application}} + w_4 \cdot E_{\text{environment}}$$

Where:
- $T_{\text{coverage}} = 98.0\%$ (Resource Tag Coverage)
- $O_{\text{ownership}} = 95.0\%$ (Identified Engineering Team Owner)
- $A_{\text{application}} = 96.0\%$ (Application Service Mapping)
- $E_{\text{environment}} = 97.0\%$ (Environment Classification: `production` vs `staging`)

---

## 2. Team Cost Breakdown

| Team Name | Monthly Spend | Top Application | Resource Count | Optimization Opportunities |
| :--- | :---: | :--- | :---: | :--- |
| **Core Backend** | **`$299.20`** | Order Processing Engine | 4 | 2 (EBS idle, RDS 1-yr Savings Plan) |
| **Platform Engineering** | **`$211.80`** | E-Commerce Core & Infra | 4 | 1 (NAT Gateway idle egress review) |
| **FinOps & Payments** | **`$111.00`** | Payment Gateway Integration | 2 | 1 (Pod CPU limit adjustment) |
