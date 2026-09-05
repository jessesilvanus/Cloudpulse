# CLOUDPULSE: Truth-in-Labeling — Real vs. Disconnected States

---

## 1. Disconnected State Principles

1. **Never Fabricate Values**: When no AWS account is connected to the workspace, the platform explicitly renders:
   - Status: `NOT CONNECTED`
   - Resources: `0 resources found`
   - Cost: `COST DATA UNAVAILABLE — Connect an AWS account to begin.`
   - Metrics: `NO DATA AVAILABLE`
2. **Permission Diagnostics**: If an AWS account is connected but lacks `ce:GetCostAndUsage`, the UI renders `PERMISSION REQUIRED` rather than displaying estimated or mock dollar amounts.
3. **Live Provenance Gating**: Only data retrieved directly from the validated AWS STS session is labeled `LIVE`.
