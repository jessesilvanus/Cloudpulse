provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CLOUDPULSE"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "https://github.com/cloudpulse/cloudpulse"
    }
  }
}
