# Natural Language Investigation & Query DSL

## 1. Overview
The **CLOUDPULSE Natural Language Investigation Engine** enables SREs, SecOps leads, and cloud architects to investigate real AWS environments using conversational prompts without learning proprietary query languages.

Natural language prompts are deterministically parsed into strongly-typed AST queries, executed against the Governance Knowledge Graph, and synthesized into plain-English explanations backed by concrete telemetry and configuration evidence.

---

## 2. Natural Language Translation Pipeline

```
Prompt: "Show all production resources exposed to the internet"
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. Intent Recognition & Entity Extraction             │
 │    Intent: PUBLIC_EXPOSURE_SEARCH                      │
 │    Target: RESOURCE (Criticality: CRITICAL, HIGH)      │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. AST Construction                                    │
 │    primaryEntityType: "RESOURCE"                       │
 │    filters: [criticality IN ['CRITICAL', 'HIGH']]     │
 │    relationships: [VIOLATES (depth: 2)]                │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. Safe Graph Execution                                │
 │    Matched Nodes: [s3-audit-logs, alb-edge-ingress]    │
 │    Evidence: PutBucketAcl event, Config Rule Drift     │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. Evidence-Backed Synthesis & Actionable Next Steps   │
 │    - Explanation: 2 public exposure risks detected     │
 │    - Evidence Citations: S3 BlockPublicAcls false      │
 │    - Next Step: Run What-If Simulation on S3 Harden    │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Anti-Hallucination Guarantees

CLOUDPULSE is strictly **Real-Data-First**. To prevent AI hallucinations or fabricated cloud resources:

1. **Grounded Entity Resolution**: Every entity mentioned in the response is verified to exist in the real AWS Knowledge Graph index.
2. **Explicit Confidence Scoring**: Responses report `HIGH`, `MEDIUM`, or `LOW` confidence based on evidence freshness and telemetry strength.
3. **No Match Truthfulness**: Prompts that match zero real entities honestly report `NO_MATCH` without inventing imaginary resources or risks.
4. **Coverage Classification**: Every query result classifies coverage status (`FULL_COVERAGE`, `PARTIAL_COVERAGE`, `NO_MATCH`, `PERMISSION_REQUIRED`).

---

## 4. Pre-Built Investigation Templates

The query engine provides curated templates across core cloud domains:

| Category | Sample Prompt | Intent | Targeted Relationship |
| :--- | :--- | :--- | :--- |
| **Security & Exposure** | *"Show all production resources exposed to the internet"* | Public asset vulnerability | `VIOLATES`, `DRIFTS_FROM` |
| **IAM Access Paths** | *"Which IAM roles can affect the orders Aurora database?"* | Privilege escalation path | `ASSUMES`, `AUTHORIZES` |
| **Incident RCA** | *"What changed before the staging runner elevated error burst?"* | Change-to-incident correlation | `IMPACTS`, `OBSERVED_BY` |
| **FinOps & Governance** | *"Show resources with high monthly spend and poor compliance"* | Cost vs risk optimization | `COSTS`, `VIOLATES` |
| **Remediation & Repair** | *"Which governance decisions are ready for automated repair?"* | Self-healing automation | `REMEDIATED_BY` |

---

## 5. Visual Query Builder DSL

For power users who prefer visual query design over plain English, the UI provides an interactive visual builder:
- **Entity Selector**: Choose from `RESOURCE`, `IDENTITY`, `ROLE`, `CONTROL`, `DRIFT`, `SECURITY_FINDING`, `CHANGE`, `INCIDENT`, `COST_RECORD`.
- **Predicate Filter Editor**: Add multi-condition rules with `EQUALS`, `CONTAINS`, `GREATER_THAN`, `IN`.
- **Relationship Traversal**: Add multi-hop relationship joins with configurable hop limits (1 to 5).
- **Explain View**: View the optimization plan and estimated execution cost before dispatching.
