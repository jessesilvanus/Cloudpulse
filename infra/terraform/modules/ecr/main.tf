# ── Amazon Elastic Container Registry (ECR) Repositories ─────────────────────
resource "aws_ecr_repository" "services" {
  for_each             = toset(var.service_names)
  name                 = "${var.project_name}/${var.environment}/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name    = "${var.project_name}-${var.environment}-${each.key}-repo"
    Service = each.key
  }
}

# ── ECR Lifecycle Policy (Cost Control: Clean untagged & keep last 30) ─────────
resource "aws_ecr_lifecycle_policy" "cleanup" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images older than 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep maximum 30 tagged production images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "release", "prod", "main"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
