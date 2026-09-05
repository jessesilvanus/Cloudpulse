# CLOUDPULSE — Cloud Architecture Design Document

## 1. Overview & Objectives

CLOUDPULSE is architected for high-availability, zero-trust network isolation, observable microservice topologies, and progressive migration to cloud-native platforms.

The production architecture is designed for deployment on **Amazon Web Services (AWS)** using **ECS Fargate**, **Application Load Balancing**, **Least-Privilege IAM**, and **Amazon ECR**.

---

## 2. Target AWS Cloud Topology

```mermaid
flowchart TB
    subgraph Internet["Public Internet"]
        Users["SRE Operators / Web Clients"]
    end

    subgraph AWS["AWS Cloud Region (us-east-1)"]
        subgraph VPC["VPC (10.0.0.0/16)"]
            
            subgraph PublicSubnets["Public Subnets (us-east-1a / us-east-1b)"]
                ALB["Application Load Balancer (ALB)\nPorts: 80 / 443"]
                NAT["NAT Gateway (Optional for private egress)"]
            end

            subgraph PrivateSubnets["Private Subnets (us-east-1a / us-east-1b)"]
                subgraph ECSCluster["ECS Fargate Cluster (cloudpulse-production)"]
                    WebTask["cloudpulse-web\nNginx SPA (:80)"]
                    ApiTask["cloudpulse-api\nGateway API (:3001)"]
                    GwTask["api-gateway\nIngress Microservice (:4000)"]
                    OrderTask["order-service\nSaga Order Engine (:4001)"]
                    PaymentTask["payment-service\nPayment Sandbox (:4002)"]
                end

                subgraph TelemetryMesh["Telemetry Ingestion & Stores"]
                    OTelTask["OTel Collector Contrib (:4317 / :4318)"]
                    PromTask["Prometheus TSDB (:9090)"]
                    LokiTask["Grafana Loki (:3100)"]
                    TempoTask["Grafana Tempo (:3200)"]
                end
            end
        end

        subgraph ManagedServices["AWS Managed Services"]
            ECR["Amazon ECR\nContainer Registries"]
            CW["Amazon CloudWatch\nAlarms & Container Insights"]
            SSM["AWS Systems Manager\nParameter Store"]
        end
    end

    Users -->|HTTPS / 443| ALB
    ALB -->|Route / | WebTask
    ALB -->|Route /api/*| ApiTask
    ALB -->|Route /gateway/*| GwTask

    GwTask -->|HTTP / W3C Trace| OrderTask
    OrderTask -->|HTTP / W3C Trace| PaymentTask

    GwTask -.->|OTLP Telemetry| OTelTask
    OrderTask -.->|OTLP Telemetry| OTelTask
    PaymentTask -.->|OTLP Telemetry| OTelTask

    OTelTask -->|Metrics| PromTask
    OTelTask -->|Logs| LokiTask
    OTelTask -->|Traces| TempoTask

    ApiTask -->|PromQL| PromTask
    ApiTask -->|LogQL| LokiTask
    ApiTask -->|Tempo API| TempoTask

    ECSCluster -.->|Pull Images| ECR
    ECSCluster -.->|Push Logs & Metrics| CW
    ECSCluster -.->|Fetch Secrets| SSM
```

---

## 3. Compute Selection: ECS Fargate vs EC2 vs EKS

| Evaluation Dimension | ECS Fargate (Selected) | EC2 Auto Scaling Groups | Amazon EKS (Kubernetes) |
| :--- | :--- | :--- | :--- |
| **Server Management** | **Zero server management** (serverless containers) | Requires OS patching, AMI maintenance, hardening | Control plane managed, worker nodes require management |
| **Operational Overhead** | **Very Low** | Medium-High | High (requires cluster operations, CNI, ingress controllers) |
| **Cost for Small/Medium** | **Pay-per-second** per vCPU/RAM allocation | Fixed hourly instance cost regardless of utilization | **$73/month base cluster fee** + EC2/Fargate node costs |
| **Portfolio / SRE Value** | Demonstrates production AWS container orchestration | Demonstrates traditional infrastructure | Future Phase 4 migration target |
| **Security Isolation** | Kernel-level isolation per task | Shared VM kernel across containers | Shared VM or Fargate profiles |

**Decision**: **ECS Fargate** was chosen for initial AWS deployment because it provides production-grade container orchestration without the $73/month baseline cost overhead of EKS control planes or the operational patching burden of EC2. The containerized workloads are designed symmetrically, allowing a clean transition to Kubernetes (EKS) in subsequent phases.

---

## 4. Security & Network Isolation

1. **Public Subnets**: Contain exclusively the Application Load Balancer and Internet Gateway. No application containers run in public subnets.
2. **Private Subnets**: All ECS tasks, microservices, and telemetry databases run in private subnets with non-routable private IPs.
3. **Security Groups**:
   - `alb-sg`: Permits inbound `80` (HTTP) and `443` (HTTPS) from `0.0.0.0/0`.
   - `ecs-sg`: Restricts ingress exclusively to traffic originating from `alb-sg` and intra-cluster communication on private service ports.
4. **Least-Privilege IAM**:
   - **Task Execution Role**: Grants permissions to pull images from ECR and stream logs to CloudWatch.
   - **Task Role**: Restricts application permissions strictly to reading environment configuration from SSM Parameter Store.
