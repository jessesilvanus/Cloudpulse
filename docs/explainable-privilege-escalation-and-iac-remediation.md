# Explainable IAM Privilege Escalation & IaC Remediation

## IAM Least Privilege & Privilege Escalation Model

CLOUDPULSE continuously analyzes IAM role permissions, trust policies, and Service Control Policies (SCPs) to detect potential escalation vectors without fabricating unobserved attacks.

### Explored Privilege Escalation Vector (`sec-aws-02`)

1. **Actor Identity**: `external-contractor-temp` (IAM User / Temporary Credential)
2. **Target Role**: `CloudPulseReadOnlyRole`
3. **Attempted API Action**: `iam:AttachRolePolicy` attaching `arn:aws:iam::aws:policy/AdministratorAccess`
4. **Intervention**: AWS Organizations SCP `policy-guard-root` intercepted and blocked the action.
5. **Finding Classification**: `CRITICAL` severity, `RESOLVED` status (Blocked).

---

## IaC Remediation Synthesis

For infrastructure configuration drift, CLOUDPULSE provides copy-pasteable declarative Terraform snippets rather than running unreviewed real-cloud mutations.

Example for Security Group Ingress (`sg-cloudpulse-ingress-sec`):

```hcl
resource "aws_security_group_rule" "allow_ssh_bastion" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/16"]
  security_group_id = aws_security_group.ingress.id
  description       = "Restrict SSH to internal corporate VPC CIDR range"
}
```
