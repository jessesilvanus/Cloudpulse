variable "aws_region" {
  type        = string
  description = "AWS region for deployment"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment (development, staging, production)"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "Name of the project used in resource prefixes"
  default     = "cloudpulse"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones for multi-AZ deployment"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "enable_nat_gateway" {
  type        = bool
  description = "Enable NAT Gateway for private subnets (Cost warning: ~$32/month per AZ)"
  default     = false
}

variable "single_nat_gateway" {
  type        = bool
  description = "Deploy a single NAT Gateway across AZs to minimize non-production cost"
  default     = true
}

variable "domain_name" {
  type        = string
  description = "Optional custom domain name for CloudPulse (e.g. cloudpulse.io)"
  default     = ""
}

variable "enable_https" {
  type        = bool
  description = "Enable HTTPS listener on ALB (requires existing ACM certificate ARN)"
  default     = false
}

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN for HTTPS listener"
  default     = ""
}

variable "ecs_task_cpu" {
  type        = number
  description = "CPU units for ECS Fargate tasks (256 = 0.25 vCPU)"
  default     = 256
}

variable "ecs_task_memory" {
  type        = number
  description = "Memory (in MB) for ECS Fargate tasks (512 = 0.5 GB)"
  default     = 512
}

variable "telemetry_retention_days" {
  type        = number
  description = "CloudWatch log retention in days"
  default     = 30
}
