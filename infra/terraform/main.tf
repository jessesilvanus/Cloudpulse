# ── CLOUDPULSE Root Terraform Module ──────────────────────────────────────────

# 1. Virtual Private Cloud (VPC) Networking
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
}

# 2. Security Groups & Network Firewalls
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# 3. Least-Privilege IAM Roles
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
}

# 4. Amazon Elastic Container Registry (ECR)
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  service_names = [
    "cloudpulse-web",
    "cloudpulse-api",
    "api-gateway",
    "order-service",
    "payment-service",
    "traffic-generator",
  ]
}

# 5. Application Load Balancer (ALB)
module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id
  enable_https      = var.enable_https
  certificate_arn   = var.certificate_arn
}

# 6. Elastic Container Service (ECS) Fargate Cluster & Services
module "ecs" {
  source = "./modules/ecs"

  project_name             = var.project_name
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  ecs_security_group_id    = module.security.ecs_security_group_id
  execution_role_arn       = module.iam.ecs_execution_role_arn
  task_role_arn            = module.iam.ecs_task_role_arn
  web_target_group_arn     = module.alb.web_target_group_arn
  api_target_group_arn     = module.alb.api_target_group_arn
  gateway_target_group_arn = module.alb.gateway_target_group_arn
  ecr_repository_urls      = module.ecr.repository_urls
  task_cpu                 = var.ecs_task_cpu
  task_memory              = var.ecs_task_memory
}

# 7. CloudWatch & Observability Resources
module "observability" {
  source = "./modules/observability"

  project_name             = var.project_name
  environment              = var.environment
  log_retention_days       = var.telemetry_retention_days
  alb_arn_suffix           = module.alb.alb_arn_suffix
  web_target_group_suffix  = module.alb.web_target_group_arn_suffix
  api_target_group_suffix  = module.alb.api_target_group_arn_suffix
}
