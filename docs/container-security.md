# CLOUDPULSE — Container Security & Hardening

## 1. Multi-Stage Dockerfile Hardening

All application Dockerfiles implement multi-stage builds with:
- **Minimal Base Images**: `node:20-alpine` and `nginx:1.27-alpine` to minimize CVE surface area.
- **Non-Root Execution**: `USER node` (UID 1000) or `USER nginx` (UID 101).
- **Deterministic Dependencies**: `pnpm install --frozen-lockfile`.
- **Healthcheck Directives**: Built-in container health verification commands.

---

## 2. Pod Security Standards (Restricted)

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```

---

## 3. Vulnerability Scanning
- Automated container layer scanning via **Trivy** in `.github/workflows/security-scan.yml`.
- Amazon ECR **Scan on Push** enabled across all repositories.
