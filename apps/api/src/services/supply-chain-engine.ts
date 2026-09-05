import {
  SupplyChainRepository,
  SupplyChainBuild,
  SupplyChainDependency,
  SupplyChainVulnerability,
  SupplyChainSbom,
  SupplyChainContainer,
  SupplyChainArtifact,
  SupplyChainSignature,
  SupplyChainProvenance,
  SupplyChainGateDecision,
  SupplyChainSummary
} from '@cloudpulse/shared';

export class SupplyChainEngine {
  private static instance: SupplyChainEngine;

  private repositories: SupplyChainRepository[] = [
    {
      id: 'repo-gateway',
      name: 'cloudpulse-gateway',
      provider: 'github',
      url: 'https://github.com/cloudpulse/cloudpulse-gateway',
      owner: 'Platform Engineering',
      team: 'Platform Engineering',
      defaultBranch: 'main',
      language: 'TypeScript',
      framework: 'Express',
      service: 'api-gateway',
      status: 'ACTIVE'
    },
    {
      id: 'repo-orders',
      name: 'cloudpulse-orders',
      provider: 'github',
      url: 'https://github.com/cloudpulse/cloudpulse-orders',
      owner: 'Order Processing Squad',
      team: 'Core Backend',
      defaultBranch: 'main',
      language: 'TypeScript',
      framework: 'Express',
      service: 'order-service',
      status: 'ACTIVE'
    },
    {
      id: 'repo-payments',
      name: 'cloudpulse-payments',
      provider: 'github',
      url: 'https://github.com/cloudpulse/cloudpulse-payments',
      owner: 'Payment Platform Squad',
      team: 'FinOps & Payments',
      defaultBranch: 'main',
      language: 'TypeScript',
      framework: 'Express',
      service: 'payment-service',
      status: 'ACTIVE'
    }
  ];

  private builds: SupplyChainBuild[] = [
    {
      id: 'build-gw-104',
      repositoryId: 'repo-gateway',
      commit: 'e7c10b4f89d38101a88b72e124501a4e590021c1',
      branch: 'main',
      pipeline: 'release.yml',
      startedAt: '2026-08-31T18:00:00Z',
      completedAt: '2026-08-31T18:03:15Z',
      status: 'SUCCEEDED',
      builder: 'GitHub Actions Hosted Runner (Ubuntu 24.04)',
      environment: 'isolated-container',
      trustScore: 98.5
    },
    {
      id: 'build-ord-201',
      repositoryId: 'repo-orders',
      commit: '9fa014bca82103f19472e6128003a01f92e448b1',
      branch: 'main',
      pipeline: 'release.yml',
      startedAt: '2026-08-31T18:10:00Z',
      completedAt: '2026-08-31T18:13:40Z',
      status: 'SUCCEEDED',
      builder: 'GitHub Actions Hosted Runner (Ubuntu 24.04)',
      environment: 'isolated-container',
      trustScore: 97.0
    },
    {
      id: 'build-pay-099',
      repositoryId: 'repo-payments',
      commit: '3819fa98bc10023a887b2210519a4ec0128919af',
      branch: 'main',
      pipeline: 'release.yml',
      startedAt: '2026-08-31T18:20:00Z',
      completedAt: '2026-08-31T18:23:05Z',
      status: 'SUCCEEDED',
      builder: 'GitHub Actions Hosted Runner (Ubuntu 24.04)',
      environment: 'isolated-container',
      trustScore: 96.0
    }
  ];

  private dependencies: SupplyChainDependency[] = [
    {
      name: 'express',
      version: '4.21.2',
      ecosystem: 'npm',
      repositoryId: 'repo-gateway',
      license: 'MIT',
      direct: true,
      transitive: false,
      status: 'CURRENT'
    },
    {
      name: '@opentelemetry/sdk-node',
      version: '0.57.2',
      ecosystem: 'npm',
      repositoryId: 'repo-gateway',
      license: 'Apache-2.0',
      direct: true,
      transitive: false,
      status: 'CURRENT'
    },
    {
      name: 'prom-client',
      version: '15.1.3',
      ecosystem: 'npm',
      repositoryId: 'repo-orders',
      license: 'Apache-2.0',
      direct: true,
      transitive: false,
      status: 'CURRENT'
    },
    {
      name: 'jsonwebtoken',
      version: '9.0.2',
      ecosystem: 'npm',
      repositoryId: 'repo-gateway',
      license: 'MIT',
      direct: true,
      transitive: false,
      status: 'CURRENT'
    },
    {
      name: 'tar',
      version: '6.2.0',
      ecosystem: 'npm',
      repositoryId: 'repo-payments',
      license: 'ISC',
      direct: false,
      transitive: true,
      status: 'VULNERABLE'
    }
  ];

  private vulnerabilities: SupplyChainVulnerability[] = [
    {
      id: 'CVE-2026-2189',
      package: 'tar',
      version: '6.2.0',
      ecosystem: 'npm',
      severity: 'HIGH',
      cvss: 7.5,
      source: 'GitHub Security Advisory (GHSA-r628-8255-xxxx)',
      status: 'MITIGATING',
      fixedVersion: '6.2.1',
      affectedServices: ['payment-service'],
      discoveredAt: '2026-08-29T10:00:00Z'
    }
  ];

  private sboms: SupplyChainSbom[] = [
    {
      id: 'sbom-gw-104',
      repositoryId: 'repo-gateway',
      buildId: 'build-gw-104',
      format: 'CycloneDX',
      version: '1.5',
      generatedAt: '2026-08-31T18:02:00Z',
      packagesCount: 142,
      vulnerabilitiesCount: 0,
      components: [
        { name: 'express', version: '4.21.2', license: 'MIT', hash: 'sha256:88fa10b98...' },
        { name: '@opentelemetry/sdk-node', version: '0.57.2', license: 'Apache-2.0', hash: 'sha256:91b01c...' },
        { name: 'jsonwebtoken', version: '9.0.2', license: 'MIT', hash: 'sha256:10cf33...' }
      ]
    },
    {
      id: 'sbom-ord-201',
      repositoryId: 'repo-orders',
      buildId: 'build-ord-201',
      format: 'CycloneDX',
      version: '1.5',
      generatedAt: '2026-08-31T18:12:00Z',
      packagesCount: 168,
      vulnerabilitiesCount: 0,
      components: [
        { name: 'express', version: '4.21.2', license: 'MIT', hash: 'sha256:88fa10b98...' },
        { name: 'prom-client', version: '15.1.3', license: 'Apache-2.0', hash: 'sha256:498bc1...' }
      ]
    },
    {
      id: 'sbom-pay-099',
      repositoryId: 'repo-payments',
      buildId: 'build-pay-099',
      format: 'CycloneDX',
      version: '1.5',
      generatedAt: '2026-08-31T18:22:00Z',
      packagesCount: 155,
      vulnerabilitiesCount: 1,
      components: [
        { name: 'express', version: '4.21.2', license: 'MIT', hash: 'sha256:88fa10b98...' },
        { name: 'tar', version: '6.2.0', license: 'ISC', hash: 'sha256:1198ca...' }
      ]
    }
  ];

  private containers: SupplyChainContainer[] = [
    {
      repository: 'ghcr.io/cloudpulse/api-gateway',
      tag: 'v1.4.2',
      digest: 'sha256:5a9e7f82b1c430291e0a8d67c5432098b1a329e410b98c54a8e97010f3458921',
      registry: 'ghcr.io',
      baseImage: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      createdAt: '2026-08-31T18:03:00Z',
      vulnerabilityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      status: 'HEALTHY'
    },
    {
      repository: 'ghcr.io/cloudpulse/order-service',
      tag: 'v2.0.1',
      digest: 'sha256:7b1e8a93c4d521098e2b0c76d6543109a2b430e521c09d65b9f08121a4569032',
      registry: 'ghcr.io',
      baseImage: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      createdAt: '2026-08-31T18:13:00Z',
      vulnerabilityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      status: 'HEALTHY'
    },
    {
      repository: 'ghcr.io/cloudpulse/payment-service',
      tag: 'v1.1.0',
      digest: 'sha256:9c3e0a15d6f743210a4d2e98f8765321b4d652f743e21f87c1a20343c6781254',
      registry: 'ghcr.io',
      baseImage: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      createdAt: '2026-08-31T18:23:00Z',
      vulnerabilityCounts: { critical: 0, high: 1, medium: 0, low: 0 },
      status: 'WARNING'
    }
  ];

  private artifacts: SupplyChainArtifact[] = [
    {
      id: 'art-gw-104',
      name: 'api-gateway',
      version: 'v1.4.2',
      type: 'CONTAINER',
      digest: 'sha256:5a9e7f82b1c430291e0a8d67c5432098b1a329e410b98c54a8e97010f3458921',
      repositoryId: 'repo-gateway',
      buildId: 'build-gw-104',
      signatureStatus: 'VALID',
      provenanceStatus: 'VERIFIED',
      status: 'SECURE'
    },
    {
      id: 'art-ord-201',
      name: 'order-service',
      version: 'v2.0.1',
      type: 'CONTAINER',
      digest: 'sha256:7b1e8a93c4d521098e2b0c76d6543109a2b430e521c09d65b9f08121a4569032',
      repositoryId: 'repo-orders',
      buildId: 'build-ord-201',
      signatureStatus: 'VALID',
      provenanceStatus: 'VERIFIED',
      status: 'SECURE'
    },
    {
      id: 'art-pay-099',
      name: 'payment-service',
      version: 'v1.1.0',
      type: 'CONTAINER',
      digest: 'sha256:9c3e0a15d6f743210a4d2e98f8765321b4d652f743e21f87c1a20343c6781254',
      repositoryId: 'repo-payments',
      buildId: 'build-pay-099',
      signatureStatus: 'VALID',
      provenanceStatus: 'VERIFIED',
      status: 'AT_RISK'
    }
  ];

  private signatures: SupplyChainSignature[] = [
    {
      artifactId: 'art-gw-104',
      algorithm: 'ECDSA-P256-SHA256',
      identity: 'https://github.com/cloudpulse/cloudpulse/.github/workflows/release.yml@refs/heads/main',
      issuer: 'https://token.actions.githubusercontent.com',
      timestamp: '2026-08-31T18:03:10Z',
      status: 'VALID'
    },
    {
      artifactId: 'art-ord-201',
      algorithm: 'ECDSA-P256-SHA256',
      identity: 'https://github.com/cloudpulse/cloudpulse/.github/workflows/release.yml@refs/heads/main',
      issuer: 'https://token.actions.githubusercontent.com',
      timestamp: '2026-08-31T18:13:30Z',
      status: 'VALID'
    },
    {
      artifactId: 'art-pay-099',
      algorithm: 'ECDSA-P256-SHA256',
      identity: 'https://github.com/cloudpulse/cloudpulse/.github/workflows/release.yml@refs/heads/main',
      issuer: 'https://token.actions.githubusercontent.com',
      timestamp: '2026-08-31T18:23:00Z',
      status: 'VALID'
    }
  ];

  private provenances: SupplyChainProvenance[] = [
    {
      artifactId: 'art-gw-104',
      sourceRepository: 'https://github.com/cloudpulse/cloudpulse',
      commit: 'e7c10b4f89d38101a88b72e124501a4e590021c1',
      builder: 'https://github.com/actions/runner',
      buildEnvironment: 'ubuntu-24.04',
      buildTimestamp: '2026-08-31T18:03:00Z',
      slsaLevel: 'SLSA_BUILD_L3'
    },
    {
      artifactId: 'art-ord-201',
      sourceRepository: 'https://github.com/cloudpulse/cloudpulse',
      commit: '9fa014bca82103f19472e6128003a01f92e448b1',
      builder: 'https://github.com/actions/runner',
      buildEnvironment: 'ubuntu-24.04',
      buildTimestamp: '2026-08-31T18:13:00Z',
      slsaLevel: 'SLSA_BUILD_L3'
    },
    {
      artifactId: 'art-pay-099',
      sourceRepository: 'https://github.com/cloudpulse/cloudpulse',
      commit: '3819fa98bc10023a887b2210519a4ec0128919af',
      builder: 'https://github.com/actions/runner',
      buildEnvironment: 'ubuntu-24.04',
      buildTimestamp: '2026-08-31T18:23:00Z',
      slsaLevel: 'SLSA_BUILD_L3'
    }
  ];

  public static getInstance(): SupplyChainEngine {
    if (!SupplyChainEngine.instance) {
      SupplyChainEngine.instance = new SupplyChainEngine();
    }
    return SupplyChainEngine.instance;
  }

  public getSummary(): SupplyChainSummary {
    return {
      overallSecurityScore: 96.5,
      repositoriesCount: this.repositories.length,
      buildsCount: this.builds.length,
      sbomCoveragePercent: 100.0,
      signatureCoveragePercent: 100.0,
      provenanceCoveragePercent: 100.0,
      criticalVulnerabilitiesCount: this.vulnerabilities.filter((v) => v.severity === 'CRITICAL' && v.status === 'OPEN').length,
      highVulnerabilitiesCount: this.vulnerabilities.filter((v) => v.severity === 'HIGH' && (v.status === 'OPEN' || v.status === 'MITIGATING')).length,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getRepositories(): SupplyChainRepository[] {
    return this.repositories;
  }

  public getRepositoryById(id: string): SupplyChainRepository | undefined {
    return this.repositories.find((r) => r.id === id);
  }

  public getBuilds(repositoryId?: string): SupplyChainBuild[] {
    if (repositoryId) {
      return this.builds.filter((b) => b.repositoryId === repositoryId);
    }
    return this.builds;
  }

  public getDependencies(repositoryId?: string): SupplyChainDependency[] {
    if (repositoryId) {
      return this.dependencies.filter((d) => d.repositoryId === repositoryId);
    }
    return this.dependencies;
  }

  public getVulnerabilities(severity?: string, status?: string): SupplyChainVulnerability[] {
    return this.vulnerabilities.filter((v) => {
      if (severity && v.severity !== severity) return false;
      if (status && v.status !== status) return false;
      return true;
    });
  }

  public getSboms(repositoryId?: string, buildId?: string): SupplyChainSbom[] {
    return this.sboms.filter((s) => {
      if (repositoryId && s.repositoryId !== repositoryId) return false;
      if (buildId && s.buildId !== buildId) return false;
      return true;
    });
  }

  public compareSboms(
    id1: string,
    id2: string
  ): {
    baseSbomId: string;
    targetSbomId: string;
    addedComponents: string[];
    removedComponents: string[];
    updatedComponents: string[];
  } {
    const sbom1 = this.sboms.find((s) => s.id === id1);
    const sbom2 = this.sboms.find((s) => s.id === id2);
    if (!sbom1 || !sbom2) {
      throw new Error('One or both SBOM IDs not found for comparison');
    }

    const set1 = new Map(sbom1.components.map((c) => [c.name, c.version]));
    const set2 = new Map(sbom2.components.map((c) => [c.name, c.version]));

    const addedComponents: string[] = [];
    const removedComponents: string[] = [];
    const updatedComponents: string[] = [];

    for (const [name, ver] of set2.entries()) {
      if (!set1.has(name)) {
        addedComponents.push(`${name}@${ver}`);
      } else if (set1.get(name) !== ver) {
        updatedComponents.push(`${name} (${set1.get(name)} -> ${ver})`);
      }
    }

    for (const [name, ver] of set1.entries()) {
      if (!set2.has(name)) {
        removedComponents.push(`${name}@${ver}`);
      }
    }

    return {
      baseSbomId: id1,
      targetSbomId: id2,
      addedComponents,
      removedComponents,
      updatedComponents
    };
  }

  public getContainers(): SupplyChainContainer[] {
    return this.containers;
  }

  public getArtifacts(): SupplyChainArtifact[] {
    return this.artifacts;
  }

  public getSignatures(): SupplyChainSignature[] {
    return this.signatures;
  }

  public getProvenance(artifactId?: string): SupplyChainProvenance[] {
    if (artifactId) {
      return this.provenances.filter((p) => p.artifactId === artifactId);
    }
    return this.provenances;
  }

  public evaluateSupplyChainGate(artifactId: string): SupplyChainGateDecision {
    const artifact = this.artifacts.find((a) => a.id === artifactId);
    const signature = this.signatures.find((s) => s.artifactId === artifactId);
    const provenance = this.provenances.find((p) => p.artifactId === artifactId);
    const sbom = this.sboms.find((s) => s.buildId === artifact?.buildId);

    const violations: string[] = [];

    if (!artifact) {
      return {
        decision: 'BLOCK',
        target: artifactId,
        reason: `Artifact '${artifactId}' not found in registry.`,
        violations: ['ARTIFACT_NOT_FOUND'],
        evaluatedAt: new Date().toISOString()
      };
    }

    if (!signature || signature.status !== 'VALID') {
      violations.push('MISSING_OR_INVALID_CRYPTOGRAPHIC_SIGNATURE');
    }

    if (!provenance || provenance.slsaLevel !== 'SLSA_BUILD_L3') {
      violations.push('MISSING_OR_SUBSTANDARD_SLSA_PROVENANCE');
    }

    if (!sbom) {
      violations.push('MISSING_SBOM_ATTESTATION');
    }

    if (artifact.status === 'AT_RISK') {
      return {
        decision: 'WARN',
        target: artifactId,
        reason: 'Artifact contains non-critical vulnerabilities under active mitigation.',
        violations: ['TRANSITIVE_VULNERABILITY_UNDER_MITIGATION'],
        evaluatedAt: new Date().toISOString()
      };
    }

    if (violations.length > 0) {
      return {
        decision: 'BLOCK',
        target: artifactId,
        reason: 'Supply chain gate blocked: violations detected.',
        violations,
        evaluatedAt: new Date().toISOString()
      };
    }

    return {
      decision: 'PASS',
      target: artifactId,
      reason: 'Supply chain security gate passed: Valid signature, verified SLSA L3 provenance, and clean SBOM.',
      violations: [],
      evaluatedAt: new Date().toISOString()
    };
  }
}
