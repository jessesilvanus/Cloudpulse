# CLOUDPULSE — Audit Evidence Packs & 5-W Traceability

## 1. Audit Evidence Model

Every control evaluation is backed by immutable, verifiable evidence:
- **Source**: e.g., AWS IAM API, Kubernetes API Audit Logs, Terraform State.
- **Reference**: Exact line or configuration block reference.
- **Freshness**:
  - `FRESH`: Evaluated within $<24\text{h}$.
  - `STALE`: Evaluated between $24\text{h} - 7\text{d}$.
  - `EXPIRED`: Evaluated $>7\text{d}$ ago.

---

## 2. Audit Evidence Pack Export
Audit evidence packs bundle control statuses, configuration snapshots, and exception records into exportable JSON/CSV archives for compliance auditors.
