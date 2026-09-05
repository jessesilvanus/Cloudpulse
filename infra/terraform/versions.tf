terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50.0"
    }
  }

  # Production remote backend configuration is documented in backend.tf.example
  # For local initialization and plan testing, local state is used by default.
}
