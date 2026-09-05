# Cycle-Protected Blast Radius & Failure Impact Analysis

## Blast Radius Traversal Algorithm

CLOUDPULSE utilizes a bounded reverse Breadth-First Search (BFS) algorithm with visited set cycle detection to calculate the direct and transitive blast radius of any target resource.

---

## Blast Radius Analysis: `orders-aurora-primary` (`RDS DBCluster`)

```
Target: `orders-aurora-primary` ($185.00/mo)
  ├── Direct Impact (Depth 1):
  │     └── `api-gateway-host-prod` (`EC2`) ($185.00/mo)
  └── Transitive Impact (Depth 2 & 3):
        ├── `tg-api-gateway-prod` (`TargetGroup`) ($0.00/mo)
        └── `prod-public-ingress-alb` (`ALB`) ($28.00/mo)
```

- **Direct Impact**: 1 Resource (`i-09f18a29b8c71e4a1`)
- **Transitive Impact**: 2 Resources (Target Group + Application Load Balancer)
- **Max Dependency Depth**: 3 Layers
- **Monthly Financial Exposure**: **`$398.00 / mo`**
- **Resilience Score**: **`88.0 / 100`** (Aurora Multi-AZ automatic failover active)
