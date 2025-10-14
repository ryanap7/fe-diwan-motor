// Test create product API dengan payload dari contohrequest.txt
const testCreateProduct = async () => {
  const API_BASE_URL = 'https://api.diwanmotor.com/api';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlZjdmM2I4Yi1lM2I3LTRhMDctYTdkOS00NDA1YjcxNmYyNWMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDM5MTU5NSwiZXhwIjoxNzYwOTk2Mzk1fQ.pYe5zSHp8Krs-oBIuNJbGm4j_4lVWIf6P7B_xxMyAy8';

  // Payload sederhana untuk test (tanpa base64 image yang panjang)
  const productData = {
    "sku": "TEST123",
    "barcode": "123456789", 
    "name": "Test Product",
    "description": "Test product description",
    "categoryId": "34ef9a57-562b-4cda-a6bd-691aea02b0d0",
    "brandId": "34d9d62d-9c43-4f5d-b81d-bbfd1f2b0e65",
    "unit": "PCS",
    "compatibleModels": "Test Model",
    "purchasePrice": 10000,
    "sellingPrice": 20000,
    "wholesalePrice": 15000,
    "minStock": 5,
    "weight": 1.0,
    "dimensions": {
      "length": 10,
      "width": 5, 
      "height": 3
    },
    "specifications": {"material": "plastic"},
    "storageLocation": "A1-B2",
    "tags": "test,sample",
    "images": [],
    "isActive": true,
    "isFeatured": false
  };

  try {
    console.log('🧪 Testing CREATE PRODUCT API...');
    console.log('Payload:', JSON.stringify(productData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'NextJS-Frontend/1.0'
      },
      body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('❌ API Error:', result);
      console.error('Error details:', result.message || result.error);
    } else {
      console.log('✅ Product created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Request error:', error);
  }
};

// Run the test
testCreateProduct();