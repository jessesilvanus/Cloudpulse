variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes version for EKS control plane"
  default     = "1.30"
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "node_instance_types" {
  type        = list(string)
  description = "EC2 instance types for EKS managed node group"
  default     = ["t3.medium"]
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "use_spot_instances" {
  type        = bool
  description = "Use EC2 Spot instances for EKS worker nodes to save 70% compute cost"
  default     = true
}
