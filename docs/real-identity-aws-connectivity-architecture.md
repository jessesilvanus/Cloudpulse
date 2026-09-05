# CLOUDPULSE: Real User Identity & Real AWS Cloud Connectivity Architecture

---

## 1. Executive Summary & Flow

CLOUDPULSE Phase 41 establishes the **Real User Identity + Real AWS Cloud Connectivity** layer:

```
                                  CLOUDPULSE REAL USER AUTHENTICATION
                                (Google OAuth, Apple OAuth, Email/Password)
                                                    │
                                                    ▼
                                  MULTI-TENANT WORKSPACE CONTROL PLANE
                                (Organization -> Workspace -> RBAC Roles)
                                                    │
                                                    ▼
                                  SECURE AWS AUTHORIZATION WIZARD
                                (Cross-Account Role + Unique External ID)
                                                    │
                                                    ▼
                                     AMAZON WEB SERVICES (AWS)
                               (sts:AssumeRole with Least-Privilege Read)
                                                    │
                                                    ▼
                                  LIVE AWS DATA NORMALIZATION LAYER
                             (EC2, S3, RDS, CloudWatch, Cost Explorer)
                                                    │
                                                    ▼
                                   ENTERPRISE COMMAND CENTER & SRE
                                   (Real Telemetry with LIVE Provenance)
```

---

## 2. Core Tenancy & Security Invariants

- **No Long-Lived Secret Keys**: Users never paste `AWS_SECRET_ACCESS_KEY` into CLOUDPULSE forms.
- **Cross-Account Role Assumption**: Uses AWS STS `AssumeRole` with scoped External ID (`cp-ext-<workspaceId>-<hex>`).
- **Strict Tenant Isolation**: Workspace A can never view or assume credentials from Workspace B.
- **Truth-in-Labeling**: When AWS is disconnected or permissions are missing, the UI renders honest states: `NOT_CONNECTED`, `PERMISSION_REQUIRED`, `UNAVAILABLE`.
