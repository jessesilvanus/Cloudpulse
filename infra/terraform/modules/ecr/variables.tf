variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "service_names" {
  type        = list(string)
  description = "List of microservices to create ECR repositories for"
}
