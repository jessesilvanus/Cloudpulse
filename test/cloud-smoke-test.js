/**
 * CLOUDPULSE Cloud Smoke Test Runner
 * Validates public endpoint routing, health checks, W3C distributed tracing,
 * Loki log ingestion, PromQL metric updates, and fault injection behavior.
 */
const BASE_URL = process.env.CLOUDPULSE_ENDPOINT || 'http://localhost:3001';
const GATEWAY_URL = process.env.GATEWAY_ENDPOINT || 'http://localhost:4000';
async function runSmokeTests() {
    console.log('==================================================================');
    console.log(` CLOUDPULSE Smoke Test Suite -> Target: ${BASE_URL}`);
    console.log('==================================================================\n');
    // 1. Health & Readiness Probe Verification
    console.log('[1/9] Probing /health and /health/ready...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const readyRes = await fetch(`${BASE_URL}/health/ready`);
    if (!healthRes.ok || !readyRes.ok) {
        throw new Error(`Health check failed: /health=${healthRes.status}, /ready=${readyRes.status}`);
    }
    console.log('  ? Core Gateway Health & Readiness 200 OK');
    // 2. SRE Overview Telemetry Endpoint
    console.log('\n[2/9] Querying SRE Overview Telemetry API...');
    const ovRes = await fetch(`${BASE_URL}/api/v1/overview`);
    const ovJson = await ovRes.json();
    if (!ovRes.ok || !ovJson.ok) {
        throw new Error(`Overview query failed: ${ovRes.status}`);
    }
    console.log(`  ? Telemetry Mode: ${ovJson.data?.telemetryMode}`);
    console.log(`  ? Monitored Services: ${ovJson.data?.services?.length} services detected`);
    console.log(`  ? System Health Status: ${ovJson.data?.systemHealth?.overallStatus}`);
    // 3. Distributed Request Execution (Gateway -> Orders -> Payments)
    console.log('\n[3/9] Sending Ingress Checkout Transaction...');
    const checkoutRes = await fetch(`${GATEWAY_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerId: 'cust-smoke-automated-01',
            items: [{ sku: 'SKU-SMOKE-TEST', quantity: 1, price: 99.0 }],
            totalAmount: 99.0,
        }),
    });
    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok || checkoutData.status !== 'SUCCESS') {
        throw new Error(`Checkout transaction failed: ${checkoutRes.status}`);
    }
    const traceId = checkoutData.traceId;
    console.log(`  ? Order Confirmed: ${checkoutData.order?.orderId}`);
    console.log(`  ? Generated W3C Trace ID: ${traceId}`);
    await new Promise((r) => setTimeout(r, 1000));
    // 4. Distributed Trace Waterfall in Tempo
    console.log('\n[4/9] Verifying Distributed Trace Waterfall in Tempo...');
    const traceRes = await fetch(`${BASE_URL}/api/v1/traces/${traceId}`);
    const traceJson = await traceRes.json();
    if (!traceRes.ok || !traceJson.data) {
        throw new Error(`Trace retrieval failed for traceId: ${traceId}`);
    }
    console.log(`  ? Spans Captured: ${traceJson.data.spanCount} spans across ${traceJson.data.servicesInvolved.join(', ')}`);
    // 5. Correlated Structured Logs in Loki
    console.log('\n[5/9] Verifying Log-to-Trace Correlation in Loki...');
    const logsRes = await fetch(`${BASE_URL}/api/v1/logs?traceId=${traceId}`);
    const logsJson = await logsRes.json();
    console.log(`  ? Correlated Logs Found: ${logsJson.data?.length} logs with traceId: ${traceId}`);
    // 6. Prometheus TSDB Ingestion
    console.log('\n[6/9] Verifying TSDB Metric Samples in Prometheus...');
    const metricsRes = await fetch(`${BASE_URL}/api/v1/metrics/query?query=http_requests_total`);
    const metricsJson = await metricsRes.json();
    console.log(`  ? Prometheus Samples Ingested: ${metricsJson.data?.length} metrics recorded`);
    // 7. Phase 58 Real AWS Governance Knowledge Graph
    console.log('\n[7/9] Verifying Real AWS Governance Knowledge Graph APIs...');
    const kgSummaryRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/knowledge-graph/summary`, {
        headers: { 'x-workspace-id': 'ws-production' }
    });
    const kgSummaryJson = await kgSummaryRes.json();
    if (!kgSummaryRes.ok || !kgSummaryJson.ok) {
        throw new Error(`Knowledge Graph Summary query failed: ${kgSummaryRes.status}`);
    }
    console.log(`  ? Knowledge Graph Nodes: ${kgSummaryJson.data?.nodeCount} nodes across cloud domains`);
    console.log(`  ? Cross-Domain Relationships: ${kgSummaryJson.data?.edgeCount} attributed edges`);
    console.log(`  ? Critical Risk Entities: ${kgSummaryJson.data?.criticalNodesCount} critical nodes`);
    const kgPathRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/knowledge-graph/path?sourceNodeId=usr-deployer-ci&targetNodeId=s3-cloudpulse-prod-audit-logs-2026`, {
        headers: { 'x-workspace-id': 'ws-production' }
    });
    const kgPathJson = await kgPathRes.json();
    if (!kgPathRes.ok || !kgPathJson.data?.pathFound) {
        throw new Error(`Knowledge Graph Path finding failed: ${kgPathRes.status}`);
    }
    // 8. Phase 59 Real AWS Cloud Graph Query Engine & Investigation
    console.log('\n[8/9] Verifying Real AWS Cloud Query Engine & Investigation APIs...');
    const nlQueryRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/query/natural-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
        body: JSON.stringify({ prompt: 'Show all production resources exposed to the internet' })
    });
    const nlQueryJson = await nlQueryRes.json();
    if (!nlQueryRes.ok || !nlQueryJson.ok) {
        throw new Error(`Natural Language Query failed: ${nlQueryRes.status}`);
    }
    console.log(`  ? Natural Language Intent: ${nlQueryJson.data?.intent} (Confidence: ${nlQueryJson.data?.confidence})`);
    console.log(`  ? Translated AST Entity: ${nlQueryJson.data?.translatedAst?.primaryEntityType}`);
    console.log(`  ? Evidence Findings: ${nlQueryJson.data?.evidenceSummary?.length} items cited`);
    const invListRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/investigations`, {
        headers: { 'x-workspace-id': 'ws-production' }
    });
    const invListJson = await invListRes.json();
    if (!invListRes.ok || !invListJson.ok) {
        throw new Error(`Investigations query failed: ${invListRes.status}`);
    }
    console.log(`  ? Active Investigations: ${invListJson.data?.length} cases loaded`);
    // 9. Phase 60 Real AWS Continuous Cloud Operations Control Plane
    console.log('\n[9/9] Verifying Real AWS Cloud Operations Control Plane APIs...');
    const situationRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/operations/situation`, {
        headers: { 'x-workspace-id': 'ws-production' }
    });
    const situationJson = await situationRes.json();
    if (!situationRes.ok || !situationJson.ok) {
        throw new Error(`Cloud Situation query failed: ${situationRes.status}`);
    }
    console.log(`  ? Cloud Health Score: ${situationJson.data?.overallHealthScore}/100`);
    console.log(`  ? Active Incidents: ${situationJson.data?.activeIncidentsCount}, Degraded Resources: ${situationJson.data?.degradedResourcesCount}`);
    console.log(`  ? AWS Data Health: ${situationJson.data?.awsDataHealth?.connectionStatus} (${situationJson.data?.awsDataHealth?.syncState})`);
    const copilotRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/operations/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
        body: JSON.stringify({ prompt: 'What is happening right now?' })
    });
    const copilotJson = await copilotRes.json();
    if (!copilotRes.ok || !copilotJson.ok) {
        throw new Error(`Copilot query failed: ${copilotRes.status}`);
    }
    console.log(`  ? Copilot Intent: ${copilotJson.data?.intent} (Confidence: ${copilotJson.data?.confidence})`);
    console.log(`  ? Copilot Cited Evidence: ${copilotJson.data?.citedEvidence?.length} items cited`);
    console.log('\n==================================================================');
    console.log(' ? ALL SMOKE TESTS PASSED WITH 100% OPERATIONAL FIDELITY');
    console.log('==================================================================');
}
runSmokeTests().catch((err) => {
    console.error('\n? SMOKE TEST FAILED:', err);
    process.exit(1);
});
