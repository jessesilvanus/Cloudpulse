# CLOUDPULSE: Container & Multi-Format Artifact Security

---

## 1. Container Hardening & Minimal Base Images

All microservices build on **Distroless** container images with non-root runtime users:
- **Base Image**: `gcr.io/distroless/nodejs22-debian12:nonroot`
- **Security Invariants**:
  - No shell binaries or package managers in production images (`USER 65532:65532`).
  - Read-only root filesystem with ephemeral `/tmp` volume mount.
  - Pinned immutable `sha256` image digests.

---

## 2. Artifact Inventory

| Artifact ID | Name | Version | Type | Immutable Digest | Signature | Provenance | Status |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| `art-gw-104` | `api-gateway` | `v1.4.2` | `CONTAINER` | `sha256:5a9e7f82...` | **`VALID`** | **`VERIFIED`** | **`SECURE`** |
| `art-ord-201` | `order-service` | `v2.0.1` | `CONTAINER` | `sha256:7b1e8a93...` | **`VALID`** | **`VERIFIED`** | **`SECURE`** |
| `art-pay-099` | `payment-service` | `v1.1.0` | `CONTAINER` | `sha256:9c3e0a15...` | **`VALID`** | **`VERIFIED`** | **`AT_RISK`** |
