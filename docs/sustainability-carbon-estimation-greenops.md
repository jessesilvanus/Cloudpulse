# CLOUDPULSE: Sustainability, Carbon Estimation & GreenOps Intelligence

---

## 1. Transparent Carbon Estimation Formula

$$\text{Estimated }\text{CO}_2\text{e} (\text{kg}) = \frac{\text{Estimated Energy Consumption (kWh)} \times \text{PUE} \times \text{Regional Carbon Intensity (gCO}_2\text{e/kWh)}}{1000}$$

---

## 2. Regional Carbon Intensity & Green Energy Mix

| Region / Provider | Monthly Energy | Carbon Intensity | Clean Energy % | PUE | Estimated Monthly $\text{CO}_2\text{e}$ | Provenance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`us-east-1` (AWS)** | $1,250\text{ kWh}$ | $380\text{ g/kWh}$ | $55\%$ | $1.18$ | **`475.0 kg`** | `ESTIMATED` |
| **`eu-west-1` (AWS)** | $980\text{ kWh}$ | $190\text{ g/kWh}$ | $82\%$ | $1.14$ | **`186.2 kg`** | `ESTIMATED` |
| **`us-central1` (GCP)** | $820\text{ kWh}$ | $210\text{ g/kWh}$ | $90\%$ | $1.10$ | **`172.2 kg`** | `ESTIMATED` |

> [!NOTE]
> All carbon numbers represent calculated estimates grounded in regional grid data and PUE ratios, clearly demarcated as `ESTIMATED`.
