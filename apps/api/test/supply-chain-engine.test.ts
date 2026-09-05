import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SupplyChainEngine } from '../src/services/supply-chain-engine.js';

describe('CLOUDPULSE Phase 22 Cloud Software Supply Chain Security & Software Factory', () => {
  const sc = SupplyChainEngine.getInstance();

  it('should return Supply Chain summary with truthful metrics', () => {
    const summary = sc.getSummary();
    assert.strictEqual(typeof summary.overallSecurityScore, 'number');
    assert.strictEqual(typeof summary.repositoriesCount, 'number');
    assert.strictEqual(typeof summary.buildsCount, 'number');
    assert.strictEqual(summary.sbomCoveragePercent, 100.0);
    assert.strictEqual(summary.signatureCoveragePercent, 100.0);
    assert.strictEqual(summary.provenanceCoveragePercent, 100.0);
    assert.strictEqual(summary.criticalVulnerabilitiesCount, 0);
    assert.ok(summary.overallSecurityScore >= 95.0, 'Overall security score should meet baseline');
  });

  it('should list source code repositories and retrieve repository metadata', () => {
    const repos = sc.getRepositories();
    assert.ok(repos.length >= 3, 'Must track all 3 primary microservice repositories');

    const gwRepo = sc.getRepositoryById('repo-gateway');
    assert.ok(gwRepo, 'Gateway repo must exist');
    assert.strictEqual(gwRepo.name, 'cloudpulse-gateway');
    assert.strictEqual(gwRepo.status, 'ACTIVE');
    assert.strictEqual(gwRepo.language, 'TypeScript');
  });

  it('should track build executions with pipeline, commit hash, and SLSA build trust score', () => {
    const builds = sc.getBuilds();
    assert.ok(builds.length >= 3, 'Must record builds for all microservices');

    const gwBuild = builds.find((b) => b.id === 'build-gw-104');
    assert.ok(gwBuild, 'Gateway build must exist');
    assert.strictEqual(gwBuild.status, 'SUCCEEDED');
    assert.ok(gwBuild.commit.length >= 40, 'Must record full git commit SHA');
    assert.ok(gwBuild.trustScore >= 95.0, 'Trust score should be >= 95%');
  });

  it('should manage software dependencies with license and direct/transitive classification', () => {
    const deps = sc.getDependencies();
    assert.ok(deps.length >= 5, 'Must contain baseline dependencies');

    const expressDep = deps.find((d) => d.name === 'express');
    assert.ok(expressDep, 'Express dependency must exist');
    assert.strictEqual(expressDep.ecosystem, 'npm');
    assert.strictEqual(expressDep.license, 'MIT');
    assert.strictEqual(expressDep.direct, true);

    const tarDep = deps.find((d) => d.name === 'tar');
    assert.ok(tarDep, 'tar transitive dependency must exist');
    assert.strictEqual(tarDep.transitive, true);
    assert.strictEqual(tarDep.status, 'VULNERABLE');
  });

  it('should track security vulnerabilities with CVSS score, status lifecycle, and fixed versions', () => {
    const vulns = sc.getVulnerabilities();
    assert.ok(vulns.length >= 1, 'Should track open/mitigating vulnerabilities');

    const tarVuln = vulns.find((v) => v.id === 'CVE-2026-2189');
    assert.ok(tarVuln, 'CVE-2026-2189 must exist');
    assert.strictEqual(tarVuln.package, 'tar');
    assert.strictEqual(tarVuln.severity, 'HIGH');
    assert.strictEqual(tarVuln.cvss, 7.5);
    assert.strictEqual(tarVuln.status, 'MITIGATING');
    assert.strictEqual(tarVuln.fixedVersion, '6.2.1');
  });

  it('should maintain CycloneDX/SPDX SBOMs and compute diffs between build versions', () => {
    const sboms = sc.getSboms();
    assert.ok(sboms.length >= 3, 'Must maintain SBOMs for builds');

    const gwSbom = sboms.find((s) => s.id === 'sbom-gw-104');
    assert.ok(gwSbom, 'Gateway SBOM must exist');
    assert.strictEqual(gwSbom.format, 'CycloneDX');
    assert.ok(gwSbom.packagesCount > 0, 'Package count must be > 0');

    const diff = sc.compareSboms('sbom-gw-104', 'sbom-pay-099');
    assert.strictEqual(diff.baseSbomId, 'sbom-gw-104');
    assert.strictEqual(diff.targetSbomId, 'sbom-pay-099');
    assert.ok(diff.addedComponents.length > 0 || diff.removedComponents.length > 0);
  });

  it('should inspect container images and evaluate base image and vulnerability counts', () => {
    const containers = sc.getContainers();
    assert.ok(containers.length >= 3, 'Must inspect container images');

    const gwImage = containers.find((c) => c.repository.includes('api-gateway'));
    assert.ok(gwImage, 'Gateway container image must exist');
    assert.strictEqual(gwImage.status, 'HEALTHY');
    assert.ok(gwImage.baseImage.includes('distroless'), 'Should use minimal distroless base image');
    assert.ok(gwImage.digest.startsWith('sha256:'), 'Must track immutable sha256 digest');
  });

  it('should verify cryptographic artifact signatures and issuers', () => {
    const sigs = sc.getSignatures();
    assert.ok(sigs.length >= 3, 'Must track signatures for artifacts');

    const gwSig = sigs.find((s) => s.artifactId === 'art-gw-104');
    assert.ok(gwSig, 'Gateway signature must exist');
    assert.strictEqual(gwSig.status, 'VALID');
    assert.ok(gwSig.issuer.includes('githubusercontent.com'), 'Must record OIDC issuer identity');
  });

  it('should verify SLSA Build L3 provenance attestations', () => {
    const provenances = sc.getProvenance('art-gw-104');
    assert.ok(provenances.length >= 1, 'Gateway provenance must exist');

    const prov = provenances[0];
    assert.strictEqual(prov.slsaLevel, 'SLSA_BUILD_L3');
    assert.strictEqual(prov.sourceRepository, 'https://github.com/cloudpulse/cloudpulse');
  });

  it('should evaluate secure supply chain deployment gates (PASS, WARN, BLOCK)', () => {
    // Valid signed artifact with no vulnerabilities -> PASS
    const gwDecision = sc.evaluateSupplyChainGate('art-gw-104');
    assert.strictEqual(gwDecision.decision, 'PASS');
    assert.strictEqual(gwDecision.violations.length, 0);

    // Artifact with non-critical vulnerability under mitigation -> WARN
    const payDecision = sc.evaluateSupplyChainGate('art-pay-099');
    assert.strictEqual(payDecision.decision, 'WARN');
    assert.ok(payDecision.violations.includes('TRANSITIVE_VULNERABILITY_UNDER_MITIGATION'));

    // Non-existent artifact -> BLOCK
    const unknownDecision = sc.evaluateSupplyChainGate('art-unknown-999');
    assert.strictEqual(unknownDecision.decision, 'BLOCK');
    assert.ok(unknownDecision.violations.includes('ARTIFACT_NOT_FOUND'));
  });
});
