# CLOUDPULSE — AI-Assisted Security Analysis & Hallucination Prevention

## 1. AI Security Analyst Guardrails

1. **Strict Evidence Distinction**:
   - `OBSERVED`: Raw verifiable logs, timestamps, and network attributes.
   - `INFERRED`: Rule-based correlation and sequence clustering.
   - `HYPOTHESIS`: Predictive incident summary or recommended triage steps.
2. **Zero Hallucination Guarantee**:
   - AI models never synthesize attacker IPs, credentials, or fake CVEs.
   - Missing evidence is explicitly stated as `UNKNOWN`.
