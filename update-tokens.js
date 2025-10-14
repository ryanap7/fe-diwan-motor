const fs = require('fs');
const path = require('path');

const NEW_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDIwMDgsImV4cCI6MTc2MTA0NjgwOH0.XRp-8-vVfmkuKvI8H52mMxeqYCl8uFo--NtKDpG7A3I';

const OLD_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDA2MTEsImV4cCI6MTc2MTA0NTQxMX0.wC6ne1OZqTzzc4qXZqjQH-XejdxTBAfXt7BibF_Bhic';

const componentsDir = './components/features';
const files = [
  'ProductManagement.jsx',
  'CustomerManagement.jsx', 
  'SupplierManagement.jsx',
  'CategoryManagement.jsx',
  'BrandManagement.jsx',
  'UserManagement.jsx',
  'BranchManagement.jsx',
  'POSKasir.jsx'
];

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(OLD_TOKEN)) {
      content = content.replace(OLD_TOKEN, NEW_TOKEN);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated token in ${file}`);
    } else {
      console.log(`ℹ️  No old token found in ${file}`);
    }
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log('🎯 Token update completed!');