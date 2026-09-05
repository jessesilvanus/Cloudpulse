# CLOUDPULSE: Continuous Compliance & Evidence Records

---

## 1. Compliance Evidence Architecture

Every evaluation records an immutable cryptographic evidence record:

```json
{
  "id": "ev-001",
  "policyId": "pol-signed-images",
  "resourceId": "res-gw-01",
  "result": "PASS",
  "observedConfig": {
    "digest": "sha256:5a9e7f82b7c4d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6",
    "issuer": "https://token.actions.githubusercontent.com",
    "slsaLevel": "SLSA_BUILD_L3"
  },
  "timestamp": "2026-08-31T06:00:00Z",
  "source": "Kubernetes Admission Controller + Sigstore Rekor",
  "evaluationVersion": "v1.4.0"
}
```

---

## 2. Multi-Format Evidence Export

- **JSON / NDJSON**: Complete machine-readable evidence stream for automated audits.
- **CSV / XLSX**: Tabular governance compliance matrices for compliance officers.
- **PDF Report**: Executive compliance summaries with cryptographic hashes and sign-off blocks.
