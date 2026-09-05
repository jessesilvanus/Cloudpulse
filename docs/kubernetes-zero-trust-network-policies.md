# CLOUDPULSE: Kubernetes Zero-Trust Network Policies & Security

---

## 1. NetworkPolicy Enforcement Matrix

| Source Selector | Target Selector | Port / Protocol | Action | Enforcing Policy |
| :--- | :--- | :---: | :---: | :--- |
| `app: api-gateway` | `app: order-service` | `4001/TCP` | `ALLOW` | `allow-ingress-to-order-svc` |
| `app: order-service` | `app: payment-service` | `4002/TCP` | `ALLOW` | `allow-order-to-payment` |
| `app: payment-service` | Direct RDS DB | `5432/TCP` | `DENY` | `default-deny-unauthorized-db` |
| `namespace: default` | `namespace: kube-system` | Any | `DENY` | `isolate-system-namespace` |

---

## 2. Secret Protection Invariant

- Secret metadata (key names, rotation dates) are tracked for compliance, while all secret payload values are strictly hidden (`SECRET VALUE HIDDEN`) and never transmitted across REST APIs or UI logs.
