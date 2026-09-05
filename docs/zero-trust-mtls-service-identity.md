# CLOUDPULSE: Zero-Trust mTLS & Service Identity Matrix

---

## 1. Zero-Trust Service Authorization Matrix

| Source Service | Destination Service | Protocol | Port | Policy Action | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `api-gateway` | `order-service` | HTTP/2 (mTLS) | 4001 | `ALLOW` | **`ACTIVE`** |
| `api-gateway` | `payment-service` | HTTP/2 (mTLS) | 4002 | `ALLOW` | **`ACTIVE`** |
| `order-service` | `payment-service` | HTTP/2 (mTLS) | 4002 | `ALLOW` | **`ACTIVE`** |
| `payment-service` | `aws_rds/order-db-primary` | PostgreSQL | 5432 | `DENY` | **`BLOCKED`** |
| `external` | `order-service` (Direct) | Any | Any | `DENY` | **`BLOCKED`** |

---

## 2. SPIFFE-Style Service Identity & Certificates

- All internal service communications enforce mutual TLS (`mTLSMode: STRICT`) with automatic certificate rotation and zero plaintext secrets.
