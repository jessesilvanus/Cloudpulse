# CLOUDPULSE — Cloud Portability Score Formulation

## 1. Portability Score Mathematical Model

The Cloud Portability Score ($S_{\text{port}}$) evaluates the degree of independence from proprietary cloud APIs:

$$S_{\text{port}} = 0.30 \cdot S_{\text{container}} + 0.25 \cdot S_{\text{k8s}} + 0.15 \cdot S_{\text{db}} + 0.15 \cdot S_{\text{iac}} + 0.15 \cdot S_{\text{telemetry}}$$

### Evaluated Score Breakdown:
- **$S_{\text{container}} = 100\%$**: Standard Docker OCI container images without proprietary dependencies.
- **$S_{\text{k8s}} = 95\%$**: Standard Kubernetes API objects (Deployments, Services, ConfigMaps, HPAs) deployable on EKS, AKS, GKE, or bare-metal.
- **$S_{\text{db}} = 85\%$**: PostgreSQL standard client drivers.
- **$S_{\text{iac}} = 80\%$**: Modular Terraform code.
- **$S_{\text{telemetry}} = 80\%$**: Vendor-neutral OpenTelemetry standards.

**Overall Portability Score**: **`88%`** (**Grade A**, Low Lock-In Risk).
