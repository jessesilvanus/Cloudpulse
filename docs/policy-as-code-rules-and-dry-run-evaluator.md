# Policy-as-Code Rules & Dry-Run Evaluator

## Rule Evaluation Model

Policies are represented using structured Abstract Syntax Trees (ASTs) rather than unconstrained scripting languages to prevent remote code execution:

```json
{
  "resourceType": "AWS::S3::Bucket",
  "condition": "publicAccessBlock.blockPublicAcls == true && publicAccessBlock.blockPublicPolicy == true",
  "expected": true
}
```

---

## Dry-Run Simulation

The dry-run simulator allows operators to preview the compliance impact of a prospective policy without modifying live AWS infrastructure:
- **Evaluated Resources**: 4
- **Expected PASS**: 3
- **Expected FAIL**: 1
- **Simulation Result**: `COMPLIANT` (`CALCULATED`)
