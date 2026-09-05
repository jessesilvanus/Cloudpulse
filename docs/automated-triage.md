# CLOUDPULSE: Automated Triage Engine & Explanation Framework

---

## 1. Automated Triage Architecture

The Automated Triage Engine evaluates incoming security detections and correlates them against asset criticality, IAM identity posture, and real-time observability telemetry:

$$\text{Incident Priority} = f(\text{Detection Severity}, \text{Asset Tier}, \text{Active Blast Radius}, \text{Confidence})$$

---

## 2. 4-Dimension Triage Explanation

Every automated triage evaluation produces a deterministic explanation structured across four dimensions:

1. **WHAT**: Concise description of the observed threat or abnormal event.
2. **WHY**: Architectural and security risk analysis detailing potential impact.
3. **EVIDENCE**: Specific event logs, CloudTrail entries, Kubernetes audit lines, or metric samples.
4. **CONFIDENCE**: Categorized rating (`high` | `medium` | `low`) based on signal clarity and corroborating telemetry.

---

## 3. Deduplication & Alert Suppression

- **Incident Deduplication**: Correlates repeated alerts from the same `(source, affectedAsset, detectionRule)` tuple within a 15-minute sliding window into a single `ResponseIncident`, preventing alert storms.
- **Controlled Suppression**: Enables time-bound suppression rules requiring explicit justification, owner assignment, and automated expiration (zero permanent silent suppression).
