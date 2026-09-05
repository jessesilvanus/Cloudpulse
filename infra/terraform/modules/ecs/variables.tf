variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "ecs_security_group_id" {
  type = string
}

variable "execution_role_arn" {
  type = string
}

variable "task_role_arn" {
  type = string
}

variable "web_target_group_arn" {
  type = string
}

variable "api_target_group_arn" {
  type = string
}

variable "gateway_target_group_arn" {
  type = string
}

variable "ecr_repository_urls" {
  type = map(string)
}

variable "task_cpu" {
  type = number
}

variable "task_memory" {
  type = number
}
