# CLOUDPULSE — Cost Governance & Policy-as-Code

## 1. Cost Policy Guardrails

```json
[
  {
    "id": "cpol-budget-warn",
    "name": "Warn at 80% Monthly Budget Consumption",
    "ruleType": "budget_threshold",
    "severity": "medium",
    "effect": "WARN",
    "condition": "budgetConsumedPercent >= 80"
  },
  {
    "id": "cpol-mandatory-tags",
    "name": "Enforce Mandatory Cost Allocation Tags",
    "ruleType": "mandatory_tagging",
    "severity": "high",
    "effect": "BLOCK",
    "condition": "missingTagsCount > 0"
  }
]
```

---

## 2. CI/CD Deployment Cost Gating
- Evaluates estimated Terraform and Kubernetes cost deltas before release.
- Flags pull requests introducing $>25\%$ cost surges for mandatory FinOps lead review.
