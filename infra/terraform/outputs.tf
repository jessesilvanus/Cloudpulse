output "vpc_id" {
  description = "ID of the provisioned VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "alb_dns_name" {
  description = "Public DNS name of the CloudPulse Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_http_endpoint" {
  description = "Public HTTP URL of CloudPulse SRE Console"
  value       = "http://${module.alb.alb_dns_name}"
}

output "ecr_repository_urls" {
  description = "Map of ECR repository URLs for container images"
  value       = module.ecr.repository_urls
}

output "ecs_cluster_name" {
  description = "Name of the ECS Fargate cluster"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS Fargate cluster"
  value       = module.ecs.cluster_arn
}
