import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsOrganizationsEngine } from '../src/services/aws-organizations-engine.js';

describe('CLOUDPULSE Phase 45 Real AWS Multi-Account & AWS Organizations Intelligence', () => {
  const orgEngine = AwsOrganizationsEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should retrieve real AWS Organization summary and root hierarchy', () => {
    const org = orgEngine.getOrganization(validWorkspace);
    assert.ok(org);
    assert.strictEqual(org.organizationId, 'o-cloudpulse-corp-root');
    assert.strictEqual(org.managementAccountId, '718293041526');
    assert.strictEqual(org.featureSet, 'ALL');
    assert.strictEqual(org.accessStatus, 'ACCESSIBLE');
    assert.ok(org.roots.length >= 1);
    assert.strictEqual(org.provenance, 'LIVE');
  });

  it('should discover multiple AWS member accounts across Organizational Units', () => {
    const accounts = orgEngine.getAccounts(validWorkspace);
    assert.strictEqual(accounts.length, 4, 'Should discover exactly 4 member accounts in organization');

    const primary = accounts.find((a) => a.accountId === '718293041526');
    assert.ok(primary);
    assert.strictEqual(primary.accountName, 'CloudPulse-Production-Primary');
    assert.strictEqual(primary.isManagementAccount, true);
    assert.strictEqual(primary.organizationUnitName, 'Production Workloads');
    assert.strictEqual(primary.accessStatus, 'ACCESSIBLE');
    assert.strictEqual(primary.resourceCount, 18);
  });

  it('should accurately identify AWS Organization Management Account', () => {
    const org = orgEngine.getOrganization(validWorkspace);
    const managementAccount = org.accounts.find((a) => a.isManagementAccount);
    assert.ok(managementAccount);
    assert.strictEqual(managementAccount.accountId, '718293041526');
    assert.strictEqual(managementAccount.organizationId, org.organizationId);
  });

  it('should evaluate account access diagnostics across all 6 core cloud domains', () => {
    const auditAccount = orgEngine.getAccountById('950182746391', validWorkspace);
    assert.ok(auditAccount);
    assert.strictEqual(auditAccount.accessStatus, 'PARTIAL_ACCESS');
    assert.strictEqual(auditAccount.diagnostics.resourceAccess, 'HEALTHY');
    assert.strictEqual(auditAccount.diagnostics.iamAccess, 'HEALTHY');
    assert.strictEqual(auditAccount.diagnostics.costAccess, 'PERMISSION_REQUIRED');
    assert.ok(auditAccount.diagnostics.diagnosticNotes?.includes('ce:GetCostAndUsage'));
  });

  it('should filter accounts by status, accessStatus, and search query', () => {
    const accessible = orgEngine.getAccounts(validWorkspace, { accessStatus: 'ACCESSIBLE' });
    assert.strictEqual(accessible.length, 2);

    const partial = orgEngine.getAccounts(validWorkspace, { accessStatus: 'PARTIAL_ACCESS' });
    assert.strictEqual(partial.length, 1);

    const searchRes = orgEngine.getAccounts(validWorkspace, { search: 'sandbox' });
    assert.strictEqual(searchRes.length, 1);
    assert.strictEqual(searchRes[0].accountId, '104829175938');
  });

  it('should construct hierarchical Organization Tree (Root -> OU -> Account)', () => {
    const tree = orgEngine.getOrganizationTree(validWorkspace);
    assert.ok(tree);
    assert.strictEqual(tree.type, 'ROOT');
    assert.strictEqual(tree.id, 'o-cloudpulse-corp-root');
    assert.ok(tree.children && tree.children.length === 2, 'Should have 2 OUs');

    const prodOU = tree.children.find((c) => c.id === 'ou-prod-workloads');
    assert.ok(prodOU);
    assert.strictEqual(prodOU.type, 'OU');
    assert.ok(prodOU.children && prodOU.children.length === 2, 'Prod OU should contain 2 accounts');
  });

  it('should execute account synchronization without failing on inaccessible member accounts', async () => {
    const syncRes = await orgEngine.syncAccounts(validWorkspace);
    assert.strictEqual(syncRes.discoveredCount, 4);
    assert.strictEqual(syncRes.accessibleCount, 3);
    assert.strictEqual(syncRes.failedCount, 1);
    assert.ok(syncRes.timestamp);
  });

  it('should calculate transparent organization health score with coverage percentage', () => {
    const org = orgEngine.getOrganization(validWorkspace);
    assert.strictEqual(org.calculatedOrganizationHealth, 91); // Average of (90 + 96 + 88) / 3 = 91
    assert.strictEqual(org.visibilityCoveragePercent, 75); // 3 out of 4 accounts accessible/partial
    assert.strictEqual(org.coverageStatus, 'PARTIAL_ORGANIZATION_VISIBILITY');
  });

  it('should return truthful NOT_CONNECTED provenance for disconnected workspaces', () => {
    const disconnectedWs = 'ws-disconnected-workspace';
    const accounts = orgEngine.getAccounts(disconnectedWs);
    assert.strictEqual(accounts.length, 0);

    const org = orgEngine.getOrganization(disconnectedWs);
    assert.strictEqual(org.provenance, 'NOT_CONNECTED');
    assert.strictEqual(org.accessStatus, 'NOT_ENABLED');
  });

  it('should strictly enforce tenant isolation preventing cross-workspace account discovery', () => {
    const unauthorizedAccount = orgEngine.getAccountById('718293041526', 'ws-unauthorized-tenant');
    assert.strictEqual(unauthorizedAccount, null, 'Cross-workspace tenant lookup must return null');
  });
});
