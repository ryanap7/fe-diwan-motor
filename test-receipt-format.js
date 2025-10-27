// Test receipt formatting for both payment methods
const { generateReceiptText } = require('./lib/receipt-rawbt-formatter');

// Test data for CASH payment
const cashReceiptData = {
  date: '2024-01-15',
  time: '14:30:25',
  cashierName: 'Admin User',
  items: [
    {
      name: 'Motor Oil SAE 10W-40',
      quantity: 2,
      unitPrice: 45000,
      subtotal: 90000
    },
    {
      name: 'Spark Plug NGK',
      quantity: 1,
      unitPrice: 25000,
      subtotal: 25000
    }
  ],
  subtotal: 115000,
  discount: 0,
  tax: 0,
  total: 115000,
  amountPaid: 120000,
  change: 5000,
  paymentMethod: 'TUNAI'
};

// Test data for TRANSFER payment
const transferReceiptData = {
  date: '2024-01-15',
  time: '14:35:10',
  cashierName: 'Admin User',
  items: [
    {
      name: 'Brake Pad Set',
      quantity: 1,
      unitPrice: 85000,
      subtotal: 85000
    }
  ],
  subtotal: 85000,
  discount: 0,
  tax: 0,
  total: 85000,
  amountPaid: 85000,
  change: 0,
  paymentMethod: 'TRANSFER'
};

console.log('=== TESTING CASH PAYMENT RECEIPT ===');
const cashReceipt = generateReceiptText(cashReceiptData);
console.log(cashReceipt);

console.log('\n=== CHECKING FOR UNWANTED PREFIXES ===');
const lines = cashReceipt.split('\n');
let hasIssues = false;

lines.forEach((line, index) => {
  if (line.startsWith('//') || line.includes('//print?text=')) {
    console.log(`❌ Line ${index + 1}: "${line}" contains unwanted prefix`);
    hasIssues = true;
  }
});

if (!hasIssues) {
  console.log('✅ No unwanted "//" prefixes found in CASH receipt');
}

console.log('\n=== TESTING TRANSFER PAYMENT RECEIPT ===');
const transferReceipt = generateReceiptText(transferReceiptData);
console.log(transferReceipt);

console.log('\n=== CHECKING TRANSFER RECEIPT ===');
const transferLines = transferReceipt.split('\n');
let transferIssues = false;

transferLines.forEach((line, index) => {
  if (line.startsWith('//') || line.includes('//print?text=')) {
    console.log(`❌ Line ${index + 1}: "${line}" contains unwanted prefix`);
    transferIssues = true;
  }
});

if (!transferIssues) {
  console.log('✅ No unwanted "//" prefixes found in TRANSFER receipt');
}

// Check if payment method is displayed correctly
if (transferReceipt.includes('Metode       : TRANSFER')) {
  console.log('✅ TRANSFER payment method is displayed correctly');
} else {
  console.log('❌ TRANSFER payment method not found in receipt');
}

// Check if change amount is not shown for TRANSFER
if (!transferReceipt.includes('Kembali      :')) {
  console.log('✅ Change amount correctly hidden for TRANSFER payment');
} else {
  console.log('❌ Change amount should not be shown for TRANSFER payment');
}