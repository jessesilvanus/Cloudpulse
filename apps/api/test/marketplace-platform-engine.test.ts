import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MarketplacePlatformEngine } from '../src/services/marketplace-platform-engine.js';

describe('CLOUDPULSE Phase 29 Cloud Platform Marketplace & Developer Portal Engine', () => {
  const engine = MarketplacePlatformEngine.getInstance();

  it('should return Marketplace platform summary with truthful counts and policy compliance rate', () => {
    const summary = engine.getSummary();
    assert.strictEqual(typeof summary.catalogItemsCount, 'number');
    assert.ok(summary.catalogItemsCount >= 6, 'Must list catalog items');
    assert.strictEqual(summary.policyComplianceRate, 100.0);
    assert.strictEqual(summary.simulatedProvisioningsCount, 5);
  });

  it('should list approved service catalog items with category, provider, and risk filtering', () => {
    const allItems = engine.getCatalogItems();
    assert.ok(allItems.length >= 6);

    const k8sItems = engine.getCatalogItems('KUBERNETES');
    assert.strictEqual(k8sItems.length, 1);
    assert.strictEqual(k8sItems[0].name, 'microservice-workload');

    const awsItems = engine.getCatalogItems(undefined, 'aws');
    assert.ok(awsItems.length >= 4, 'Must list AWS catalog items');
    assert.ok(awsItems.every((i) => i.provider === 'aws'));
  });

  it('should retrieve reusable resource templates with parameters, defaults, and security policies', () => {
    const templates = engine.getTemplates();
    assert.ok(templates.length >= 2, 'Templates must exist');

    const k8sTmpl = templates.find((t) => t.id === 'tmpl-k8s-001');
    assert.ok(k8sTmpl);
    assert.strictEqual(k8sTmpl.version, 'v2.4.0');
    assert.ok(k8sTmpl.policies.includes('require-team-tag'));
    assert.ok(k8sTmpl.securityRequirements.includes('readOnlyRootFilesystem'));
  });

  it('should create self-service provisioning request with cost estimation and policy validation', () => {
    const req = engine.createRequest({
      requester: 'dev-engineer-03',
      team: 'Core Backend',
      application: 'Order Processing Engine',
      service: 'inventory-service',
      template: 'tmpl-k8s-001',
      environment: 'staging',
      region: 'us-east-1',
      parameters: { serviceName: 'inventory-service', replicas: 2 }
    });

    assert.strictEqual(req.policyResult, 'PASS');
    assert.strictEqual(req.securityResult, 'PASS');
    assert.strictEqual(req.estimatedMonthlyCost, 70.0);
    assert.strictEqual(req.provisioningStatus, 'PROVISIONED');
  });

  it('should enforce policy gating and reject provisioning requests for unapproved cloud regions', () => {
    assert.throws(
      () => {
        engine.createRequest({
          requester: 'dev-engineer-03',
          team: 'Core Backend',
          application: 'Order Processing Engine',
          service: 'inventory-service',
          template: 'tmpl-k8s-001',
          environment: 'production',
          region: 'ap-unapproved-region',
          parameters: { serviceName: 'inventory-service', replicas: 2 }
        });
      },
      /is not an approved multi-cloud region/
    );
  });

  it('should enforce Separation of Duties on request approval (Requester !== Approver)', () => {
    // Attempt self-approval (dev-engineer-02 is requester on req-prov-102)
    assert.throws(
      () => {
        engine.approveRequest('req-prov-102', 'dev-engineer-02');
      },
      /Separation of Duties violation/
    );
  });

  it('should approve request and register newly provisioned resource in central registry', () => {
    const approved = engine.approveRequest('req-prov-102', 'sre-lead-01');
    assert.strictEqual(approved.approvalStatus, 'APPROVED');
    assert.strictEqual(approved.provisioningStatus, 'PROVISIONED');

    const registry = engine.getRegistry('FinOps & Payments');
    assert.ok(registry.length >= 1, 'Resource must be registered');
  });

  it('should manage resource registry lifecycle and safe decommissioning workflow', () => {
    const registry = engine.getRegistry();
    assert.ok(registry.length >= 4);

    const decommissioned = engine.decommissionResource('reg-001', 'sre-lead-01');
    assert.strictEqual(decommissioned.status, 'DECOMMISSIONED');
  });

  it('should simulate end-to-end provisioning plan in DRY_RUN demo mode without real cloud creation', () => {
    const simulation = engine.simulateProvisioning('tmpl-k8s-001', { replicas: 3 });
    assert.strictEqual(simulation.simulationMode, 'DRY_RUN');
    assert.strictEqual(simulation.estimatedMonthlyCost, 105.0);
    assert.ok(simulation.safetyNotice.includes('DEMO / SIMULATION MODE'));
  });

  it('should provide structured natural language marketplace search recommendations', () => {
    const response = engine.queryMarketplace('I need a database for transactions');
    assert.strictEqual(response.status, 'OBSERVED');
    assert.ok(response.recommendations.length >= 2);
    assert.ok(response.policyNotice.includes('Phase 25 Governance'));
  });
});
