// Test script untuk mengecek API endpoint
// Jalankan di browser console untuk test

async function testBrandsAPI() {
  const baseURL = 'https://api.diwanmotor.com/api';
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  
  console.log('Testing brands API...');
  console.log('Base URL:', baseURL);
  console.log('Token:', token ? 'Found' : 'Not found');
  
  try {
    const response = await fetch(`${baseURL}/brands`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    // Check if data contains branches instead of brands
    if (data?.data?.branches) {
      console.error('❌ ERROR: API returned branches data instead of brands!');
      console.error('This indicates server-side routing issue');
    } else if (data?.data?.brands) {
      console.log('✅ SUCCESS: API returned brands data correctly');
    } else {
      console.warn('⚠️ UNEXPECTED: API returned unexpected data structure');
    }
    
    return data;
  } catch (error) {
    console.error('❌ API call failed:', error);
    return null;
  }
}

// Also test branches endpoint for comparison
async function testBranchesAPI() {
  const baseURL = 'https://api.diwanmotor.com/api';
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  
  console.log('Testing branches API...');
  
  try {
    const response = await fetch(`${baseURL}/branches`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    });
    
    const data = await response.json();
    console.log('Branches API response:', data);
    return data;
  } catch (error) {
    console.error('❌ Branches API call failed:', error);
    return null;
  }
}

// Run both tests
console.log('='.repeat(50));
console.log('API ENDPOINT TESTING');
console.log('='.repeat(50));

testBrandsAPI().then(() => {
  console.log('\n' + '-'.repeat(30) + '\n');
  return testBranchesAPI();
});