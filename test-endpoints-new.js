const axios = require('axios');

const NEW_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDIwMDgsImV4cCI6MTc2MTA0NjgwOH0.XRp-8-vVfmkuKvI8H52mMxeqYCl8uFo--NtKDpG7A3I';
const API_BASE_URL = 'https://api.diwanmotor.com/api';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${NEW_JWT_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'API-Test-Script/1.0',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Test endpoints
const endpoints = [
  { name: 'Auth Profile', url: '/auth/profile', method: 'GET' },
  { name: 'Products', url: '/products', method: 'GET' },
  { name: 'Categories', url: '/categories', method: 'GET' },
  { name: 'Brands', url: '/brands', method: 'GET' },
  { name: 'Customers', url: '/customers', method: 'GET' },
  { name: 'Suppliers', url: '/suppliers', method: 'GET' },
  { name: 'Users', url: '/users', method: 'GET' },
  { name: 'Branches', url: '/branches', method: 'GET' },
  { name: 'Transactions', url: '/transactions', method: 'GET' },
  { name: 'Stock Movements', url: '/stock-movements', method: 'GET' },
  { name: 'Roles', url: '/roles', method: 'GET' }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔄 Testing ${endpoint.name} (${endpoint.method} ${endpoint.url})...`);
    
    const response = await api({
      method: endpoint.method,
      url: endpoint.url
    });
    
    const data = response.data;
    let dataInfo = '';
    
    // Analyze response structure
    if (Array.isArray(data)) {
      dataInfo = `Array with ${data.length} items`;
    } else if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        dataInfo = `Object with data array (${data.data.length} items)`;
      } else if (data.success !== undefined) {
        dataInfo = `Success response: ${data.success}`;
      } else {
        dataInfo = `Object with keys: ${Object.keys(data).join(', ')}`;
      }
    } else {
      dataInfo = `${typeof data}: ${data}`;
    }
    
    console.log(`✅ SUCCESS: ${endpoint.name}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${dataInfo}`);
    
    // Show sample data structure if available
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log(`   Sample item keys: ${Object.keys(data.data[0]).join(', ')}`);
    } else if (Array.isArray(data) && data.length > 0) {
      console.log(`   Sample item keys: ${Object.keys(data[0]).join(', ')}`);
    }
    
    return { success: true, endpoint: endpoint.name, data: dataInfo, response: data };
    
  } catch (error) {
    console.log(`❌ FAILED: ${endpoint.name}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
    
    return { success: false, endpoint: endpoint.name, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Testing API Endpoints with New JWT Token');
  console.log('='.repeat(60));
  console.log(`Token: ${NEW_JWT_TOKEN.substring(0, 50)}...`);
  console.log(`Base URL: ${API_BASE_URL}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful endpoints: ${successful.length}/${results.length}`);
  console.log(`❌ Failed endpoints: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working endpoints:');
    successful.forEach(r => console.log(`   - ${r.endpoint}: ${r.data}`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(r => console.log(`   - ${r.endpoint}: ${r.error}`));
  }
  
  console.log('\n🎯 Recommendations:');
  if (successful.length === results.length) {
    console.log('   All endpoints working! Ready for production use.');
  } else if (successful.length > 0) {
    console.log('   Some endpoints working. Check failed ones for data issues.');
  } else {
    console.log('   No endpoints working. Check token validity and API server status.');
  }
}

// Run tests
runAllTests().catch(console.error);