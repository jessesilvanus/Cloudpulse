# CLOUDPULSE — Multi-Cloud & Cloud-Agnostic Control Plane

## 1. Multi-Cloud Control Plane Architecture

CLOUDPULSE decouples high-level Site Reliability Engineering, Security, FinOps, and Disaster Recovery from proprietary cloud APIs through an extensible adapter pattern:

```mermaid
flowchart TB
    subgraph UI_API["1. CloudPulse Control Plane (UI & API)"]
        SREConsole["Cross-Cloud SRE & Golden Signals"]
        SecurityConsole["Normalized Security Posture"]
        FinOpsConsole["Cross-Cloud Cost Intelligence"]
        ResilienceConsole["Multi-Cloud DR & Resilience"]
    end

    subgraph CommonModel["2. Common Normalized Resource Layer"]
        CloudResource["CloudResource (Normalized ID, Region, Env)"]
        ComputeResource["ComputeResource (vCPU, Memory, Cost)"]
        StorageResource["StorageResource (Encrypted, Capacity)"]
        NetworkResource["NetworkResource (VPC/VNet, Subnets)"]
        KubernetesCluster["KubernetesCluster (EKS/AKS/GKE)"]
    end

    subgraph ProviderAdapters["3. Cloud Provider Adapter Layer"]
        AWS["AWS Provider Adapter\n(Status: CONNECTED)"]
        Azure["Azure Provider Adapter\n(Status: DEMO)"]
        GCP["GCP Provider Adapter\n(Status: DEMO)"]
    end

    UI_API --> CommonModel --> ProviderAdapters
```

---

## 2. Truthful Provider Connection Status
- **AWS**: `CONNECTED` (Active AWS EKS, Spot EC2, S3, ALB infrastructure).
- **Azure**: `DEMO` / `STRUCTURAL_ADAPTER` (Standard_B2s, AKS, Blob storage).
- **GCP**: `DEMO` / `STRUCTURAL_ADAPTER` (e2-medium, GKE, Cloud Storage).
