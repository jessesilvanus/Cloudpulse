# CLOUDPULSE: Cryptographic Image Signing, Provenance & SLSA Build Integrity

---

## 1. Cryptographic Image Signing (Cosign / Sigstore)

Artifact signatures use keyless OIDC identity binding via GitHub Actions:
- **Algorithm**: `ECDSA-P256-SHA256`
- **Issuer**: `https://token.actions.githubusercontent.com`
- **Subject Identity**: `https://github.com/cloudpulse/cloudpulse/.github/workflows/release.yml@refs/heads/main`
- **Signature Status**: **`100% VALID`** across all built container images.

---

## 2. SLSA Build Level 3 Provenance

Every build produces an in-toto predicate recording:
- **Source Repository**: Immutable GitHub repository URL and commit SHA.
- **Isolated Builder**: Ephemeral Ubuntu runner with no persistent state.
- **Hermetic Build Environment**: Dependency lockfile integrity enforcement.
- **SLSA Level**: **`SLSA_BUILD_L3`**.
