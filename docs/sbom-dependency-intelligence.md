# CLOUDPULSE: Software Bill of Materials (SBOM) & Dependency Intelligence

---

## 1. SBOM Standards & Generation

The platform generates comprehensive **CycloneDX v1.5** and **SPDX v2.3** format SBOMs during every CI/CD build run:

- **Packages Tracked**: Direct and transitive dependencies with cryptographic hashes and explicit licenses.
- **Repository Coverage**:
  - `cloudpulse-gateway`: 142 packages, 0 vulnerabilities (`sbom-gw-104`)
  - `cloudpulse-orders`: 168 packages, 0 vulnerabilities (`sbom-ord-201`)
  - `cloudpulse-payments`: 155 packages, 1 vulnerability (`sbom-pay-099`)

---

## 2. Dependency Graph & License Intelligence

| Dependency | Version | Type | License | License Category | Risk Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `express` | `4.21.2` | Direct | `MIT` | Permissive | **`CURRENT`** |
| `@opentelemetry/sdk-node` | `0.57.2` | Direct | `Apache-2.0` | Permissive | **`CURRENT`** |
| `prom-client` | `15.1.3` | Direct | `Apache-2.0` | Permissive | **`CURRENT`** |
| `jsonwebtoken` | `9.0.2` | Direct | `MIT` | Permissive | **`CURRENT`** |
| `tar` | `6.2.0` | Transitive | `ISC` | Permissive | **`VULNERABLE`** (Fix: `6.2.1`) |
