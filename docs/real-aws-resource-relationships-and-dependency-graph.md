# Real AWS Resource Relationships & Dependency Graph Architecture

## Overview

Phase 48 establishes the **Real AWS Resource Relationships, Dependency Graph & Blast-Radius Control Plane** in CLOUDPULSE. Connected mode discovers verified relationships directly from AWS API configurations, enforces strict evidence categorization, and enables cycle-protected blast-radius traversal.

```
                         AWS DISCOVERED TOPOLOGY GRAPH
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       Ingress ALB (42ms)                              Security Lake (S3)
       `alb-cloudpulse-prod-ingress`                   `cloudpulse-telemetry-audit-lake`
                │                                             ▲
           ROUTES_TO                                      WRITES_TO
                ▼                                             │
      Target Group (`tg-api-gateway`) ──── HOSTS ────▶ API Gateway Host (`EC2`)
                                                              │
                                                          CONNECTS_TO
                                                              ▼
                                                    Orders Aurora DB (`RDS`)
```

---

## Topology Nodes & Relationships Matrix

| Source Resource | Relationship | Target Resource | Evidence Source API | Category | Confidence |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **`alb-cloudpulse-prod-ingress`** | `ROUTES_TO` | `tg-api-gateway-prod` | `elasticloadbalancing:DescribeRules` | `CONFIRMED` | `HIGH` |
| **`tg-api-gateway-prod`** | `HOSTS` | `i-09f18a29b8c71e4a1` | `elasticloadbalancing:DescribeTargetHealth` | `CONFIRMED` | `HIGH` |
| **`i-09f18a29b8c71e4a1`** | `CONNECTS_TO` | `db-orders-aurora-cluster-01` | `ec2:DescribeSecurityGroups` | `CONFIRMED` | `HIGH` |
| **`i-09f18a29b8c71e4a1`** | `WRITES_TO` | `cloudpulse-telemetry-audit-lake-prod` | `iam:GetInstanceProfile` | `CONFIRMED` | `HIGH` |
