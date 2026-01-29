import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const apiLatency = new Trend('api_latency');
const activeUsers = new Gauge('active_users');
const errorCounter = new Counter('errors');

// Test data
const BASE_URL = 'https://test-api.k6.io';
const users = JSON.parse(open('./test-data.json') || '[]').length > 0 
  ? JSON.parse(open('./test-data.json'))
  : [
      { username: 'user1@example.com', password: 'pass123' },
      { username: 'user2@example.com', password: 'pass456' },
    ];

// Advanced test configuration with multiple scenarios
export const options = {
  scenarios: {
    // Smoke test - light load to verify basic functionality
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      tags: { test_type: 'smoke' },
    },
    
    // Load test - sustained load
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      startTime: '30s',
      gracefulRampDown: '30s',
      tags: { test_type: 'load' },
    },
    
    // Spike test - sudden traffic increase
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '10s', target: 0 },
      ],
      startTime: '16m',
      gracefulRampDown: '30s',
      tags: { test_type: 'spike' },
    },
    
    // Stress test - gradually increasing load
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '10m', target: 0 },
      ],
      startTime: '18m',
      tags: { test_type: 'stress' },
    },
  },
  
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{test_type:smoke}': ['p(95)<200'],
    'http_req_failed': ['rate<0.05'],
    'login_success_rate': ['rate>0.95'],
    'api_latency': ['p(95)<300'],
    'errors': ['count<100'],
    'http_reqs': ['rate>100'],
  },
  
  // Additional options
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/1.0',
  batch: 10,
  batchPerHost: 5,
};

// Setup function - runs once before test
export function setup() {
  console.log('🚀 Starting advanced load test...');
  
  // Warm up the API
  const warmupResponse = http.get(`${BASE_URL}/public/crocodiles/`);
  check(warmupResponse, {
    'warmup successful': (r) => r.status === 200,
  });
  
  return {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL,
  };
}

// Main test function
export default function (data) {
  // Update active users metric
  activeUsers.add(1);
  
  // Select random user
  const user = users[Math.floor(Math.random() * users.length)];
  
  // Authentication flow
  group('Authentication', function () {
    const loginPayload = JSON.stringify({
      username: user.username,
      password: user.password,
    });
    
    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'Login' },
    };
    
    const loginStart = Date.now();
    const loginRes = http.post(`${BASE_URL}/auth/token/login/`, loginPayload, loginParams);
    const loginDuration = Date.now() - loginStart;
    
    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login has access token': (r) => r.json('access') !== undefined,
      'login response time < 1s': (r) => r.timings.duration < 1000,
    });
    
    loginSuccessRate.add(loginSuccess);
    apiLatency.add(loginDuration);
    
    if (!loginSuccess) {
      errorCounter.add(1);
      console.error(`Login failed for ${user.username}`);
      return;
    }
    
    const authToken = loginRes.json('access');
    
    // API requests with authentication
    group('API Operations', function () {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };
      
      // GET request
      group('GET Operations', function () {
        const getRes = http.get(`${BASE_URL}/public/crocodiles/`, {
          headers: headers,
          tags: { name: 'GetCrocodiles' },
        });
        
        check(getRes, {
          'get status is 200': (r) => r.status === 200,
          'get has data': (r) => r.json().length > 0,
          'get response time < 500ms': (r) => r.timings.duration < 500,
        }) || errorCounter.add(1);
      });
      
      sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
      
      // POST request
      group('POST Operations', function () {
        const payload = JSON.stringify({
          name: `Croc-${Date.now()}`,
          sex: Math.random() > 0.5 ? 'M' : 'F',
          date_of_birth: '2020-01-01',
        });
        
        const postRes = http.post(`${BASE_URL}/my/crocodiles/`, payload, {
          headers: headers,
          tags: { name: 'CreateCrocodile' },
        });
        
        const postSuccess = check(postRes, {
          'post status is 201': (r) => r.status === 201,
          'post has id': (r) => r.json('id') !== undefined,
          'post response time < 800ms': (r) => r.timings.duration < 800,
        });
        
        if (!postSuccess) {
          errorCounter.add(1);
        }
        
        const crocodileId = postRes.json('id');
        
        if (crocodileId) {
          sleep(0.5);
          
          // PATCH request
          group('PATCH Operations', function () {
            const updatePayload = JSON.stringify({
              name: `Updated-Croc-${Date.now()}`,
            });
            
            const patchRes = http.patch(
              `${BASE_URL}/my/crocodiles/${crocodileId}/`,
              updatePayload,
              {
                headers: headers,
                tags: { name: 'UpdateCrocodile' },
              }
            );
            
            check(patchRes, {
              'patch status is 200': (r) => r.status === 200,
              'patch response time < 600ms': (r) => r.timings.duration < 600,
            }) || errorCounter.add(1);
          });
          
          sleep(0.5);
          
          // DELETE request
          group('DELETE Operations', function () {
            const deleteRes = http.del(`${BASE_URL}/my/crocodiles/${crocodileId}/`, null, {
              headers: headers,
              tags: { name: 'DeleteCrocodile' },
            });
            
            check(deleteRes, {
              'delete status is 204': (r) => r.status === 204,
              'delete response time < 400ms': (r) => r.timings.duration < 400,
            }) || errorCounter.add(1);
          });
        }
      });
    });
  });
  
  // Simulate user think time
  sleep(Math.random() * 3 + 1);
  
  activeUsers.add(-1);
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log('✅ Load test completed!');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}

// Custom summary report
export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
