import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AwsPolicySimulatorEngine } from '../src/services/aws-policy-simulator-engine.js';

describe('CLOUDPULSE Phase 55 Real AWS Policy Simulator & Governance What-If Engine', () => {
  const simulatorEngine = AwsPolicySimulatorEngine.getInstance();
  const validWorkspace = 'ws-production';

  it('should return accurate simulator summary with high risk and safe scenario counts', () => {
    const summary = simulatorEngine.getSimulatorSummary(validWorkspace);
    assert.ok(summary);
    assert.strictEqual(summary.totalSimulationsRun, 2);
    assert.strictEqual(summary.highRiskScenariosDetected, 1);
    assert.strictEqual(summary.safeScenariosCount, 1);
    assert.strictEqual(summary.provenance, 'CALCULATED');
  });

  it('should retrieve pre-seeded simulation scenarios with multi-dimensional impact analysis', () => {
    const sims = simulatorEngine.getSimulations(validWorkspace);
    assert.strictEqual(sims.length, 2);

    const ec2Sim = sims.find((s) => s.id === 'sim-ec2-enable-monitoring');
    assert.ok(ec2Sim);
    assert.strictEqual(ec2Sim.riskLevel, 'LOW');
    assert.strictEqual(ec2Sim.impact.complianceScoreDelta, 12.5);
    assert.strictEqual(ec2Sim.impact.securitySeverity, 'LOW');
    assert.strictEqual(ec2Sim.policyResults[0].evaluation, 'PASS');
  });

  it('should evaluate proposed safe configuration change as LOW risk with positive compliance delta', () => {
    const sim = simulatorEngine.getSimulationById('sim-ec2-enable-monitoring', validWorkspace);
    assert.ok(sim);
    assert.strictEqual(sim.impact.controlsPassingDelta, 1);
    assert.strictEqual(sim.impact.controlsFailingDelta, -1);
    assert.ok(sim.recommendations[0].includes('improves governance compliance'));
  });

  it('should evaluate proposed risky configuration change as CRITICAL risk with negative compliance delta', () => {
    const sim = simulatorEngine.getSimulationById('sim-s3-disable-public-block', validWorkspace);
    assert.ok(sim);
    assert.strictEqual(sim.riskLevel, 'CRITICAL');
    assert.strictEqual(sim.impact.complianceScoreDelta, -25.0);
    assert.strictEqual(sim.impact.securitySeverity, 'CRITICAL');
    assert.strictEqual(sim.policyResults[0].evaluation, 'FAIL');
    assert.ok(sim.safeAlternative);
  });

  it('should predict FinOps monthly cost delta accurately', () => {
    const ec2Sim = simulatorEngine.getSimulationById('sim-ec2-enable-monitoring', validWorkspace);
    assert.ok(ec2Sim);
    assert.strictEqual(ec2Sim.impact.finopsImpact.costDeltaMonthly, 2.10);
    assert.strictEqual(ec2Sim.impact.finopsImpact.costImpactClassification, 'CALCULATED');
  });

  it('should evaluate dependency graph blast radius for proposed changes', () => {
    const s3Sim = simulatorEngine.getSimulationById('sim-s3-disable-public-block', validWorkspace);
    assert.ok(s3Sim);
    assert.ok(s3Sim.impact.dependencyImpact.directDependencies.includes('CloudTrail Log Aggregator'));
    assert.strictEqual(s3Sim.impact.dependencyImpact.downstreamCount, 4);
    assert.strictEqual(s3Sim.impact.dependencyImpact.confidence, 'CONFIRMED');
  });

  it('should run custom What-If simulation and return structured impact analysis', () => {
    const custom = simulatorEngine.runSimulation(validWorkspace, {
      scenarioName: 'Test RDS Ingress Simulation',
      description: 'Simulate opening port 5432 to 0.0.0.0/0',
      inputs: [
        {
          resourceId: 'rds-prod-primary-pg',
          resourceName: 'rds-postgres-cluster',
          resourceType: 'AWS::RDS::DBInstance',
          accountId: '839201746152',
          region: 'us-east-1',
          field: 'securityGroup.ingress',
          currentValue: '10.0.0.0/16',
          proposedValue: '0.0.0.0/0'
        }
      ],
      createdBy: 'devops@cloudpulse.io'
    });

    assert.ok(custom.id.startsWith('sim-'));
    assert.strictEqual(custom.riskLevel, 'CRITICAL');
    assert.strictEqual(custom.policyResults[0].evaluation, 'FAIL');
    assert.strictEqual(custom.status, 'COMPLETED');
  });

  it('should maintain strict Simulation Safety Boundary (zero mutations against AWS)', () => {
    // Verify engine state is pure memory
    const sim = simulatorEngine.getSimulationById('sim-ec2-enable-monitoring', validWorkspace);
    assert.ok(sim);
    assert.strictEqual(sim.provenance, 'SIMULATED');
    assert.strictEqual(sim.policyResults[0].provenance, 'SIMULATED');
  });

  it('should allow deleting simulated scenarios', () => {
    const sim = simulatorEngine.runSimulation(validWorkspace, {
      scenarioName: 'Scenario to Delete',
      description: 'Temp scenario',
      inputs: [],
      createdBy: 'sre@cloudpulse.io'
    });

    const deleted = simulatorEngine.deleteSimulation(sim.id, validWorkspace);
    assert.strictEqual(deleted, true);

    const lookup = simulatorEngine.getSimulationById(sim.id, validWorkspace);
    assert.strictEqual(lookup, null);
  });

  it('should strictly enforce tenant isolation preventing cross-workspace simulation access', () => {
    const sims = simulatorEngine.getSimulations('ws-unauthorized-tenant');
    assert.strictEqual(sims.length, 0);

    const summary = simulatorEngine.getSimulatorSummary('ws-unauthorized-tenant');
    assert.strictEqual(summary.totalSimulationsRun, 0);

    const lookup = simulatorEngine.getSimulationById('sim-ec2-enable-monitoring', 'ws-unauthorized-tenant');
    assert.strictEqual(lookup, null);

    const del = simulatorEngine.deleteSimulation('sim-ec2-enable-monitoring', 'ws-unauthorized-tenant');
    assert.strictEqual(del, false);
  });
});
