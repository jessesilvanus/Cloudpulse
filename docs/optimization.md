# CLOUDPULSE — Cloud Cost Optimization & Waste Elimination

## 1. Waste Detection Categories

1. **Over-provisioned Requests**: CPU/Memory requests exceeding observed P95 usage by $>2.5\times$.
2. **Untagged ECR Image Layers**: Accumulation of old development images.
3. **Over-provisioned NAT Gateways**: Running multi-AZ NAT Gateways in non-production environments (Defaulted to $0 in CloudPulse dev/staging).
4. **On-Demand Node Instances**: Not leveraging AWS Spot instance fleets for fault-tolerant worker nodes.

---

## 2. Rightsizing Recommendations & Safety Gate

| Recommendation ID | Target Resource | Current Config | Recommended Config | Estimated Monthly Savings | Risk Level |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `rec-rightsize-payment` | `payment-service` | CPU: 200m, Mem: 256Mi | CPU: 100m, Mem: 160Mi | $14.80 | `Low` |
| `rec-ecr-lifecycle` | Amazon ECR | Indefinite retention | 7-day untagged expiry | $8.40 | `Low` |
| `rec-spot-nodes` | EKS Worker Nodes | Spot instances (`t3.medium`) | Maintain Spot fleets | $84.50 | `Low` |

**Safety Guarantee**: All recommendations remain in status `review_required` until reviewed and applied by an infrastructure engineer.
