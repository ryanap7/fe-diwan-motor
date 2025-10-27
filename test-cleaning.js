// Test untuk memastikan HD MOTOPART tidak ada // prefix
const testReceiptCleaning = () => {
  // Simulasi text yang mungkin bermasalah
  const problematicTexts = [
    '//HD MOTOPART',
    '//print?text=        HD MOTOPART        ',
    '        //HD MOTOPART        ',
    '//print?text=HD MOTOPART\nJl Maulana',
    '        HD MOTOPART        \n//some other line'
  ];

  const cleaningFunction = (text) => {
    return text
      .replace(/^\/\/[^\n]*\n?/gm, '') // Remove lines starting with //
      .replace(/\/\/print\?text=/g, '') // Remove //print?text= completely
      .replace(/^\/+/gm, '') // Remove leading slashes from lines
      .replace(/\/\/HD MOTOPART/g, 'HD MOTOPART') // Specifically fix //HD MOTOPART
      .replace(/\/\/.*(?=HD MOTOPART)/g, '') // Remove // before HD MOTOPART
      .trim();
  };

  console.log('=== TESTING RECEIPT CLEANING ===');
  
  problematicTexts.forEach((text, index) => {
    const cleaned = cleaningFunction(text);
    console.log(`Test ${index + 1}:`);
    console.log(`  Input:  "${text}"`);
    console.log(`  Output: "${cleaned}"`);
    console.log(`  Valid:  ${cleaned.includes('HD MOTOPART') && !cleaned.includes('//') ? '✅' : '❌'}`);
    console.log('');
  });

  // Test full receipt
  const fullReceipt = `//print?text=        HD MOTOPART        
  Jl Maulana hasanudin RT 02 RW  
               02                
================================
Tanggal      : 27/10/2025
Waktu        : 09.18.04
Kasir        : cashier_hd
================================
Agustinus tes
1x Rp 3                    Rp 3
................................
Subtotal     : Rp 3
--------------------------------
TOTAL        : Rp 3
Metode       : TRANSFER
Bayar        : Rp 3
================================
         Terima Kasih!         
     Selamat Berbelanja Kembali     
27/10/2025, 09.18.06`;

  const cleanedReceipt = cleaningFunction(fullReceipt);
  console.log('=== FULL RECEIPT TEST ===');
  console.log('Cleaned receipt:');
  console.log(cleanedReceipt);
  console.log('');
  console.log('Issues check:');
  console.log(`- Contains //: ${cleanedReceipt.includes('//') ? '❌' : '✅'}`);
  console.log(`- HD MOTOPART centered: ${cleanedReceipt.includes('        HD MOTOPART        ') ? '✅' : '❌'}`);
  console.log(`- No //print?text=: ${!cleanedReceipt.includes('//print?text=') ? '✅' : '❌'}`);
};

// Run test
testReceiptCleaning();