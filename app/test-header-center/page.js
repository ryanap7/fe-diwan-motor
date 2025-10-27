'use client';

import React, { useState } from 'react';

export default function TestHeaderCenter() {
  const [testResult, setTestResult] = useState('');

  const testCenterAlignment = () => {
    // Test berbagai format centering untuk HD MOTOPART
    const testFormats = [
      '        HD MOTOPART        ',  // Original (8 spasi kiri, 8 spasi kanan)
      '          HD MOTOPART          ',  // New format (10 spasi kiri, 10 spasi kanan)
      '      HD MOTOPART      ',  // Compact (6 spasi kiri, 6 spasi kanan)
      '           HD MOTOPART           ',  // Extra wide (11 spasi kiri, 11 spasi kanan)
    ];

    const separator = '================================'; // 32 karakter
    
    let result = 'TESTING HD MOTOPART CENTER ALIGNMENT\n\n';
    result += `Reference line (32 chars):\n${separator}\n\n`;
    
    testFormats.forEach((format, index) => {
      result += `Format ${index + 1} (${format.length} chars total):\n`;
      result += `${format}\n`;
      result += `${separator}\n`;
      
      // Hitung apakah benar-benar center
      const textOnly = 'HD MOTOPART'; // 11 karakter
      const totalSpaces = format.length - textOnly.length;
      const leftSpaces = format.indexOf('HD MOTOPART');
      const rightSpaces = totalSpaces - leftSpaces;
      
      result += `Left spaces: ${leftSpaces}, Right spaces: ${rightSpaces}\n`;
      result += `Balanced: ${leftSpaces === rightSpaces ? '✅ YES' : '❌ NO'}\n\n`;
    });

    // Test dengan format lengkap
    result += 'FULL RECEIPT FORMAT TEST:\n\n';
    const fullFormat = `          HD MOTOPART          
  Jl Maulana hasanudin RT 02 RW  
               02                
================================
Tanggal      : 27/10/2025
Waktu        : 09.40.46
Kasir        : cashier_hd
================================

Agustinus tes
1x Rp 3                    Rp 3

................................
Subtotal     : Rp 3
................................
TOTAL        : Rp 3
Metode       : TUNAI
Bayar        : Rp 3
================================

         Terima Kasih!         
     Selamat Berbelanja Kembali     

27/10/2025, 09.40.49`;

    result += fullFormat;

    setTestResult(result);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test HD MOTOPART Center Alignment</h1>
      
      <button 
        onClick={testCenterAlignment}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Test Center Alignment
      </button>

      {testResult && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Alignment Test Results:</h2>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 border rounded">
            {testResult}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Info:</h3>
        <p className="text-sm text-blue-700">
          Thermal printer biasanya menggunakan lebar 32 karakter.<br/>
          "HD MOTOPART" = 11 karakter<br/>
          Untuk center perfect: (32-11)/2 = 10.5, jadi gunakan 10 spasi kiri dan 10 spasi kanan<br/>
          Format: "          HD MOTOPART          " (total 32 karakter)
        </p>
      </div>
    </div>
  );
}