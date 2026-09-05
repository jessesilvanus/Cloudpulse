# CLOUDPULSE: AWS Multi-Service Resource Inventory Matrix

---

## 1. Supported AWS Services & Resource Types

| AWS Service | Resource Type | Discovered Attributes | CloudWatch Metrics | Policy Checks |
| :--- | :--- | :--- | :--- | :--- |
| **Amazon EC2** | `AWS::EC2::Instance` | Instance type, VPC, Subnet, IP, AZ | `CPUUtilization`, `StatusCheckFailed` | Tags, Instance Profile, Non-Default VPC |
| **Amazon S3** | `AWS::S3::Bucket` | Bucket name, Region, Encryption, Versioning | `BucketSizeBytes`, `NumberOfObjects` | Default KMS/AES256, Public Block |
| **Amazon RDS** | `AWS::RDS::DBCluster` | Engine, Version, Multi-AZ, Storage, KMS | `DatabaseConnections`, `CPUUtilization` | Storage Encryption, Daily Automated Backup |
| **AWS Lambda** | `AWS::Lambda::Function` | Runtime, Architecture, Memory, Timeout | `Invocations`, `Duration`, `Throttles` | VPC Execution, Execution Role Scoping |
| **Amazon EKS** | `AWS::EKS::Cluster` | Kubernetes version, Node groups, Endpoints | Node CPU/Memory, Pod counts | Private Endpoint, Non-Root Security Context |
| **Amazon VPC** | `AWS::EC2::VPC` | CIDR blocks, Subnets, NAT Gateways | NAT Gateway Byte Throughput | Multi-AZ Subnets, Flow Logs |
| **AWS ELB** | `AWS::ElasticLoadBalancingV2` | ALB Scheme, DNS name, Target groups | `TargetResponseTime`, `HTTPCode_Target_5XX`| TLS 1.3, Access Logging |
