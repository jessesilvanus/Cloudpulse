# CLOUDPULSE: Model Registry, Drift Monitoring & Explainability

---

## 1. Model Registry Inventory

| Model Name | Version | Model Architecture | Classification | MAE | RMSE | F1 Score | Drift Status |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `CloudPulse-Time-Series-Forecaster` | `v2.1.0` | ARIMA + Exponential Smoothing | `RULE-BASED PREDICTION` | $3.2$ | $4.8$ | $0.91$ | **HEALTHY** |
| `Multi-Signal-Anomaly-Detector` | `v1.4.0` | Isolation Forest Ensemble | `SIMULATED MODEL` | $1.8$ | $2.5$ | $0.94$ | **HEALTHY** |
| `Incident-Probability-Classifier` | `v1.8.0` | Gradient Boosted Trees | `RULE-BASED PREDICTION` | $2.1$ | $3.4$ | $0.88$ | **HEALTHY** |
| `Linear-Capacity-Exhaustion-Predictor` | `v1.2.0` | Linear Regressor with Confidence | `SIMULATED MODEL` | $4.0$ | $5.2$ | $0.89$ | **HEALTHY** |
