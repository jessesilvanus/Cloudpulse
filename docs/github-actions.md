# CLOUDPULSE — GitHub Actions Reference & Security Configuration

## 1. Secrets & Environment Variables Matrix

| Secret / Variable Name | Scope | Description |
| :--- | :--- | :--- |
| `AWS_PROD_DEPLOY_ROLE_ARN` | GitHub Environment (`production`) | IAM Role ARN for AWS OIDC production deployment |
| `AWS_STAGING_DEPLOY_ROLE_ARN`| GitHub Environment (`staging`) | IAM Role ARN for AWS OIDC staging deployment |
| `SLACK_WEBHOOK_URL` | GitHub Repository Secret | Webhook for deployment status notifications |

---

## 2. AWS OIDC Role Trust Policy (No Long-Lived Credentials)

To allow GitHub Actions runners to deploy without static AWS keys:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:cloudpulse/cloudpulse:environment:production"
        }
      }
    }
  ]
}
```

---

## 3. Least-Privilege IAM Permissions for CI/CD

The deployment IAM role requires only:
- `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`
- `eks:DescribeCluster`
- Scoped to `arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/cloudpulse/*` and `arn:aws:eks:us-east-1:ACCOUNT_ID:cluster/cloudpulse-*`.
