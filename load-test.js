import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  // stages: [
  //   { duration: '30s', target: 10 },  // Ramp up to 10 users over 30 seconds
  //   { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
  //   { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  // ],
  stages: [
    { duration: '5s', target: 10 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be less than 10%
  },
};





function testDashboard() {
  const BASE_URL = "http://localhost:3002/fhis-api/v1";
  const URL = `${BASE_URL}/dashboard/state/filter?role=Penyelia HQ&inspection_target_date=2026-01-29T01:28:08.950Z`;
  const BEARER_TOKEN = 'BEARER_TOKEN';
  const params = {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  const response = http.get(URL, params);

  // Validate the response
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'body contains text': (r) => r.body.includes('Collection of simple web-pages'),
  });

  // Simulate user think time
  sleep(1);
}





// Main test function
export default function () {
  testDashboard();
}

// Setup function (runs once before the test starts)
export function setup() {
  console.log('Starting load test...');
}

// Teardown function (runs once after the test completes)
export function teardown(data) {
  console.log('Load test completed!');

















}
