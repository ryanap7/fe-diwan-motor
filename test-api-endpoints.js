// Test script to check all API endpoints with the provided JWT token
import { 
  authAPI, 
  productsAPI, 
  customersAPI, 
  suppliersAPI, 
  categoriesAPI, 
  brandsAPI, 
  usersAPI, 
  branchesAPI,
  transactionsAPI,
  setDevToken 
} from './lib/api.js';

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDA2MTEsImV4cCI6MTc2MTA0NTQxMX0.wC6ne1OZqTzzc4qXZqjQH-XejdxTBAfXt7BibF_Bhic';

async function testAllAPIs() {
  console.log('🚀 Starting API endpoint tests with JWT token...');
  
  // Set the token first
  setDevToken(JWT_TOKEN);
  
  const testResults = [];
  
  // Test Authentication API
  console.log('\n📊 Testing Authentication API...');
  try {
    const profileResult = await authAPI.getProfile();
    testResults.push({ endpoint: 'GET /auth/profile', status: '✅ SUCCESS', data: profileResult });
  } catch (error) {
    testResults.push({ endpoint: 'GET /auth/profile', status: '❌ FAILED', error: error.message });
  }
  
  // Test Products API
  console.log('\n📦 Testing Products API...');
  try {
    const productsResult = await productsAPI.getAll();
    testResults.push({ endpoint: 'GET /products', status: '✅ SUCCESS', data: `${Array.isArray(productsResult) ? productsResult.length : 'N/A'} products` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /products', status: '❌ FAILED', error: error.message });
  }
  
  // Test Categories API
  console.log('\n🏷️ Testing Categories API...');
  try {
    const categoriesResult = await categoriesAPI.getAll();
    testResults.push({ endpoint: 'GET /categories', status: '✅ SUCCESS', data: `${Array.isArray(categoriesResult) ? categoriesResult.length : 'N/A'} categories` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /categories', status: '❌ FAILED', error: error.message });
  }
  
  // Test Brands API
  console.log('\n🏪 Testing Brands API...');
  try {
    const brandsResult = await brandsAPI.getAll();
    testResults.push({ endpoint: 'GET /brands', status: '✅ SUCCESS', data: `${Array.isArray(brandsResult) ? brandsResult.length : 'N/A'} brands` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /brands', status: '❌ FAILED', error: error.message });
  }
  
  // Test Customers API
  console.log('\n👥 Testing Customers API...');
  try {
    const customersResult = await customersAPI.getAll();
    testResults.push({ endpoint: 'GET /customers', status: '✅ SUCCESS', data: `${Array.isArray(customersResult) ? customersResult.length : 'N/A'} customers` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /customers', status: '❌ FAILED', error: error.message });
  }
  
  // Test Suppliers API
  console.log('\n🚛 Testing Suppliers API...');
  try {
    const suppliersResult = await suppliersAPI.getAll();
    testResults.push({ endpoint: 'GET /suppliers', status: '✅ SUCCESS', data: `${Array.isArray(suppliersResult) ? suppliersResult.length : 'N/A'} suppliers` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /suppliers', status: '❌ FAILED', error: error.message });
  }
  
  // Test Users API
  console.log('\n👤 Testing Users API...');
  try {
    const usersResult = await usersAPI.getAll();
    testResults.push({ endpoint: 'GET /users', status: '✅ SUCCESS', data: `${Array.isArray(usersResult) ? usersResult.length : 'N/A'} users` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /users', status: '❌ FAILED', error: error.message });
  }
  
  // Test Branches API
  console.log('\n🏢 Testing Branches API...');
  try {
    const branchesResult = await branchesAPI.getAll();
    testResults.push({ endpoint: 'GET /branches', status: '✅ SUCCESS', data: `${Array.isArray(branchesResult) ? branchesResult.length : 'N/A'} branches` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /branches', status: '❌ FAILED', error: error.message });
  }
  
  // Test Transactions API
  console.log('\n💳 Testing Transactions API...');
  try {
    const transactionsResult = await transactionsAPI.getAll();
    testResults.push({ endpoint: 'GET /transactions', status: '✅ SUCCESS', data: `${Array.isArray(transactionsResult) ? transactionsResult.length : 'N/A'} transactions` });
  } catch (error) {
    testResults.push({ endpoint: 'GET /transactions', status: '❌ FAILED', error: error.message });
  }
  
  // Display results
  console.log('\n📋 API Test Results Summary:');
  console.log('=' .repeat(80));
  testResults.forEach(result => {
    console.log(`${result.status} ${result.endpoint}`);
    if (result.data) {
      console.log(`    Data: ${result.data}`);
    }
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  const successCount = testResults.filter(r => r.status.includes('SUCCESS')).length;
  const totalCount = testResults.length;
  
  console.log('=' .repeat(80));
  console.log(`✅ Successful: ${successCount}/${totalCount} endpoints`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount} endpoints`);
  
  if (successCount === totalCount) {
    console.log('🎉 All API endpoints are working correctly!');
  } else {
    console.log('⚠️  Some API endpoints need attention.');
  }
}

// Run the test
testAllAPIs().catch(console.error);