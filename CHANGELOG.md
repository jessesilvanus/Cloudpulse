# CLOUDPULSE Changelog

All notable changes to the CLOUDPULSE Multi-Cloud SRE & Control Plane Platform are documented in this file.

---

## [1.0.0] - 2026-09-05 (Phase 70: General Availability & Enterprise Release)

### Added
- **Master Documentation Suite**:
  - `docs/architecture.md`: Complete enterprise architecture, micro-engine topology, truth-in-labeling model, and scalability design.
  - `docs/security.md`: Zero-Trust NIST SP 800-207 security architecture, RBAC, Two-Person Control, secret sanitization, and SLSA L3 software supply chain.
  - `docs/cloud-connections.md`: Multi-cloud integration guides and IAM permission matrices for AWS (STS AssumeRole), Azure (Entra ID Service Principal), GCP (Workload Identity Federation), and Kubernetes (RBAC ClusterRole).
  - `docs/operations.md`: Comprehensive SRE operations runbook, multi-tier health probing, internal SLO monitoring, worker DLQ management, and \$856.08 MTD unit economics.
  - `docs/ai-safety.md`: Grounded AI safety specification, read-only advisory boundaries, prompt injection defenses, and evidence citation graphs.
  - `docs/portfolio.md`: Flagship portfolio briefing and multi-cloud capability matrix across 12 dimensions.
- **Security Red Team Test Suite (`apps/api/test/security-red-team.test.ts`)**:
  - 14 automated penetration test vectors validating tenant boundary isolation (IDOR defense), token-bucket rate limiting (RFC compliance), cloud action allowlists, Two-Person Control, secret sanitization (AWS keys, passwords, JWTs), and AI prompt injection defenses.
- **Production Hardening (Phase 69)**:
  - Multi-tier health probes (`/health/live`, `/health/ready`, `/health/dependencies`).
  - Internal self-observability metrics (p50/p95/p99 latencies, error rates, TSDB memory).
  - Background worker telemetry loops with Dead Letter Queue (DLQ) retry and drain support.
  - Internal hosting unit economics tracking (\$856.08 MTD verified against cloud billing APIs).

### Security
- Strengthened regex scrubbing in `RealCloudPulsePlatformEngine.sanitizeSecrets` to scrub AWS access keys (`AKIA...`), secret access keys, JWT Bearer tokens, RSA private keys, and structured credentials across all logs and error responses.
- Enforced strict tenant isolation headers (`x-tenant-id`) and cross-tenant access guards across all protected platform routes.

---

## [0.69.0] - 2026-09-04 (Phase 69: Self-Observability & Platform Infrastructure Hardening)
- Implemented `RealCloudPulsePlatformEngine` managing platform self-metrics, SLO attainments, worker sync loops, circuit breakers, and hosting costs.
- Mounted `/health/live`, `/health/ready`, `/health/dependencies`, and `/api/v1/platform/*` routes.
- Created `platform-rate-limiter.ts`, `tenant-isolation.ts`, and `error-handler.ts` middleware.

---

## [0.64.0] - 2026-09-04 (Phase 64: Enterprise Cloud Workflow & Governed Change Management)
- Implemented `EnterpriseWorkflowEngine` supporting Two-Person Control, change requests, maintenance windows, change freezes, and incident swarms.

---

## [0.40.0] - 2026-09-03 (Phase 40: Multi-Cloud Command Center & Platform Hardening)
- Implemented `EnterpriseCommandCenterEngine` unifying cross-cloud health scores (88.4/100), global search, and executive scenario simulation.

---

## [0.20.0] - 2026-09-02 (Phase 20: Cloud Reliability Command Center & SRE Platform)
- Implemented SLI/SLO tracking, error budget burn rates, pre-flight release gates, and MTTA/MTTR calculations.

---

## [0.0.1] - 2026-08-27 (Initial Foundation)
- Monorepo initialization with pnpm workspaces, TypeScript, Express API, React Web UI, and shared type definitions.
