# CLOUDPULSE — Common Cloud Resource Data Models

## 1. Normalized Resource Models

1. **`ComputeResource`**: Normalizes AWS EC2 instances, Azure VMs, and GCP Compute Engine VMs with standardized attributes (`vCpu`, `memoryGb`, `utilizationPercent`, `monthlyCost`).
2. **`StorageResource`**: Normalizes Amazon S3 buckets, Azure Blob containers, and Google Cloud Storage buckets (`storageType`, `capacityGb`, `usageGb`, `encrypted`, `versioningEnabled`).
3. **`NetworkResource`**: Normalizes AWS VPCs, Azure VNets, and GCP VPC networks (`cidrBlock`, `subnetsCount`, `natGatewaysCount`, `multiAz`).
4. **`KubernetesCluster`**: Normalizes Amazon EKS, Azure AKS, and Google GKE clusters (`clusterName`, `k8sVersion`, `nodeCount`, `podCount`, `status`).
