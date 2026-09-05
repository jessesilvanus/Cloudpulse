# CLOUDPULSE Enterprise Security & Zero-Trust Architecture

**Version:** 1.0.0 (Production Release)  
**Security Classification:** Enterprise Zero-Trust Operational Security  
**Audit Verification:** 100% Pass across Red Team Penetration Test Vectors

---

## 1. Zero-Trust Security Paradigm

CLOUDPULSE is engineered from the ground up according to the **NIST SP 800-207 Zero-Trust Architecture** principles:
1. **Never Trust, Always Verify:** Every API request, background synchronization job, and AI query must present verified authentication and tenancy tokens.
2. **Principle of Least Privilege (PoLP):** Cloud provider integrations connect strictly via read-only IAM roles (`SecurityAudit`, `ViewOnlyAccess`).
3. **Assume Breach:** Sensitive secrets and tokens are redacted at the application boundary, minimizing the impact of potential lateral movement.

---

## 2. Authentication & Multi-Tenant Isolation

### 2.1 Tenant Boundary Isolation
- Multi-tenancy is enforced at the HTTP gateway layer via `requireTenantIsolation` and `tenantIsolationGuard`.
- Every incoming request must provide an authorized `x-tenant-id` header matching the authenticated identity session.
- Any attempt by Tenant A to query, modify, or infer data belonging to Tenant B triggers an immediate `403 Forbidden` (`FORBIDDEN` / `ERR_CROSS_TENANT_FORBIDDEN`) and an immutable security audit event.

### 2.2 Rate Limiting & Denial-of-Service Defense
- Token-bucket rate limiting is enforced per tier:
  - `AUTH`: 30 requests/minute (brute-force defense)
  - `CLOUD_CONNECT`: 120 requests/minute (provider API quota preservation)
  - `SEARCH_GRAPH`: 300 requests/minute
  - `AI_ANALYST`: 60 requests/minute (LLM token exhaustion defense)
  - `DEFAULT`: 600 requests/minute
- All responses return standard RFC rate limiting headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`).

---

## 3. High-Risk Action Guardrails & Two-Person Control

CLOUDPULSE enforces strict separation of duties and multi-party authorization for operational remediation:

```
+-------------------+        Initiates Request        +-------------------------+
| Requester Engineer| -----------------------------> |  Pending Approval Queue |
+-------------------+                                 +-------------------------+
          |                                                        |
          | (Self-Approval BLOCKED                                 | (Independent Authorized
          |  by Separation of Duties)                              |  Peer Reviews Evidence)
          v                                                        v
+-------------------+                                 +-------------------------+
| Access Denied:    |                                 | Action Approved &       |
| 403 Forbidden     |                                 | Executed with Audit Log |
+-------------------+                                 +-------------------------+
```

### 3.1 Separation of Duties Rules
- The initiating engineer cannot approve their own high-risk action. Self-approval attempts throw `Separation of Duties violation` and are blocked.
- Remediation actions that alter production topology (e.g., node drain, IAM policy detachment, route table modification) require an independent peer or Security Lead approval.

### 3.2 Action Allowlisting
- Arbitrary bash, raw shell scripts, or arbitrary SQL statements are strictly rejected at the engine boundary.
- Only vetted and codified action types (e.g., `START_SYNC`, `DRAIN_NODE`, `RESTART_POD`, `DETACH_IAM_POLICY`, `DISABLE_ACCESS_KEY`, `QUARANTINE_INSTANCE`) can be executed through governed playbooks.

---

## 4. Secret Sanitization & Information Leakage Defense

The `RealCloudPulsePlatformEngine` sanitization engine automatically scrubs sensitive strings from all application logs, error payloads, telemetry spans, and UI responses:

| Secret Pattern | Detection Rule | Redaction Replacement |
| :--- | :--- | :--- |
| **AWS Access Key ID** | `AKIA[0-9A-Z]{16}` | `[REDACTED_AWS_KEY]` |
| **AWS Secret Access Key** | `aws_secret_access_key=[^&\s]+` | `aws_secret_access_key=[REDACTED]` |
| **JWT Bearer Token** | `Bearer\s+[a-zA-Z0-9_\-\.]+` | `Bearer [REDACTED]` |
| **Database Passwords** | `password\s*=\s*['"]?[^\s'"&,;]+['"]?` | `password=[REDACTED]` |
| **RSA Private Keys** | `-----BEGIN (?:RSA )?PRIVATE KEY-----...` | `[REDACTED]` |
| **API Keys & Secrets** | `"apiKey":\s*"[^"]+"`, `"clientSecret":\s*...` | `"apiKey":"[REDACTED]"` |

---

## 5. Software Supply Chain Security

CLOUDPULSE enforces SLSA (Supply-chain Levels for Software Artifacts) Level 3 compliance:
- **SBOM Generation:** Automated CycloneDX and SPDX Software Bill of Materials generation tracking all direct and transitive dependencies.
- **Cryptographic Signatures:** Container images are signed via Cosign / Sigstore with verified OIDC issuer attestations.
- **Continuous Vulnerability Scanning:** Daily automated scans against the National Vulnerability Database (NVD) and GitHub Advisory Database.

---

## 6. Security Red Team Verification Summary

Automated penetration test suite (`apps/api/test/security-red-team.test.ts`) executes continuous regression verification against critical threat vectors:

1. **Tenant Isolation & Cross-Tenant Access:** PASSED (100% IDOR rejection).
2. **Token Bucket Rate Limiting:** PASSED (RFC headers & 429 throttling validated).
3. **Cloud Action Allowlist:** PASSED (Arbitrary shell & script execution blocked).
4. **Two-Person Control & Separation of Duties:** PASSED (Self-approval rejected, peer approval validated).
5. **Secret Sanitization:** PASSED (Credentials, JWTs, and AWS keys scrubbed from error payloads and logs).
6. **Grounded AI Safety:** PASSED (Prompt injection rejected, read-only advisory mode enforced).
