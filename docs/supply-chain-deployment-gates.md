# CLOUDPULSE: Secure Supply Chain Deployment Gates & Policy-as-Code

---

## 1. Supply Chain Gate Evaluation Rules

```
                      ARTIFACT PROMOTION PIPELINE
                                   │
                                   ▼
                       CRYPTOGRAPHIC SIGNATURE CHECK
                     (Cosign ECDSA-P256 Validation)
                                   │
                                   ▼
                       SLSA PROVENANCE VERIFICATION
                         (Level 3 Attestation)
                                   │
                                   ▼
                          SBOM ATTESTATION CHECK
                        (CycloneDX / SPDX Verified)
                                   │
                                   ▼
                         VULNERABILITY THRESHOLD
                       (No Unmitigated Critical CVEs)
                                   │
            ┌──────────────────────┴──────────────────────┐
            ▼                                             ▼
       PASS DECISION                                 WARN / BLOCK
   (Deploy to Kubernetes)                    (Release Halted / SRE Warned)
```

---

## 2. Runtime Artifact Verification & Drift Detection

- **Kubernetes Pod Spec vs Registry Digest**: Kubernetes cluster reconciler matches running container image digest with approved CI/CD artifact digest.
- **Tamper Detection**: If image digest diverges or pod executes unsigned layers, an immediate security alert (`CONTAINER_DIGEST_DRIFT`) is dispatched to Cloud SOC.
