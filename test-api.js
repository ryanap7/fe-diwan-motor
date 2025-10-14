// Test API endpoints untuk categories dan brands dengan authentication
const testAPI = async () => {
  const API_BASE_URL = 'https://api.diwanmotor.com/api';
  
  // Use provided token
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlZjdmM2I4Yi1lM2I3LTRhMDctYTdkOS00NDA1YjcxNmYyNWMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDM5MTU5NSwiZXhwIjoxNzYwOTk2Mzk1fQ.pYe5zSHp8Krs-oBIuNJbGm4j_4lVWIf6P7B_xxMyAy8';
  
  console.log('✅ Using provided token for testing...');
  
  // Step 2: Test categories endpoint with token
  try {
    console.log('\nStep 2: Testing categories endpoint...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'NextJS-Frontend/1.0'
      }
    });
    const categoriesData = await categoriesResponse.json();
    console.log('Categories response:', JSON.stringify(categoriesData, null, 2));
    
    if (categoriesData.success && categoriesData.data && categoriesData.data.categories) {
      console.log('\n📋 Categories found:', categoriesData.data.categories.length);
      categoriesData.data.categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ID: ${cat.id}, Name: ${cat.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Categories API error:', error);
  }

  // Step 3: Test brands endpoint with token
  try {
    console.log('\nStep 3: Testing brands endpoint...');
    const brandsResponse = await fetch(`${API_BASE_URL}/brands`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'NextJS-Frontend/1.0'
      }
    });
    const brandsData = await brandsResponse.json();
    console.log('Brands response:', JSON.stringify(brandsData, null, 2));
    
    if (brandsData.success && brandsData.data && brandsData.data.brands) {
      console.log('\n🏷️ Brands found:', brandsData.data.brands.length);
      brandsData.data.brands.forEach((brand, index) => {
        console.log(`  ${index + 1}. ID: ${brand.id}, Name: ${brand.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Brands API error:', error);
  }
};

// Run the test
testAPI();