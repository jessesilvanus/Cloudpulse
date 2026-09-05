variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "log_retention_days" {
  type = number
}

variable "alb_arn_suffix" {
  type = string
}

variable "web_target_group_suffix" {
  type = string
}

variable "api_target_group_suffix" {
  type = string
}
