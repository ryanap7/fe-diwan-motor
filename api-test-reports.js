// Quick API test script for reports page
// This file helps debug API connectivity and response format

const testReportsAPI = async () => {
  console.log('🧪 Testing Reports API endpoints...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No token found');
    return;
  }

  const headers = { 
    Authorization: `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  };

  const endpoints = [
    'https://api.diwanmotor.com/transactions',
    'https://api.diwanmotor.com/products',
    'https://api.diwanmotor.com/branches',
    'https://api.diwanmotor.com/categories',
    'https://api.diwanmotor.com/reports/sales/summary',
    'https://api.diwanmotor.com/reports/sales/top-products',
    'https://api.diwanmotor.com/reports/inventory/summary'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Testing: ${endpoint}`);
      const response = await fetch(endpoint, { headers });
      const data = await response.json();
      
      console.log(`✅ ${endpoint}:`, {
        status: response.status,
        success: data.success,
        dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
        dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
        sample: data.data
      });
    } catch (error) {
      console.error(`❌ ${endpoint}:`, error.message);
    }
  }
};

// Run the test
// testReportsAPI();

console.log('📋 API Test script loaded. Run testReportsAPI() in console to test endpoints.');