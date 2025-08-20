#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Comic Strip Generator
 * Tests all API endpoints and frontend functionality
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:3000';
let authToken = '';
let testComicId = '';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, success, error = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
  
  testResults.tests.push({ name, success, error: error?.message || error });
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Test case implementations
const testCases = {
  // Test Case 1: User Registration
  async testUserRegistration() {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
      
      const success = response.status === 201 && 
                     response.data.success && 
                     response.data.data.user && 
                     response.data.data.token;
      
      if (success) {
        authToken = response.data.data.token;
      }
      
      logTest('User Registration', success);
    } catch (error) {
      // Registration might fail if user exists, try login instead
      if (error.response?.status === 409) {
        await this.testUserLogin();
      } else {
        logTest('User Registration', false, error);
      }
    }
  },

  // Test Case 2: User Login
  async testUserLogin() {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'user4@user.com',
        password: 'Allr1ght!'
      });
      
      const success = response.status === 200 && 
                     response.data.success && 
                     response.data.data.user && 
                     response.data.data.token;
      
      if (success) {
        authToken = response.data.data.token;
      }
      
      logTest('User Login', success);
    } catch (error) {
      logTest('User Login', false, error);
    }
  },

  // Test Case 3: Get User Comics
  async testGetUserComics() {
    try {
      const response = await axios.get(`${API_BASE}/comics`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const success = response.status === 200 && 
                     response.data.success && 
                     Array.isArray(response.data.data.comics);
      
      if (success && response.data.data.comics.length > 0) {
        testComicId = response.data.data.comics[0].id;
      }
      
      logTest('Get User Comics', success);
    } catch (error) {
      logTest('Get User Comics', false, error);
    }
  },

  // Test Case 4: Get Specific Comic
  async testGetComic() {
    if (!testComicId) {
      logTest('Get Specific Comic', false, 'No comic ID available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/comics/${testComicId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const success = response.status === 200 && 
                     response.data.success && 
                     response.data.data && 
                     response.data.data.id === testComicId;
      
      logTest('Get Specific Comic', success);
    } catch (error) {
      logTest('Get Specific Comic', false, error);
    }
  },

  // Test Case 5: Get Comic Status
  async testGetComicStatus() {
    if (!testComicId) {
      logTest('Get Comic Status', false, 'No comic ID available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/comics/${testComicId}/status`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const success = response.status === 200 && 
                     response.data.success && 
                     response.data.data && 
                     typeof response.data.data.status === 'string';
      
      logTest('Get Comic Status', success);
    } catch (error) {
      logTest('Get Comic Status', false, error);
    }
  },

  // Test Case 6: Update Comic
  async testUpdateComic() {
    if (!testComicId) {
      logTest('Update Comic', false, 'No comic ID available');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE}/comics/${testComicId}`, {
        title: 'Updated Test Comic Title',
        metadata: { genre: 'adventure', style: 'modern' }
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const success = response.status === 200 && 
                     response.data.success && 
                     response.data.data && 
                     response.data.data.title === 'Updated Test Comic Title';
      
      logTest('Update Comic', success);
    } catch (error) {
      logTest('Update Comic', false, error);
    }
  },

  // Test Case 7: Frontend Loading (Dashboard)
  async testFrontendDashboard() {
    try {
      const response = await axios.get(`${FRONTEND_BASE}/dashboard`);
      const success = response.status === 200 && 
                     response.data.includes('<title>') &&
                     response.data.includes('react');
      
      logTest('Frontend Dashboard Loading', success);
    } catch (error) {
      logTest('Frontend Dashboard Loading', false, error);
    }
  },

  // Test Case 8: Frontend Comic Viewer
  async testFrontendComicViewer() {
    if (!testComicId) {
      logTest('Frontend Comic Viewer', false, 'No comic ID available');
      return;
    }

    try {
      const response = await axios.get(`${FRONTEND_BASE}/comics/${testComicId}`);
      const success = response.status === 200 && 
                     response.data.includes('<title>');
      
      logTest('Frontend Comic Viewer', success);
    } catch (error) {
      logTest('Frontend Comic Viewer', false, error);
    }
  },

  // Test Case 9: API Authentication Required
  async testAuthenticationRequired() {
    try {
      const response = await axios.get(`${API_BASE}/comics`);
      // Should fail without auth token
      const success = response.status === 401;
      logTest('Authentication Required', success);
    } catch (error) {
      const success = error.response?.status === 401;
      logTest('Authentication Required', success, success ? null : error);
    }
  },

  // Test Case 10: Invalid Comic ID Handling
  async testInvalidComicId() {
    try {
      const response = await axios.get(`${API_BASE}/comics/invalid-id-123`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const success = false; // Should not reach here
      logTest('Invalid Comic ID Handling', success);
    } catch (error) {
      const success = error.response?.status === 404;
      logTest('Invalid Comic ID Handling', success, success ? null : error);
    }
  }
};

// Main test runner
async function runTests() {
  console.log('🚀 Starting Comic Strip Generator Test Suite\n');
  
  // Run all test cases in sequence
  for (const [testName, testFunction] of Object.entries(testCases)) {
    try {
      await testFunction();
    } catch (error) {
      logTest(testName, false, `Unexpected error: ${error.message}`);
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});