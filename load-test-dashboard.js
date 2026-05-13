import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Warm up with 10 users
    { duration: '40s', target: 50 },   // Increase to 50
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

function testDashboard() {
  const BASE_URL = "https://fhis-c4i.siagalabs.dev/fhis-api/v1";
  const BEARER_TOKEN = __ENV.BEARER_TOKEN;

  const role = encodeURIComponent("Penyelia HQ");
  const date = encodeURIComponent("2026-01-29T01:28:08.950Z");
  const URL = `${BASE_URL}/dashboard/state/filter?role=${role}&inspection_target_date=${date}`;

  const params = {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  const response = http.get(URL, params);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}













//--------------------------------------------------------------------- Main test function ---------------------------------------------------------------------//
export default function () {
  testDashboard();
}
//--------------------------------------------------------------------- Main test function ---------------------------------------------------------------------//

// Setup function (runs once before the test starts)
export function setup() {
  const startTime = new Date().toISOString();
  console.log('Starting load test...');
  console.log(`Test started at: ${startTime}`);
  return { startTime };
}

// Teardown function (runs once after the test completes)
export function teardown(data) {
  const endTime = new Date().toISOString();
  console.log('Load test completed!');
  console.log(`Test ended at: ${endTime}`);
}

// Export results to HTML and PDF-ready format
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  return {
    // Beautiful HTML report with charts
    [`load-test-dashboard-report-${timestamp}.html`]: htmlReport(data),

    // // PDF-ready HTML report (styled for printing/PDF conversion)
    // [`load-test-report-pdf-ready-${timestamp}.html`]: generatePdfReadyReport(data),

    // // JSON for raw data
    // [`load-test-results-${timestamp}.json`]: JSON.stringify(data, null, 2),

    // Console summary
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

