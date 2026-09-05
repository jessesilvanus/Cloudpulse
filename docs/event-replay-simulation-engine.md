# CLOUDPULSE: Event Replay & Simulation Engine

---

## 1. Event Simulation Scenarios

- Scenarios supported: `NORMAL_OPERATIONS`, `TRAFFIC_SPIKE`, `DEPLOYMENT_FAILURE`, `DATABASE_FAILURE`, `SECURITY_INCIDENT`, `COST_SPIKE`, `KUBERNETES_FAILURE`, `BACKUP_FAILURE`, `REGIONAL_OUTAGE`.
- Honest Labeling: All simulated events carry `ingestionMode: 'SIMULATED'` and zero real cloud resources are created or modified.

---

## 2. Historical Event Replay

- Replays recorded incident sequences at `REAL-TIME`, `2x`, `5x`, `10x`, and `STEP-BY-STEP` speeds for post-incident reviews (PIR) and operator training.
