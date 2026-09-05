# CLOUDPULSE — Release Process & Change Management

## 1. Branching Strategy

CLOUDPULSE follows a trunk-based release flow:

- `main`: Protected production trunk. All changes merge via reviewed Pull Requests that pass CI.
- `feature/*`: Ephemeral feature branches created from `main`.
- `fix/*`: Ephemeral bugfix branches created from `main`.
- `v*.*.*`: Immutable Git release tags triggering production deployments.

---

## 2. Production Release Lifecycle

1. **Local Validation**:
   ```bash
   pnpm typecheck
   pnpm test
   pnpm -r build
   ```
2. **Pull Request**: Create a PR against `main`. GitHub Actions runs `.github/workflows/ci.yml` and `.github/workflows/security-scan.yml`.
3. **Merge to Main**: Triggers automatic deployment to Staging environment.
4. **Tag Production Release**:
   ```bash
   git tag -a v0.0.3 -m "Release v0.0.3: Kubernetes & EKS Production Pipeline"
   git push origin v0.0.3
   ```
5. **Production Deployment Execution**:
   - Triggers `.github/workflows/deploy-prod.yml`.
   - Requires manual reviewer approval in GitHub Environment settings.
   - Pushes immutable images to Amazon ECR.
   - Executes atomic Helm upgrade on Amazon EKS.
   - Runs post-deployment smoke test suite.
   - Automatically rolls back if any health probe or smoke test fails.
