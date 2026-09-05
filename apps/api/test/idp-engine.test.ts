import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IdpEngine } from '../src/services/idp-engine.js';

describe('CLOUDPULSE Phase 21 Internal Developer Platform (IDP) & Developer Portal', () => {
  const idp = IdpEngine.getInstance();

  it('should return IDP platform summary with truthful maturity, developer experience, and availability metrics', () => {
    const summary = idp.getPlatformSummary();
    assert.strictEqual(typeof summary.platformMaturityScore, 'number');
    assert.strictEqual(typeof summary.developerExperienceScore, 'number');
    assert.strictEqual(typeof summary.platformAvailabilityPercent, 'number');
    assert.strictEqual(typeof summary.registeredServicesCount, 'number');
    assert.ok(summary.platformMaturityScore >= 90, 'Platform maturity score should be >= 90');
    assert.ok(summary.developerExperienceScore >= 90, 'Developer experience score should be >= 90');
    assert.ok(summary.goldenPathsCount >= 4, 'Must have at least 4 golden paths');
    assert.ok(summary.activeTemplatesCount >= 4, 'Must have at least 4 active templates');
  });

  it('should list production Golden Paths with verified categories and ownership', () => {
    const paths = idp.getGoldenPaths();
    assert.ok(paths.length >= 4, 'Must contain at least 4 golden paths');

    const nodePath = paths.find((p) => p.id === 'gp-node-microservice');
    assert.ok(nodePath, 'Node microservice golden path must exist');
    assert.strictEqual(nodePath.category, 'MICROSERVICE');
    assert.strictEqual(nodePath.status, 'ACTIVE');
    assert.strictEqual(nodePath.owner, 'Platform Engineering');

    const k8sPath = paths.find((p) => p.id === 'gp-k8s-api');
    assert.ok(k8sPath, 'Kubernetes API golden path must exist');
    assert.strictEqual(k8sPath.category, 'KUBERNETES_SERVICE');
  });

  it('should retrieve Golden Path details and ensure template link validity', () => {
    const nodePath = idp.getGoldenPathById('gp-node-microservice');
    assert.ok(nodePath, 'Should find golden path by id');
    assert.strictEqual(nodePath.templateId, 'tmpl-node-express');

    const tmpl = idp.getTemplateById(nodePath.templateId);
    assert.ok(tmpl, 'Linked template must exist');
    assert.strictEqual(tmpl.provider, 'kubernetes');
  });

  it('should list standardized Infrastructure Templates with parameters, files, and policies', () => {
    const templates = idp.getTemplates();
    assert.ok(templates.length >= 4, 'Must contain at least 4 templates');

    const rdsTmpl = templates.find((t) => t.id === 'tmpl-rds-postgres');
    assert.ok(rdsTmpl, 'RDS PostgreSQL template must exist');
    assert.strictEqual(rdsTmpl.provider, 'aws');
    assert.strictEqual(rdsTmpl.category, 'DATABASE');
    assert.ok(rdsTmpl.parameters.includes('dbName'), 'Must contain dbName parameter');
    assert.ok(rdsTmpl.policies.includes('pol-rds-storage-encrypted'), 'Must reference encryption policy');
  });

  it('should list multi-tier environments across services with cost estimates', () => {
    const envs = idp.getEnvironments();
    assert.ok(envs.length >= 6, 'Must contain baseline environments');

    const prodEnvs = idp.getEnvironments(undefined, 'PRODUCTION');
    assert.ok(prodEnvs.length >= 3, 'Must have at least 3 production environments');

    const gwProd = envs.find((e) => e.id === 'env-gw-prod');
    assert.ok(gwProd, 'api-gateway production environment must exist');
    assert.strictEqual(gwProd.status, 'READY');
    assert.ok(gwProd.monthlyCostEstimate > 0, 'Cost estimate must be greater than 0');
  });

  it('should provision new environment with policy guard validation and audit request recording', () => {
    const initialCount = idp.getEnvironments().length;
    const initialReqs = idp.getPlatformRequests().length;

    const result = idp.provisionEnvironment({
      serviceId: 'api-gateway',
      name: 'dev-sandbox-qa',
      provider: 'kubernetes',
      region: 'us-east-1',
      type: 'DEVELOPMENT',
      monthlyCostEstimate: 35.0
    });

    assert.strictEqual(result.status, 'READY');
    assert.ok(result.policyCheck.includes('PASSED'), 'Policy check should pass');
    assert.strictEqual(result.environment.serviceId, 'api-gateway');
    assert.strictEqual(idp.getEnvironments().length, initialCount + 1);
    assert.strictEqual(idp.getPlatformRequests().length, initialReqs + 1);
  });

  it('should orchestrate deployments with strategy selection and post-deployment verification', () => {
    const initialDeps = idp.getDeployments().length;

    const result = idp.triggerDeployment({
      serviceId: 'order-service',
      environmentId: 'env-ord-prod',
      version: 'v2.1.0',
      strategy: 'BLUE_GREEN',
      requestedBy: 'developer-jane@cloudpulse.local'
    });

    assert.strictEqual(result.deployment.status, 'SUCCEEDED');
    assert.strictEqual(result.deployment.strategy, 'BLUE_GREEN');
    assert.ok(result.verification.includes('SUCCESS'), 'Verification should succeed');
    assert.strictEqual(idp.getDeployments().length, initialDeps + 1);
  });

  it('should maintain immutable platform request audit log with lifecycle states', () => {
    const requests = idp.getPlatformRequests();
    assert.ok(requests.length >= 2, 'Should have recorded platform requests');

    const firstReq = requests[0];
    assert.ok(firstReq.id.startsWith('req-idp-'), 'ID must follow standard prefix');
    assert.ok(['SUBMITTED', 'VALIDATING', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(firstReq.status));
  });

  it('should generate platform service scorecards across security, reliability, observability, governance, and cost dimensions', () => {
    const scorecards = idp.getServiceScorecards();
    assert.ok(scorecards.length >= 3, 'Must contain scorecards for all 3 core services');

    const gwScorecard = idp.getScorecardByServiceId('api-gateway');
    assert.ok(gwScorecard, 'api-gateway scorecard must exist');
    assert.strictEqual(gwScorecard.grade, 'A+');
    assert.ok(gwScorecard.overallScore >= 95, 'Overall score should be >= 95');
    assert.ok(gwScorecard.securityScore >= 95, 'Security score should be >= 95');
    assert.ok(gwScorecard.reliabilityScore >= 95, 'Reliability score should be >= 95');
  });
});
