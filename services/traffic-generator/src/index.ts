const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002';
const INTERVAL_MS = Number(process.env.TRAFFIC_INTERVAL_MS) || 2000;

console.log(`[CloudPulse Traffic Generator] Targeting Gateway at ${GATEWAY_URL} every ${INTERVAL_MS}ms`);

const CUSTOMERS = ['cust-alice', 'cust-bob', 'cust-charlie', 'cust-david', 'cust-eve'];
const SKUS = [
  { sku: 'CLOUD-INSTANCE-4X', price: 199.99 },
  { sku: 'K8S-CLUSTER-STD', price: 450.00 },
  { sku: 'RDS-AURORA-PG', price: 280.50 },
  { sku: 'OTEL-COLLECTOR-SEAT', price: 29.99 },
];

let isRunning = true;
let totalRequestsSent = 0;
let successfulRequests = 0;
let failedRequests = 0;

async function sendCheckoutRequest() {
  const customerId = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  const item = SKUS[Math.floor(Math.random() * SKUS.length)];
  const qty = Math.floor(Math.random() * 3) + 1;
  const totalAmount = Math.round(item.price * qty * 100) / 100;

  totalRequestsSent++;

  try {
    const res = await fetch(`${GATEWAY_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        items: [{ sku: item.sku, quantity: qty, price: item.price }],
        totalAmount,
      }),
    });

    if (res.ok) {
      successfulRequests++;
      const data = await res.json();
      console.log(`[TrafficGen] [${res.status} OK] Checkout succeeded: order=${data.order?.orderId} trace=${data.traceId?.slice(0, 12)}... ($${totalAmount})`);
    } else {
      failedRequests++;
      console.log(`[TrafficGen] [${res.status} FAIL] Checkout failed as expected`);
    }
  } catch (err: any) {
    failedRequests++;
    console.log(`[TrafficGen] [ERROR] Could not reach gateway: ${err.message}`);
  }
}

async function loop() {
  while (isRunning) {
    await sendCheckoutRequest();
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

loop();

process.on('SIGINT', () => {
  isRunning = false;
  console.log(`\n[TrafficGen] Stopped. Total sent: ${totalRequestsSent}, Success: ${successfulRequests}, Failures: ${failedRequests}`);
  process.exit(0);
});
