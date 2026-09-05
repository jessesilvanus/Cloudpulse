# CLOUDPULSE: Multi-Cloud Backup & Restore Verification Engine

---

## 1. Multi-Cloud Backup Inventory

| Backup Identifier | Resource Target | Service | Backup Mechanism | Frequency | Retention | Age | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `bak-rds-ord-01` | `aws_rds/order-db-primary` | `order-service` | Snapshot | Every 6h | 30d | $3.5\text{h}$ | **`RESTORE_TESTED`** |
| `bak-wal-ord-02` | `aws_rds/order-db-primary` | `order-service` | Continuous WAL | Real-time | 7d | $0.05\text{h}$ | **`VERIFIED`** |
| `bak-s3-archive-03` | `aws_s3/cloudpulse-telemetry-archive` | `observability` | Glacier Object Archive | Daily | 365d | $8.5\text{h}$ | **`VERIFIED`** |

---

## 2. Restore Testing Invariant

- Backups are only classified as `RESTORE_TESTED` after automated sandbox restoration successfully boots an isolated RDS database instance and validates transaction data integrity.
