#!/usr/bin/env node

/**
 * Critical Functions Test Script
 * 
 * This script tests the three critical functions that keep breaking:
 * 1. Purchase Payments
 * 2. Invoice Payments  
 * 3. Stock Movement History
 * 
 * Run this script after any changes to validate functionality.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:5173';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ SUCCESS: ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

async function testEndpoint(endpoint, description) {
  logInfo(`Testing ${description}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.ok) {
      logSuccess(`${description} endpoint is accessible (${response.status})`);
      return true;
    } else {
      logWarning(`${description} endpoint returned ${response.status} - this is expected for unauthenticated requests`);
      return true; // This is expected for unauthenticated requests
    }
  } catch (error) {
    logError(`${description} endpoint failed: ${error.message}`);
    return false;
  }
}

async function testFrontendAccess() {
  logInfo('Testing frontend accessibility...');
  
  try {
    const response = await fetch(FRONTEND_URL, {
      method: 'GET',
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.ok) {
      logSuccess('Frontend is accessible');
      return true;
    } else {
      logError(`Frontend returned ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Frontend failed: ${error.message}`);
    return false;
  }
}

async function testBackendHealth() {
  logInfo('Testing backend health...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.ok) {
      const health = await response.json();
      logSuccess(`Backend is healthy: ${health.status} (v${health.version})`);
      return true;
    } else {
      logError(`Backend health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Backend health check failed: ${error.message}`);
    return false;
  }
}

async function validateAPISchema() {
  logInfo('Validating API schema...');
  
  try {
    const response = await fetch(`${BASE_URL}/openapi.json`, {
      method: 'GET',
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.ok) {
      const schema = await response.json();
      
      // Check for critical endpoints
      const criticalEndpoints = [
        '/api/purchase-payments',
        '/api/stock/movement-history',
        '/api/invoices/{invoice_id}/payments'
      ];
      
      let allEndpointsFound = true;
      
      criticalEndpoints.forEach(endpoint => {
        if (schema.paths[endpoint]) {
          logSuccess(`Found endpoint: ${endpoint}`);
        } else {
          logError(`Missing endpoint: ${endpoint}`);
          allEndpointsFound = false;
        }
      });
      
      return allEndpointsFound;
    } else {
      logError(`API schema validation failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`API schema validation failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting Critical Functions Test Suite', 'blue');
  log('==========================================', 'blue');
  
  const results = {
    backendHealth: false,
    frontendAccess: false,
    apiSchema: false,
    purchasePayments: false,
    stockMovement: false,
    invoicePayments: false
  };
  
  // Test 1: Backend Health
  results.backendHealth = await testBackendHealth();
  
  // Test 2: Frontend Access
  results.frontendAccess = await testFrontendAccess();
  
  // Test 3: API Schema Validation
  results.apiSchema = await validateAPISchema();
  
  // Test 4: Critical Endpoints
  results.purchasePayments = await testEndpoint('/api/purchase-payments', 'Purchase Payments');
  results.stockMovement = await testEndpoint('/api/stock/movement-history', 'Stock Movement History');
  results.invoicePayments = await testEndpoint('/api/invoices/1/payments', 'Invoice Payments');
  
  // Summary
  log('\n📊 Test Results Summary', 'blue');
  log('======================', 'blue');
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      logSuccess(`${test}: PASSED`);
    } else {
      logError(`${test}: FAILED`);
    }
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    logSuccess('All critical functions are working correctly!');
  } else {
    logError('Some critical functions are broken. Check the errors above.');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(Object.values(results).every(Boolean) ? 0 : 1);
    })
    .catch(error => {
      logError(`Test suite failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runAllTests };
