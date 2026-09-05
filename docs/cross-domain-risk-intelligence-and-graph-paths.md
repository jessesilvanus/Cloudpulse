# Cross-Domain Risk Intelligence & Graph Paths

## 1. Overview
The **Cross-Domain Risk Intelligence Engine** resolves complex multi-hop security and operational questions across real AWS environments by calculating shortest risk paths, transitive blast radius, and 360-degree resource risk profiles.

---

## 2. Graph Path Finding (BFS Shortest Risk Path)
When investigating an incident or assessing an attack vector, operators can trace the path connecting any two nodes in the estate:

```
[IAM Identity: usr-deployer-ci]
            │
            │ (CAUSED_BY) [Evidence: LIVE_AWS_CLOUDTRAIL]
            ▼
[CloudTrail Change: chg-2026-09-03-s3-bucket-acl]
            │
            │ (TRIGGERED) [Evidence: CALCULATED_DRIFT_CORRELATION]
            ▼
[Config Drift: drf-s3-block-public-acls]
            │
            │ (DRIFTS_FROM) [Evidence: LIVE_AWS_CONFIG_RULE]
            ▼
[Resource: s3-cloudpulse-prod-audit-logs-2026]
            │
            │ (AFFECTS) [Evidence: LIVE_AWS_GUARDDUTY]
            ▼
[Security Finding: sec-guardduty-unusual-api]
```

### Path Computation Highlights:
- **Bidirectional Adjacency Traversal**: Connects both incoming and outgoing edges for comprehensive discovery.
- **Hop Count & Evidence Attestation**: Each edge retains its evidence strength (`CONFIRMED`, `DERIVED`, `INFERRED`) and provenance source.
- **Path Risk Aggregation**: Calculates composite risk along the sequence to identify the highest-risk intermediary bottlenecks.

---

## 3. 360° Resource Risk Profiling
For every AWS resource (such as `s3-cloudpulse-prod-audit-logs-2026` or `i-08f331920acb119a0`), the engine synthesizes:
1. **Protecting Controls**: Controls actively enforcing compliance (e.g. `ctrl-s3-public-block` with `MANDATORY` enforcement).
2. **Violating Policies**: Active policies currently evaluated as `FAIL`.
3. **Configuration Drifts**: Live deviations from approved baselines (e.g. `BlockPublicAcls` set to `false`).
4. **Security & Threat Intelligence**: Correlated AWS GuardDuty alerts and AWS Inspector CVE findings.
5. **IAM Access Paths**: Users and Roles authorized to assume or execute operations against the asset.
6. **Downstream Dependencies**: Network and application topological links (e.g. EC2 $\rightarrow$ Aurora DB).
7. **FinOps Cost & Anomaly Metrics**: Monthly spend and trending from AWS Cost Explorer.
8. **Automated Decisions & Remediation Plans**: Suggested repair actions with verified reversibility scores.
