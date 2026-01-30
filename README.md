# K6 Load Testing Guide

## 📦 Installation

### Install K6

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

## 🚀 Running Tests

### Basic Command
```bash
k6 run load-test.js
```

### With Options
```bash
# Run with 10 virtual users for 30 seconds
k6 run --vus 10 --duration 30s load-test.js

# Run with environment variable
k6 run -e BEARER_TOKEN=your-token-here load-test.js
```

## 📝 Basic Test Structure

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function () {
  const response = http.get('https://test.k6.io');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

## 📚 Common K6 Imports

```javascript
// HTTP requests
import http from 'k6/http';

// Checks and utilities
import { check, sleep } from 'k6';

// Custom metrics
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// Groups for organization
import { group } from 'k6';


## 📊 Viewing Results

Results are displayed in the console after the test completes:
- HTTP request duration
- Request count
- Error rate
- Virtual users

## 🎯 Tips

1. Start with low user counts (10-50 users)
2. Gradually increase load
3. Add `sleep()` to simulate real user behavior
4. Use checks to validate responses
5. Monitor your server during tests

## 📖 Documentation

Official K6 docs: https://k6.io/docs/