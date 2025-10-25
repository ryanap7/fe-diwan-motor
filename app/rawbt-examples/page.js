'use client'

import { useRawBTPrint, printStrukToRawBT } from '@/hooks/useRawBTPrint'

// === CARA 1: Menggunakan Hook (Otomatis attach ke tombol) ===
const ContohDenganHook = () => {
  // Hook akan otomatis mencarikan element dengan id 'struk' dan 'btnPrint'
  const { printToRawBT, isAvailable } = useRawBTPrint('struk', 'btnPrint', {
    onSuccess: (text) => console.log('Berhasil print:', text.length, 'karakter'),
    onError: (error) => console.error('Print gagal:', error),
    showAlert: true,
    autoInstallPrompt: true
  })

  return (
    <div className="p-4">
      <h2>Contoh dengan Hook</h2>
      
      {/* Konten Struk */}
      <div id="struk" className="bg-white p-4 border font-mono text-sm">
        <div className="text-center">
          <strong>HD MOTOPART</strong><br/>
          Jl Maulana Hasanudin RT 02 RW 02<br/>
          {new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}<br/>
        </div>
        <hr/>
        <div>Oli Mesin Shell    2x  Rp 45.000</div>
        <div>Filter Udara      1x  Rp 25.000</div>
        <hr/>
        <div><strong>TOTAL: Rp 115.000</strong></div>
        <div className="text-center">Terima kasih!</div>
      </div>

      {/* Tombol Print - Hook otomatis mendeteksi id ini */}
      <button id="btnPrint" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
        Print ke RawBT
      </button>
      
      {/* Tombol manual jika perlu */}
      <button 
        onClick={() => printToRawBT()} 
        className="mt-2 ml-2 bg-green-500 text-white px-4 py-2 rounded"
      >
        Print Manual
      </button>

      <p className="text-xs mt-2">
        Status: {isAvailable ? 'Tersedia' : 'Tidak tersedia (SSR)'}
      </p>
    </div>
  )
}

// === CARA 2: Menggunakan Fungsi Standalone ===
const ContohDenganFungsi = () => {
  const handlePrint = () => {
    // Panggil fungsi langsung
    printStrukToRawBT('myStruk', {
      showAlert: true,
      autoInstallPrompt: true,
      fallbackDelay: 3000
    })
  }

  return (
    <div className="p-4">
      <h2>Contoh dengan Fungsi Standalone</h2>
      
      {/* Konten Struk dengan ID berbeda */}
      <div id="myStruk" className="bg-gray-100 p-4 border font-mono text-sm">
        <div className="text-center">
          <strong>HD MOTOPART</strong><br/>
          Jl Maulana Hasanudin RT 02 RW 02<br/>
          {new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}<br/>
        </div>
        <hr/>
        <div>Busi NGK           4x  Rp 15.000</div>
        <div>Kampas Rem        2x  Rp 35.000</div>
        <hr/>
        <div><strong>TOTAL: Rp 130.000</strong></div>
        <div className="text-center">Terima kasih!</div>
      </div>

      {/* Tombol dengan event onClick custom */}
      <button 
        onClick={handlePrint}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Print ke RawBT (Custom)
      </button>
    </div>
  )
}

// === CARA 3: Integrasi dengan Komponen yang Ada ===
const IntegrasikanKeKomponenLama = () => {
  // Jika sudah ada komponen dengan struk, tinggal tambahkan hook
  useRawBTPrint() // Akan mencari #struk dan #btnPrint secara default

  return (
    <div>
      {/* Komponen struk yang sudah ada */}
      <ExistingStrukComponent />
      
      {/* Tombol yang sudah ada dengan id="btnPrint" */}
      <ExistingPrintButton />
    </div>
  )
}

// Komponen dummy untuk contoh
const ExistingStrukComponent = () => (
  <div id="struk" className="existing-struk-class">
    {/* Konten struk yang sudah ada */}
    <p>Konten struk yang sudah ada...</p>
  </div>
)

const ExistingPrintButton = () => (
  <button id="btnPrint" className="existing-print-btn">
    Print Struk
  </button>
)

// === CARA 4: JavaScript Vanilla (tanpa React) ===
// Bisa digunakan di file .js biasa atau di script tag

/*
// Tambahkan di file .js atau <script>
import { printStrukToRawBT } from '@/hooks/useRawBTPrint'

// Attach manual ke event
document.addEventListener('DOMContentLoaded', () => {
  const printBtn = document.getElementById('btnPrint')
  
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      printStrukToRawBT('struk')
    })
  }
})

// Atau panggil langsung
function handlePrintClick() {
  printStrukToRawBT('struk', {
    showAlert: true,
    autoInstallPrompt: true
  })
}
*/

export default function RawBTPrintExamples() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Contoh Penggunaan RawBT Print</h1>
      
      <ContohDenganHook />
      <ContohDenganFungsi />
      
      <div className="mt-8 p-4 bg-blue-100 rounded">
        <h3 className="font-bold mb-2">Cara Integrasi ke Komponen yang Sudah Ada:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Pastikan ada element dengan id="struk" yang berisi konten struk</li>
          <li>Pastikan ada tombol dengan id="btnPrint"</li>
          <li>Import dan panggil: <code>useRawBTPrint()</code></li>
          <li>Atau panggil manual: <code>printStrukToRawBT('struk')</code></li>
        </ol>
      </div>
    </div>
  )
}