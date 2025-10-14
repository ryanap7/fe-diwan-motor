const fs = require('fs');
const path = require('path');

const NEW_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDY3MTksImV4cCI6MTc2MTA1MTUxOX0.bkc5J4eRmToxZs9HyPDs7fAa0_6GnoLE1kKIBaTzkLM';

// File paths to update
const filesToUpdate = [
  './components/features/ProductManagement.jsx',
  './components/features/CustomerManagement.jsx',
  './components/features/SupplierManagement.jsx',
  './components/features/BranchManagement.jsx',
  './components/features/CategoryManagement.jsx',
  './components/features/BrandManagement.jsx',
  './components/features/UserManagement.jsx',
  './components/features/InventoryManagement.jsx',
  './components/features/POSTransactions.jsx',
  './components/features/PurchaseOrderManagement.jsx'
];

console.log('🔄 Updating JWT tokens in components...\n');

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find and replace JWT token pattern
    const tokenPattern = /setDevToken\(['"`]eyJ[^'"`]+['"`]\)/g;
    const newTokenCall = `setDevToken('${NEW_TOKEN}')`;
    
    if (tokenPattern.test(content)) {
      content = content.replace(tokenPattern, newTokenCall);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⚠️  No token found in: ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('\n🎉 Token update completed!');
console.log('\n🔗 New Token (expires Jan 2025):');
console.log(`${NEW_TOKEN.substring(0, 50)}...`);