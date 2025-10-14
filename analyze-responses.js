const axios = require('axios');

const NEW_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDIwMDgsImV4cCI6MTc2MTA0NjgwOH0.XRp-8-vVfmkuKvI8H52mMxeqYCl8uFo--NtKDpG7A3I';
const API_BASE_URL = 'https://api.diwanmotor.com/api';

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

async function getDetailedResponse(endpoint, name) {
  try {
    console.log(`\n📋 ${name} Response Structure:`);
    console.log('='.repeat(50));
    
    const response = await api.get(endpoint);
    const data = response.data;
    
    console.log(`Status: ${response.status}`);
    console.log(`Response Type: ${typeof data}`);
    console.log(`Response Structure: ${JSON.stringify(data, null, 2)}`);
    
    return data;
  } catch (error) {
    console.log(`❌ Error for ${name}: ${error.message}`);
    if (error.response) {
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function analyzeResponses() {
  console.log('🔍 DETAILED API RESPONSE ANALYSIS');
  console.log('='.repeat(60));
  
  const endpoints = [
    { url: '/auth/profile', name: 'Auth Profile' },
    { url: '/products', name: 'Products' },
    { url: '/categories', name: 'Categories' },
    { url: '/brands', name: 'Brands' },
    { url: '/customers', name: 'Customers' },
    { url: '/suppliers', name: 'Suppliers' },
    { url: '/users', name: 'Users' },
    { url: '/branches', name: 'Branches' },
    { url: '/transactions', name: 'Transactions' }
  ];
  
  for (const endpoint of endpoints) {
    await getDetailedResponse(endpoint.url, endpoint.name);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

analyzeResponses().catch(console.error);