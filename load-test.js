import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Test configuration
export const options = {
  // Realistic approach
  stages: [
    { duration: '10s', target: 10 },
    // { duration: '30s', target: 10 },   // Warm up with 10 users
    // { duration: '1m', target: 50 },    // Increase to 50
    // { duration: '1m', target: 100 },   // Increase to 100
    // { duration: '1m', target: 250 },   // Increase to 250
    // { duration: '1m', target: 500 },   // Peak at 500
    // { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be less than 10%
  },
};

function testDashboard() {
  const BASE_URL = "https://fhis-c4i.siagalabs.dev/fhis-api/v1";
  const URL = `${BASE_URL}/dashboard/state/filter?role=Penyelia HQ&inspection_target_date=2026-01-29T01:28:08.950Z`;
  const BEARER_TOKEN = 'BEARER_TOKEN';
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

function testMap() {
  const BASE_URL = "https://fhis-c4i.siagalabs.dev/fhis-api/v1";
  const URL = `${BASE_URL}/navigation/firehydrant/search/filter?boundWest=101.39694213867189&boundSouth=3.0218981802157385&boundEast=101.96823120117189&boundNorth=3.324244254076954&zoom=18`;
  const BEARER_TOKEN = 'BEARER_TOKEN';
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

function testSearchFh() {
  const BASE_URL = "https://fhis-c4i.siagalabs.dev/fhis-api/v1";
  const URL = `${BASE_URL}/firehydrant/search/filter?take=10&offset=0`;
  const BEARER_TOKEN = 'BEARER_TOKEN';
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









// Main test function
export default function () {
  // testDashboard();
  testMap();
  // testSearchFh();
}

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
    [`load-test-report-${timestamp}.html`]: htmlReport(data),

    // // PDF-ready HTML report (styled for printing/PDF conversion)
    // [`load-test-report-pdf-ready-${timestamp}.html`]: generatePdfReadyReport(data),

    // // JSON for raw data
    // [`load-test-results-${timestamp}.json`]: JSON.stringify(data, null, 2),

    // Console summary
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

