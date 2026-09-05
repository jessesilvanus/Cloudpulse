# CLOUDPULSE — Multi-Cloud SRE & Control Plane Platform (v1.0.0)

> Enterprise-Grade Multi-Cloud Observability, SRE Command Center, FinOps Governance & Autonomous Control Plane for AWS, Azure, GCP, and Kubernetes.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-769%20passing%20%7C%20100%25-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/security%20red%20team-14%2F14%20passed-success.svg)](docs/security.md)
[![Zero-Trust](https://img.shields.io/badge/architecture-NIST%20SP%20800--207%20Zero--Trust-purple.svg)](docs/architecture.md)

---

## 📚 Master Documentation Suite

- 🏛️ **[Platform Architecture Specification](docs/architecture.md)** — Comprehensive architecture, micro-engine topology, truth-in-labeling model, and scalability.
- 🛡️ **[Enterprise Security & Zero-Trust Architecture](docs/security.md)** — Zero-Trust RBAC, Two-Person Control, secret sanitization, and Red Team verification.
- ☁️ **[Multi-Cloud Connection Guide](docs/cloud-connections.md)** — Setup guides and IAM permission matrices for AWS, Azure, GCP, and Kubernetes.
- 🛠️ **[Production Operations & SRE Runbook](docs/operations.md)** — Multi-tier health probing, internal SLO tracking, worker DLQs, and \$856.08 MTD unit economics.
- 🤖 **[Grounded AI Safety Specification](docs/ai-safety.md)** — Read-only AI advisory boundaries, prompt injection defense, and evidence citation graphs.
- 💼 **[Portfolio Briefing & Capability Matrix](docs/portfolio.md)** — Executive briefing, 12-dimensional capability matrix, and engineering metrics.
- 📜 **[Platform Changelog](CHANGELOG.md)** — Complete version history and release notes through v1.0.0.

---

## 🚀 Architectural Overview

CLOUDPULSE enables unified observability across the three core telemetry pillars (Metrics, Logs, Traces) with zero-trust network isolation and seamless orchestration across local containers, Kubernetes, and Amazon EKS/ECS cloud infrastructure:

```
                    INTERNET / CLIENTS
                            │
                            ▼
              Kubernetes Ingress / AWS ALB
               [Path Routing: / , /api/*]
                            │
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
CloudPulse Web (SPA)                   CloudPulse API Gateway
 [React 18 + Vite]                      [Telemetry Normalizer]
                                                 │
       ┌────────────────────┬────────────────────┘
       ▼                    ▼
Live Probes & Health    Prometheus / Loki / Tempo TSDBs
                            ▲
                            │ OTLP Telemetry (4317 / 4318)
                 OpenTelemetry Ingestion Engine
                            ▲
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   api-gateway         order-service       payment-service
    (:4000)               (:4001)             (:4002)
```

---

## 📦 Project Structure

```
cloudpulse/
├── apps/
│   ├── web/                        # React 18 + Vite SRE Console Frontend
│   └── api/                        # Express + TypeScript Telemetry API Gateway
├── packages/
│   ├── shared/                     # @cloudpulse/shared domain types & schemas
│   ├── instrumentation/            # @cloudpulse/instrumentation OTel SDK & tracing
│   └── telemetry-engine/           # @cloudpulse/telemetry-engine Ingestor & Stores
├── services/
│   ├── api-gateway/                # Ingress microservice (:4000)
│   ├── order-service/              # Order processing & Saga coordinator (:4001)
│   ├── payment-service/            # Payment gateway & fault simulator (:4002)
│   └── traffic-generator/          # Automated background traffic generator
├── deploy/
│   └── kubernetes/                 # Production Kubernetes manifests (Namespaces, RBAC, NetworkPolicies, HPA, PDB)
├── helm/
│   └── cloudpulse/                 # Enterprise Helm Chart (values-dev.yaml, values-prod.yaml)
├── infra/
│   ├── docker-compose.prod.yml     # Production-like multi-container stack
│   ├── observability/              # Prometheus, Loki, Tempo, OTel Collector configs
│   └── terraform/                  # Modular AWS Infrastructure as Code
│       ├── main.tf                 # Root module
│       └── modules/                # VPC, Security, IAM, ECR, ALB, ECS, EKS, Observability
├── .github/workflows/
│   ├── ci.yml                      # Monorepo CI: Lint, Typecheck, Test, Build, Docker
│   ├── k8s-validate.yml            # Kubernetes & Helm manifest validation
│   ├── terraform-check.yml         # Terraform format check & validation
│   └── deploy-aws.yml              # AWS Production Deployment workflow
├── docker-compose.yml              # Local multi-container development mesh
└── .env.example                    # Global environment configuration template
```

---

## ⚡ Quick Start Options

### 1. Local Monorepo Development (Node.js & pnpm)

```bash
pnpm install
pnpm dev:services                     # Start background microservices
pnpm --filter @cloudpulse/api dev     # Start API Gateway
pnpm --filter @cloudpulse/web dev     # Start SRE Console (http://localhost:5173)
```

### 2. Multi-Container Docker Mesh

```bash
docker compose up -d
# Web Console: http://localhost:5173 | API: http://localhost:3001
```

### 3. Kubernetes & Helm Deployment

```bash
# Kubernetes Plain Manifests
kubectl apply -f deploy/kubernetes/ -R

# Helm Chart
helm install cloudpulse ./helm/cloudpulse -f ./helm/cloudpulse/values-prod.yaml -n cloudpulse --create-namespace
```

---

## 🛠️ Verification & Quality Assurance

```bash
# Run TypeScript compilation check across all packages
pnpm typecheck

# Run automated unit and integration tests
pnpm test

# Build production artifacts
pnpm -r build
```

---

## 📚 Documentation

- [Global Cloud Command Center & Executive Intelligence Architecture (Phase 68)](docs/global-cloud-command-center-architecture.md)
- [Enterprise Situation Model & Correlation Engine (Phase 68)](docs/enterprise-situation-model-and-correlation-engine.md)
- [Multi-Cloud Risk Heatmap & Health Model (Phase 68)](docs/multi-cloud-risk-heatmap-and-health-model.md)
- [Real Cloud Resilience & Disaster Recovery Architecture (Phase 67)](docs/cloud-resilience-and-disaster-recovery-architecture.md)
- [SPOF, Failure Domains & Multi-Cloud Redundancy Engine (Phase 67)](docs/spof-failure-domains-and-redundancy-engine.md)
- [Backup Intelligence & RTO / RPO Validation Engine (Phase 67)](docs/backup-intelligence-and-rto-rpo-validation.md)
- [Zero-Trust Cloud Security & Identity Architecture (Phase 66)](docs/zero-trust-cloud-security-and-identity-architecture.md)
- [Effective Access & Least-Privilege Engine (Phase 66)](docs/effective-access-and-least-privilege-engine.md)
- [High-Risk Access Paths & Public Exposure Intelligence (Phase 66)](docs/high-risk-access-paths-and-public-exposure-intelligence.md)
- [Real Multi-Cloud FinOps Control Plane Architecture (Phase 65)](docs/real-multicloud-finops-control-plane-architecture.md)
- [SRE & Reliability Control Plane Architecture (Phase 63)](docs/sre-reliability-control-plane-architecture.md)
- [SLO, SLI & Error Budget Mathematical Formulation (Phase 63)](docs/slo-sli-error-budget-mathematical-formulation.md)
- [Dependency Reliability, Cascading Failure Paths & Single Points of Failure (Phase 63)](docs/dependency-reliability-cascading-failure-and-spof.md)
- [Real Kubernetes Connectivity & Cluster Architecture (Phase 62)](docs/real-kubernetes-connectivity-and-cluster-architecture.md)
- [Real Multi-Cloud Connectivity: Azure & GCP Architecture (Phase 61)](docs/azure-and-gcp-provider-adapters-and-normalization.md)
- [Cloud Governance Center Architecture](docs/cloud-governance.md)
- [Compliance Center & Framework Alignment](docs/compliance-center.md)
- [Policy-as-Code Engine & Policy Gates](docs/policy-as-code-engine.md)
- [Configuration Governance & Drift Detection](docs/configuration-governance.md)
- [Audit Evidence Packs & 5-W Traceability](docs/audit-evidence.md)
- [Remediation Workflows & Approval Gates](docs/remediation-workflows.md)
- [Governance Risk Management & Exceptions](docs/governance-risk-management.md)
- [Cloud Security Operations Center (Cloud SOC)](docs/cloud-soc.md)
- [Threat Detection Rules & Event Normalization](docs/threat-detection.md)
- [Security Correlation & Attack Path Graph](docs/security-correlation.md)
- [Cloud Incident Response & Evidence Chains](docs/cloud-incident-response.md)
- [Kubernetes Security Operations & Pod Sandboxing](docs/kubernetes-security-soc.md)
- [Container Security & Vulnerability Management](docs/container-security-soc.md)
- [AI-Assisted Security Analysis & Hallucination Prevention](docs/ai-security-analysis.md)
- [Security Posture Management & Drift Detection](docs/security-posture-soc.md)
- [Chaos Engineering & Continuous Resilience Validation](docs/chaos-engineering.md)
- [Resilience Engine & Service Profiles](docs/resilience-engine.md)
- [Failure Injection Catalog & Simulation Abstraction](docs/failure-injection.md)
- [RTO and RPO Mathematical Validation](docs/rto-rpo-validation.md)
- [Recovery Testing & Automated Health Self-Healing](docs/recovery-testing.md)
- [Real AWS Governance Decision Engine Architecture](docs/real-aws-governance-decision-engine.md)
- [Governance Root Cause & Control Effectiveness Model](docs/governance-root-cause-and-control-effectiveness.md)
- [Decision-to-Verification Continuous Optimization Pipeline](docs/decision-to-verification-continuous-optimization-pipeline.md)
- [Real AWS Governance Intelligence Center & Control Optimization Architecture](docs/real-aws-governance-intelligence-center.md)
- [Continuous Control Health & Evidence Quality Model](docs/continuous-control-health-and-evidence-quality.md)
- [Automation Opportunity & Safety Scoring Engine](docs/automation-opportunity-and-safety-scoring.md)
- [Real AWS Policy Simulator & Governance What-If Architecture](docs/real-aws-policy-simulator-and-governance-what-if.md)
- [Multi-Dimensional Change Impact & Blast Radius Model](docs/multi-dimensional-change-impact-and-blast-radius.md)
- [Simulation Safety Boundary & Non-Mutating Guarantees](docs/simulation-safety-boundary-and-non-mutating-guarantees.md)
- [Real AWS Governance Remediation Intelligence & Auto-Healing Architecture](docs/real-aws-governance-remediation-intelligence-and-auto-healing.md)
- [Action Allowlist & Precondition Engine](docs/action-allowlist-and-precondition-engine.md)
- [Circuit Breakers, Loop Protection & Idempotency](docs/circuit-breakers-loop-protection-and-idempotency.md)
- [Real AWS Governance Baselines & Remediation Orchestration Architecture](docs/real-aws-governance-baselines-and-remediation-orchestration.md)
- [Remediation Planning & Pre-Flight Validation Engine](docs/remediation-planning-and-preflight-validation-engine.md)
- [Controlled Safe Execution & Post-Read Verification Model](docs/controlled-safe-execution-and-post-read-verification.md)
- [Real AWS Continuous Compliance & Drift Detection Architecture](docs/real-aws-continuous-compliance-and-drift-detection.md)
- [Baseline Reconciliation & Visual Diff Model](docs/baseline-reconciliation-and-visual-diff-model.md)
- [Drift-to-Policy & Incident Correlation Model](docs/drift-to-policy-and-incident-correlation.md)
- [Real AWS Automated Cloud Governance & Policy Enforcement Architecture](docs/real-aws-governance-and-policy-enforcement.md)
- [Policy-as-Code Rules & Dry-Run Evaluator](docs/policy-as-code-rules-and-dry-run-evaluator.md)
- [Non-Invasive Remediation Safety & Exemption Governance](docs/non-invasive-remediation-safety-and-exemption-governance.md)
- [Real AWS Predictive Operations & Early-Warning Intelligence Architecture](docs/real-aws-predictive-operations-and-early-warnings.md)
- [Capacity Depletion & Cost Trajectory Models](docs/capacity-depletion-and-cost-trajectory-models.md)
- [Data Quality Gates & What-If Scenario Modeling](docs/data-quality-gates-and-what-if-scenario-modeling.md)
- [Real AWS Change Impact & Incident Correlation Architecture](docs/real-aws-change-impact-and-incident-correlation.md)
- [Root-Cause Hypothesis Scoring & Evidence Timeline](docs/root-cause-hypothesis-scoring-and-evidence-timeline.md)
- [Change-to-Alarm Causation vs Correlation Model](docs/change-to-alarm-causation-vs-correlation-model.md)
- [Real AWS Resource Relationships & Dependency Graph Architecture](docs/real-aws-resource-relationships-and-dependency-graph.md)
- [AWS API Relationship Discovery & Evidence Model](docs/aws-api-relationship-discovery-and-evidence-model.md)
- [Cycle-Protected Blast Radius & Failure Impact Analysis](docs/cycle-protected-blast-radius-and-failure-impact-analysis.md)
- [Real AWS Observability & Service Health Intelligence Architecture](docs/real-aws-observability-and-health-intelligence.md)
- [4 Golden Signals & CloudWatch Adapter](docs/four-golden-signals-and-cloudwatch-adapter.md)
- [Evidence-Based Health Scoring & Alarm Correlation](docs/evidence-based-health-scoring-and-alarm-correlation.md)
- [Real AWS FinOps, Cost Forecasting & Resource Economics Architecture](docs/real-aws-finops-cost-forecasting.md)
- [AWS Cost Allocation & Tag Governance](docs/aws-cost-allocation-and-tag-governance.md)
- [Evidence-Based Rightsizing & What-If Scenario Simulations](docs/evidence-based-rightsizing-and-what-if-scenarios.md)
- [Real AWS Multi-Account & AWS Organizations Intelligence Architecture](docs/real-aws-multi-account-organizations.md)
- [AWS Organizations Hierarchy & OU Topology](docs/aws-organizations-hierarchy-and-ou-topology.md)
- [Cross-Account IAM Role Diagnostics Matrix](docs/cross-account-iam-role-diagnostics-matrix.md)
- [Real AWS Security, Audit & Threat Intelligence Architecture](docs/real-aws-security-threat-intelligence.md)
- [AWS Security Capability Matrix & Posture Evaluation](docs/aws-security-capability-matrix-and-posture.md)
- [Explainable IAM Privilege Escalation & IaC Remediation](docs/explainable-privilege-escalation-and-iac-remediation.md)
- [Real AWS Continuous Monitoring & Event Ingestion Pipeline](docs/real-aws-continuous-monitoring-event-ingestion.md)
- [AWS Change Intelligence & Actor Attribution Model](docs/aws-change-intelligence-and-actor-attribution.md)
- [Evidence-Based Change Correlation & Incident Linking](docs/evidence-based-change-correlation.md)
- [Real AWS Cloud Intelligence & Resource Analysis Architecture](docs/real-aws-cloud-intelligence-architecture.md)
- [AWS Multi-Service Resource Inventory Matrix](docs/aws-multi-service-inventory-matrix.md)
- [Evidence-Based Rightsizing & Optimization Engine](docs/evidence-based-rightsizing-and-optimization-model.md)
- [Real User Identity & AWS Cloud Connectivity Architecture](docs/real-identity-aws-connectivity-architecture.md)
- [AWS IAM Role Setup & Permission Diagnostics Matrix](docs/aws-iam-role-setup-and-permission-matrix.md)
- [Truth-in-Labeling — Real vs. Disconnected States](docs/truth-in-labeling-real-vs-disconnected-states.md)
- [Production Architecture & Hardening Guide](docs/platform-hardening-production-architecture.md)
- [AI Agent Safety, Controlled Actions & Governance](docs/ai-agent-safety-governance-model.md)
- [Truth-in-Labeling & Data Provenance Matrix](docs/truth-in-labeling-data-provenance-matrix.md)
- [Cross-Domain Incident-to-Business-Impact Workflow](docs/cross-domain-incident-to-impact-workflow.md)
- [Portfolio Presentation & Live Demo Runbook](docs/portfolio-demo-runbook-and-walkthrough.md)
- [Enterprise Command Center & Executive Intelligence Architecture](docs/enterprise-command-center-architecture.md)
- [Enterprise Health Score Rubric & Mathematical Formulation](docs/enterprise-health-score-rubric.md)
- [Executive Risk Register & Probability × Impact Matrix](docs/executive-risk-register-matrix.md)
- [Real-Time Situation Room & Multi-Domain Event Stream](docs/real-time-situation-room-event-stream.md)
- [Business Impact Intelligence & Revenue-at-Risk Estimation](docs/business-impact-intelligence-engine.md)
- [Executive AI Briefing & Decision Intelligence Center](docs/executive-ai-briefing-decision-center.md)
- [Advanced FinOps & Sustainability / GreenOps Intelligence Architecture](docs/advanced-finops-greenops-architecture.md)
- [Cloud Unit Economics & Business Value Correlation](docs/unit-economics-business-value-correlation.md)
- [Sustainability, Carbon Estimation & GreenOps Intelligence](docs/sustainability-carbon-estimation-greenops.md)
- [Savings Opportunities & Verified Realized Savings Workflow](docs/savings-opportunities-realized-verification.md)
- [Cost vs. Carbon Tradeoff Simulation & What-If Scenarios](docs/cost-vs-carbon-tradeoff-simulation.md)
- [Cloud Compliance & Policy-as-Code Governance Center Architecture](docs/cloud-compliance-governance-architecture.md)
- [Compliance Frameworks & Control Mappings](docs/compliance-frameworks-control-mappings.md)
- [Policy-as-Code Rule Engine & Enforcement Lifecycle](docs/policy-as-code-rule-engine-lifecycle.md)
- [Compliance Evidence Chain & End-to-End Auditability](docs/compliance-evidence-chain-auditability.md)
- [Governed Policy Exceptions & Compensating Controls](docs/policy-exceptions-compensating-controls.md)
- [Automated Remediation Workflows & Verification Engine](docs/remediation-workflow-verification-engine.md)
- [Infrastructure-as-Code & Advanced Platform Automation Architecture](docs/iac-platform-automation-architecture.md)
- [Infrastructure Blueprints & Visual Architecture Designer](docs/iac-blueprints-visual-designer.md)
- [Plan Generation, Pre-Flight Validation & Policy Governance](docs/iac-plan-validation-policy-governance.md)
- [Controlled Deployment Engine & Dry-Run Simulation](docs/iac-dry-run-controlled-deployment-engine.md)
- [Infrastructure Drift Detection & State Reconciliation](docs/iac-drift-detection-reconciliation.md)
- [Automated Rollback Engine & State Snapshot Management](docs/iac-rollback-state-management.md)
- [Advanced AI/ML & Predictive Cloud Intelligence Architecture](docs/predictive-cloud-intelligence-architecture.md)
- [Time-Series Forecasting & Predictive Capacity Planning](docs/time-series-forecasting-capacity-planning.md)
- [Multi-Signal Anomaly Detection & Incident Prediction](docs/multi-signal-anomaly-incident-prediction.md)
- [Predictive FinOps & Cloud Spend Forecast](docs/predictive-cost-finops-budget-breach.md)
- [Model Registry, Drift Monitoring & Explainability](docs/ai-explainability-model-registry-drift.md)
- [What-If Predictive Scenario Simulation Engine](docs/what-if-predictive-simulation-engine.md)
- [Cloud Identity, IAM & Zero-Trust Security Architecture](docs/cloud-identity-iam-architecture.md)
- [IAM Policy Evaluation Engine & Decision Logic](docs/iam-policy-engine-evaluation.md)
- [Least Privilege Analysis & Privilege Graphs](docs/least-privilege-privilege-graph.md)
- [Just-In-Time (JIT) Access Requests & Approval Workflows](docs/jit-access-requests-approvals.md)
- [Zero-Trust Continuous Identity Context & Security](docs/zero-trust-identity-context-security.md)
- [Agentic IAM Authorization Boundaries & Safety Gates](docs/agentic-iam-authorization-boundaries.md)
- [Kubernetes Platform & Workload Orchestration Architecture](docs/kubernetes-platform-architecture.md)
- [Cluster, Node & Workload Intelligence](docs/cluster-node-workload-intelligence.md)
- [Pod Failure Troubleshooting & Root Cause Analysis (RCA)](docs/pod-failure-troubleshooting-rca.md)
- [Kubernetes Autoscaling, Safety Guards & FinOps](docs/kubernetes-autoscaling-safety-finops.md)
- [Kubernetes Service Discovery, Ingress & Mesh Mapping](docs/kubernetes-service-ingress-mesh-mapping.md)
- [Kubernetes Zero-Trust Network Policies & Security](docs/kubernetes-zero-trust-network-policies.md)
- [Cloud Service Mesh & Distributed Traffic Engineering](docs/service-mesh-architecture.md)
- [Distributed Traffic Engineering & Load Balancing](docs/distributed-traffic-engineering.md)
- [Intelligent API Gateway & Route Configurations](docs/intelligent-api-gateway-routes.md)
- [Canary Releases, Blue-Green & Intelligent Release Guard](docs/canary-blue-green-release-guard.md)
- [Circuit Breakers, Retry Policies & Resilience Policies](docs/circuit-breakers-resilience-policies.md)
- [Zero-Trust mTLS & Service Identity Matrix](docs/zero-trust-mtls-service-identity.md)
- [Cloud Data Intelligence, Event Streaming & Real-Time Decision Engine](docs/cloud-data-intelligence-event-streaming.md)
- [Real-Time Decision Engine & Event Correlation](docs/real-time-decision-engine-correlation.md)
- [Event Schema Registry & Dead Letter Queue (DLQ)](docs/event-schema-registry-dlq.md)
- [Event Replay & Simulation Engine](docs/event-replay-simulation-engine.md)
- [Event-to-Action Controlled Automation Pipeline](docs/event-to-action-controlled-pipeline.md)
- [Event Pipeline Health & Operational Analytics](docs/event-pipeline-health-analytics.md)
- [Multi-Cloud Disaster Recovery, Business Continuity & Resilience Engineering](docs/multi-cloud-disaster-recovery.md)
- [Mathematical RTO & RPO Tracking](docs/rto-rpo-mathematical-tracking.md)
- [Multi-Cloud Backup & Restore Verification Engine](docs/backup-restore-verification-engine.md)
- [Disaster Recovery Drills & Simulation Testing](docs/recovery-drills-simulation-testing.md)
- [Multi-Region Failover & Failback Orchestration](docs/failover-failback-orchestration.md)
- [Multi-Cloud Resilience Scorecard & Heatmap](docs/resilience-scorecard-heatmap.md)
- [Cloud Platform Marketplace & Self-Service Developer Portal](docs/marketplace-developer-portal.md)
- [Service Catalog & Standardized Golden Paths](docs/service-catalog-golden-paths.md)
- [Parameterized Resource Templates & Versioning](docs/resource-templates-versioning.md)
- [Self-Service Provisioning Workflow & Multi-Step Wizard](docs/self-service-provisioning-workflow.md)
- [Central Resource Registry & Lifecycle Management](docs/resource-registry-lifecycle.md)
- [Safe Decommissioning & Immutable Audit Trail](docs/safe-decommissioning-audit.md)
- [Enterprise FinOps, Cloud Cost Intelligence & Business Impact](docs/enterprise-finops-cost-intelligence.md)
- [Cost Allocation & Tagging Intelligence](docs/cost-allocation-tagging-intelligence.md)
- [Unit Economics & Business Impact Modeling](docs/unit-economics-business-impact.md)
- [Budget Tracking & Time-Series Spend Forecasting](docs/budget-forecasting-uncertainty.md)
- [Waste Detection, Rightsizing & Savings Opportunities](docs/waste-detection-rightsizing-savings.md)
- [What-If Cost Simulation & Realized Savings](docs/what-if-simulation-realized-savings.md)
- [Agentic Cloud Operations & Controlled Autonomous Remediation](docs/agentic-cloud-operations.md)
- [Controlled Autonomous Remediation & Action Catalog](docs/controlled-autonomous-remediation.md)
- [Agent Planning & Explainable Risk Assessment](docs/agent-planning-risk-assessment.md)
- [Simulation & Dry-Run Engine](docs/simulation-dry-run-engine.md)
- [Human Approval Gating & Separation of Duties (SoD)](docs/human-approval-gating-sod.md)
- [Post-Action Verification & Immutable Audit Trail](docs/verification-audit-trail.md)
- [AIOps & Observability Intelligence Master Architecture](docs/aiops-observability-intelligence.md)
- [Multi-Dimensional Event Correlation Engine](docs/event-correlation-engine.md)
- [Microservice Health Scoring & Root Cause Ranking](docs/service-health-root-cause.md)
- [Predictive Operations & Time-Series Capacity Baselines](docs/predictive-operations-baselines.md)
- [Telemetry Quality & Alert Noise Reduction](docs/telemetry-quality-noise-reduction.md)
- [AI Operations Assistant & Historical Incident Search](docs/aiops-assistant-similarity-search.md)
- [Enterprise Cloud Governance & Policy-as-Code Master Architecture](docs/enterprise-cloud-governance.md)
- [Policy-as-Code Engine & Evaluation Lifecycle](docs/policy-as-code-engine.md)
- [Continuous Compliance & Evidence Records](docs/continuous-compliance-evidence.md)
- [Multi-Cloud Resource Inventory, Tag Governance & Drift](docs/resource-tagging-drift-governance.md)
- [Remediation Workflows & Exception Governance](docs/remediation-workflows-exceptions.md)
- [Industry Compliance Frameworks & Governance Scorecard](docs/compliance-frameworks-scorecard.md)
- [Enterprise Disaster Recovery & Business Continuity Master Architecture](docs/enterprise-disaster-recovery.md)
- [Recovery Time (RTO) & Recovery Point (RPO) Intelligence](docs/rto-rpo-intelligence.md)
- [Continuous Backup & Restore Validation](docs/backup-restore-validation.md)
- [Failure Simulation & Recovery Orchestration](docs/failure-simulation-orchestration.md)
- [Multi-Region & Service Resilience Architecture](docs/region-service-resilience.md)
- [Resilience Scorecards & Gap Analysis](docs/resilience-scorecard-gaps.md)
- [Advanced Cloud FinOps Engine & Cost Intelligence Master Architecture](docs/advanced-finops-engine.md)
- [Cloud Cost Unit Economics & Business Metric Correlation](docs/cost-unit-economics.md)
- [Spend Forecasting, Trend Models & Anomaly Detection](docs/cost-forecasting-anomalies.md)
- [Cloud Waste Elimination & Workload Rightsizing](docs/waste-detection-rightsizing.md)
- [Kubernetes & Multi-Cloud Cost Optimization](docs/kubernetes-multicloud-finops.md)
- [Cost Governance, Tagging Enforcement & Optimization Pipeline](docs/cost-governance-optimizations.md)
- [Cloud Software Supply Chain Security & Software Factory](docs/software-supply-chain-security.md)
- [Software Bill of Materials (SBOM) & Dependency Intelligence](docs/sbom-dependency-intelligence.md)
- [Container & Multi-Format Artifact Security](docs/container-artifact-security.md)
- [Cryptographic Image Signing, Provenance & SLSA Build Integrity](docs/image-signing-provenance-slsa.md)
- [Vulnerability Management Lifecycle & Remediation SLAs](docs/vulnerability-management-sla.md)
- [Secure Supply Chain Deployment Gates & Policy-as-Code](docs/supply-chain-deployment-gates.md)
- [Internal Developer Platform (IDP) Master Architecture](docs/internal-developer-platform.md)
- [Golden Paths & Infrastructure Templates](docs/golden-paths-templates.md)
- [Multi-Tier Environment Management & Lifecycle](docs/environment-lifecycle.md)
- [Deployment Orchestration & Progressive Rollout Strategies](docs/deployment-orchestration.md)
- [Platform Guardrails & Service Scorecards](docs/platform-guardrails-scorecards.md)
- [Developer Self-Service & Tenancy Isolation](docs/developer-self-service.md)
- [Cloud Reliability Command Center & SRE Platform Architecture](docs/reliability-command-center.md)
- [SLI / SLO Engine & Mathematical Formulations](docs/sli-slo-engine.md)
- [Error Budget Management & Burn Rate Alerting](docs/error-budget-management.md)
- [Capacity Planning & Performance Engineering](docs/capacity-performance-engineering.md)
- [Service Dependency Intelligence & Cascading Failure Protection](docs/service-dependency-intelligence.md)
- [SRE Operational Runbooks & Reliability Workflows](docs/reliability-workflows-runbooks.md)
- [Cloud Incident Response & SOAR Architecture](docs/cloud-incident-response.md)
- [SOAR Response Playbooks Specification](docs/soar-playbooks.md)
- [Automated Triage Engine & Explanation Framework](docs/automated-triage.md)
- [Human Approval Workflows & Separation of Duties](docs/approval-workflows.md)
- [Safe Remediation & Response Lab](docs/safe-remediation-soar.md)
- [Incident Communication & Response SLA](docs/incident-communication-sla.md)
- [Post-Incident Analysis & Corrective Actions](docs/post-incident-analysis.md)
- [Cloud Governance Master Architecture](docs/cloud-governance.md)
- [Compliance Center & Multi-Framework Mappings](docs/compliance-center.md)
- [Policy-as-Code Engine & Validation Gates](docs/policy-as-code-engine.md)
- [Configuration Governance & Drift Detection](docs/configuration-governance.md)
- [5-W Audit Evidence & Freshness Lifecycle](docs/audit-evidence.md)
- [Governance Remediation Workflows](docs/remediation-workflows.md)
- [Governance Risk Management](docs/governance-risk-management.md)
- [Resilience & Recovery Scoring Formulation](docs/resilience-scoring.md)
- [Chaos Safety, Pre-Flight Gates & Rollback Invariants](docs/chaos-safety.md)
- [Cloud-Native FinOps & Cost Intelligence Platform](docs/finops-intelligence.md)
- [Cost Allocation, Tagging Governance & Multi-Cloud Normalization](docs/cost-allocation.md)
- [Cost Anomaly Detection & Budget Alerts](docs/cost-anomalies.md)
- [Cloud Cost Forecasting & Pacing Models](docs/cost-forecasting.md)
- [Resource Rightsizing & Waste Elimination](docs/resource-rightsizing.md)
- [Kubernetes FinOps & Workload Efficiency](docs/kubernetes-finops.md)
- [Resource Unit Economics](docs/unit-economics.md)
- [Cost Governance & Policy-as-Code](docs/cost-governance.md)
- [Optimization Center & Architectural Trade-Offs](docs/optimization-engine.md)
- [Advanced Observability Architecture](docs/observability.md)
- [Distributed Tracing & Span Waterfall](docs/distributed-tracing.md)
- [Dynamic Service Dependency Map](docs/service-map.md)
- [Three-Pillar Telemetry Correlation](docs/telemetry-correlation.md)
- [Multi-Signal Root Cause Analysis (RCA)](docs/root-cause-analysis.md)
- [Telemetry Security & Sensitive Data Redaction](docs/telemetry-security.md)
- [Telemetry Cost Control & Sampling Strategies](docs/telemetry-cost.md)
- [Zero-Trust Security Architecture](docs/zero-trust.md)
- [IAM Governance & Privileged Access Inventory](docs/iam-governance.md)
- [Policy-as-Code & Guardrails](docs/policy-as-code.md)
- [Access Reviews & Just-In-Time Access](docs/access-reviews.md)
- [Least Privilege & Permission Utilization Analysis](docs/least-privilege.md)
- [Compliance & Control Alignment Assessment](docs/compliance-controls.md)
- [Comprehensive Security Architecture](docs/security-architecture.md)
- [Multi-Cloud & Cloud-Agnostic Control Plane](docs/multi-cloud.md)
- [Provider Architecture & Adapter Interface](docs/provider-architecture.md)
- [Common Cloud Resource Data Models](docs/cloud-abstraction.md)
- [Cloud Provider Capability Matrix](docs/provider-capabilities.md)
- [Vendor Lock-in & Dependency Analysis](docs/vendor-lock-in.md)
- [Cloud Portability Score Formulation](docs/cloud-portability.md)
- [Workload Migration Assessment](docs/migration-assessment.md)
- [Disaster Recovery & Cloud Resilience](docs/disaster-recovery.md)
- [Business Continuity Plan & Service Tiers](docs/business-continuity.md)
- [Recovery Time & Point Objectives (RTO / RPO)](docs/rto-rpo.md)
- [Backup & Restore Architecture](docs/backup-restore.md)
- [Safe Failure Simulation & Chaos Testing](docs/resilience-testing.md)
- [Disaster Scenarios Catalog](docs/failure-scenarios.md)
- [Operational Recovery Runbooks](docs/recovery-runbooks.md)
- [AI/ML-Powered SRE & Predictive Intelligence](docs/ai-sre.md)
- [Statistical Anomaly Detection & False-Positive Gating](docs/anomaly-detection.md)
- [Capacity & Resource Forecasting](docs/forecasting.md)
- [Incident Intelligence & Deployment Risk Assessment](docs/incident-intelligence.md)
- [Model Evaluation & Human-in-the-Loop Safeguards](docs/model-evaluation.md)
- [AWS Cost Explorer Integration & IAM Permissions](docs/aws-billing.md)
- [Cloud Security, Zero Trust & Defense-in-Depth](docs/security.md)
- [Threat Model & Attack Vector Analysis](docs/threat-model.md)
- [AWS IAM & GitHub Actions OIDC Security](docs/iam.md)
- [Role-Based Access Control (RBAC) Architecture](docs/rbac.md)
- [Secrets Management & Rotation Strategy](docs/secrets.md)
- [Network Security & Zero-Trust Isolation](docs/network-security.md)
- [Container Security & Hardening](docs/container-security.md)
- [Compliance & Security Controls Mapping](docs/compliance.md)
- [Security Incident Runbooks](docs/security-runbooks.md)
- [Site Reliability Engineering (SRE) Architecture](docs/sre.md)
- [SLIs & SLOs Mathematical Specifications](docs/slis-slos.md)
- [Error Budgets & Multi-Window Burn Rates](docs/error-budgets.md)
- [Alerting Architecture & Deduplication](docs/alerting.md)
- [Incident Management & Severity Classification](docs/incidents.md)
- [Operational Runbooks & Automated Remediation](docs/runbooks.md)
- [Blameless Postmortems & Action Item Tracking](docs/postmortems.md)
- [Cloud Architecture & Design Decisions](docs/cloud-architecture.md)
- [CI/CD & Automated Release Architecture](docs/ci-cd.md)
- [Release Process & Change Management](docs/release-process.md)
- [GitHub Actions Security & OIDC](docs/github-actions.md)
- [Kubernetes & Orchestration Architecture](docs/kubernetes.md)
- [Amazon EKS Production Guide](docs/eks.md)
- [Kubernetes Zero-Trust Security](docs/kubernetes-security.md)
- [Kubernetes & Cloud Cost Optimization](docs/kubernetes-cost.md)
- [Docker Containerization Guide](docs/docker.md)
- [Terraform Infrastructure as Code](docs/terraform.md)
- [Production Deployment Walkthrough](docs/deployment.md)
- [Real AWS Governance Knowledge Graph](docs/real-aws-governance-knowledge-graph.md)
- [Cross-Domain Risk Intelligence & Graph Paths](docs/cross-domain-risk-intelligence-and-graph-paths.md)
- [Graph Evidence Model & Provenance](docs/graph-evidence-model-and-provenance.md)
- [Real AWS Cloud Graph Query Engine](docs/real-aws-cloud-graph-query-engine.md)
- [Natural Language Investigation & Query DSL](docs/natural-language-investigation-and-dsl.md)
- [Cloud Investigation Lifecycle & Reporting](docs/cloud-investigation-lifecycle-and-reporting.md)
- [Real AWS Cloud Operations Control Plane](docs/real-aws-cloud-operations-control-plane.md)
- [Operation State Machine & Safety Guardrails](docs/operation-state-machine-and-safety-guardrails.md)
- [Live Cloud Situation Room & Unified Operational Storyline](docs/live-cloud-situation-and-unified-storyline.md)
- [Real Multi-Cloud Connectivity Architecture](docs/real-multicloud-connectivity-architecture.md)
- [Azure and GCP Provider Adapters & Normalization](docs/azure-and-gcp-provider-adapters-and-normalization.md)
- [Multi-Cloud Governance & Cross-Provider Scorecard](docs/multicloud-governance-and-cross-provider-scorecard.md)
- [Real Kubernetes Connectivity & Cluster Architecture](docs/real-kubernetes-connectivity-and-cluster-architecture.md)
- [Kubernetes RBAC, Security & Governance Engine](docs/kubernetes-rbac-security-and-governance-engine.md)
- [Kubernetes Operations Control Plane & Safe Remediation](docs/kubernetes-operations-control-plane-and-safe-remediation.md)
- [Real SRE & Reliability Control Plane Architecture](docs/real-sre-reliability-control-plane-architecture.md)
- [Evidence-Backed SLIs, SLOs & Multi-Window Error Budget Engine](docs/evidence-backed-slis-slos-and-error-budgets.md)
- [Multi-Dimensional Reliability Scoring & Release Risk Guard](docs/multi-dimensional-reliability-scoring-and-release-guard.md)
- [Enterprise Cloud Workflow Architecture](docs/enterprise-cloud-workflow-architecture.md)
- [Two-Person Control & Approval Governance](docs/two-person-control-and-approval-governance.md)
- [Governed Change Management, Maintenance Windows & Freezes](docs/governed-change-management-and-freezes.md)
- [Real Multi-Cloud FinOps Control Plane Architecture](docs/real-multicloud-finops-control-plane-architecture.md)
- [Unit Economics & Cost Allocation Engine](docs/unit-economics-and-cost-allocation-engine.md)
- [Cost ↔ Reliability ↔ Security Tradeoffs & Verification Ledger](docs/cost-reliability-security-tradeoffs-and-verification.md)
- [Real Multi-Cloud Zero-Trust Security Architecture](docs/real-multicloud-zero-trust-security-architecture.md)
- [Cross-Cloud Attack Path Analysis & Lateral Movement Engine](docs/cross-cloud-attack-path-analysis-and-lateral-movement.md)
- [Continuous Posture Evaluation & Threat Modeling](docs/continuous-posture-evaluation-and-threat-modeling.md)
- [Real Multi-Cloud Resilience, DR & Business Continuity Architecture](docs/real-multicloud-resilience-dr-architecture.md)
- [Failure Domain Mapping & Single Points of Failure Engine](docs/failure-domain-mapping-and-spof-engine.md)
- [What-If Disaster Simulation & Governed Failover Runbooks](docs/what-if-disaster-simulation-and-failover-runbooks.md)
- [Real Global Cloud Command Center & Executive Intelligence Architecture](docs/real-global-command-center-architecture.md)
- [Correlated Situation Awareness & Unified Storylines](docs/correlated-situation-awareness-and-storylines.md)
- [Multi-Pillar Executive Decision Engine & Risk Heatmap](docs/multi-pillar-executive-decision-engine-and-risk-heatmap.md)
- [Platform Production Hardening & Deployment Architecture](docs/platform-production-hardening-and-deployment-architecture.md)
- [Platform Internal Observability, SLOs & Error Budgets](docs/platform-internal-observability-slos-and-error-budgets.md)
- [Platform Operational Runbooks & Disaster Recovery](docs/platform-operational-runbooks-and-disaster-recovery.md)
