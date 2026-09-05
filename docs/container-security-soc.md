# CLOUDPULSE — Container Security & Vulnerability Management

## 1. Container Hardening Standards

- **Minimal Base Images**: Node Alpine and Nginx Alpine images utilized to minimize CVE attack surfaces.
- **Image Provenance**: Docker multi-stage builds create reproducible container layers without embedding dev dependencies or compilers.
- **TruffleHog Scanner**: Integrated into GitHub Actions CI/CD to block commits with credentials.
- **ECR Immutable Tags**: Image tags locked in production to prevent tag mutation attacks.
