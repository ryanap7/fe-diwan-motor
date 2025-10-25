# RawBT Print Integration - Dokumentasi Lengkap

## Overview
Integrasi untuk mencetak struk dari halaman web ke aplikasi RawBT di Android menggunakan URL scheme `rawbt://print?text=`.

## File yang Dibuat

### 1. `hooks/useRawBTPrint.js` - Hook dan Fungsi Utama
Berisi:
- `useRawBTPrint()` - React hook untuk auto-attach ke tombol
- `printStrukToRawBT()` - Fungsi standalone untuk manual call

### 2. `components/RawBTPrint.jsx` - Komponen React
Komponen yang otomatis mendeteksi element struk dan tombol print.

### 3. `lib/rawbt-print-simple.js` - JavaScript Vanilla
Fungsi JavaScript murni tanpa dependency React.

## Cara Penggunaan

### Metode 1: Menggunakan Hook (Recommended)
```jsx
'use client'
import { useRawBTPrint } from '@/hooks/useRawBTPrint'

const MyComponent = () => {
  // Otomatis attach ke #struk dan #btnPrint
  useRawBTPrint()

  return (
    <div>
      {/* Element dengan konten struk */}
      <div id="struk">
        HD MOTOPART<br/>
        Jl Maulana hasanudin RT 02 RW 02<br/>
        ---<br/>
        Oli Mesin Shell  2x  Rp 45.000<br/>
        TOTAL: Rp 90.000
      </div>
      
      {/* Tombol print */}
      <button id="btnPrint">Print ke RawBT</button>
    </div>
  )
}
```

### Metode 2: Fungsi Manual
```jsx
'use client'
import { printStrukToRawBT } from '@/hooks/useRawBTPrint'

const MyComponent = () => {
  const handlePrint = () => {
    printStrukToRawBT('myStruk')
  }

  return (
    <div>
      <div id="myStruk">Konten struk...</div>
      <button onClick={handlePrint}>Print</button>
    </div>
  )
}
```

### Metode 3: Komponen Auto-Detect
```jsx
'use client'
import RawBTPrint from '@/components/RawBTPrint'

const MyComponent = () => {
  return (
    <div>
      <RawBTPrint /> {/* Otomatis detect #struk dan #btnPrint */}
      
      <div id="struk">Konten struk...</div>
      <button id="btnPrint">Print</button>
    </div>
  )
}
```

### Metode 4: JavaScript Vanilla
```html
<!-- HTML -->
<div id="struk">
  HD MOTOPART<br/>
  Jl Maulana hasanudin RT 02 RW 02<br/>
  ---<br/>
  Oli Mesin  2x  Rp 45.000<br/>
  TOTAL: Rp 90.000
</div>
<button id="btnPrint">Print ke RawBT</button>

<script type="module">
import { printStrukToRawBT } from '/lib/rawbt-print-simple.js'

// Auto-attach (sudah otomatis di file)
// Atau manual:
document.getElementById('btnPrint').addEventListener('click', () => {
  printStrukToRawBT('struk')
})
</script>
```

## Persyaratan

### 1. Element HTML
- **Struk Container**: Element dengan ID yang berisi konten struk (default: `struk`)
- **Print Button**: Tombol dengan ID untuk trigger print (default: `btnPrint`)

### 2. Format Konten Struk
Element struk harus berisi teks yang siap untuk diprint. Contoh format yang baik:
```html
<div id="struk">
HD MOTOPART
Jl Maulana hasanudin RT 02 RW 02

Tanggal: 26/10/2025 14:30
Kasir: Admin
========================================
Oli Mesin Shell      2x    Rp  45.000
Filter Udara         1x    Rp  25.000
Busi NGK             4x    Rp  15.000
========================================
Subtotal:                   Rp 130.000
Diskon:                     Rp      0
TOTAL:                      Rp 130.000
Bayar:                      Rp 150.000
Kembali:                    Rp  20.000
========================================
Terima kasih atas kunjungan Anda!
</div>
```

### 3. Platform Requirements
- **Android**: Aplikasi RawBT harus terinstall
- **Desktop/iOS**: Akan muncul prompt untuk install (fallback)

## Opsi Konfigurasi

### Hook Options
```jsx
useRawBTPrint('strukId', 'printBtnId', {
  onSuccess: (text) => console.log('Print success'),
  onError: (error) => console.error('Print error'),
  showAlert: true,          // Tampilkan alert error
  autoInstallPrompt: true,  // Prompt install RawBT jika gagal
  fallbackDelay: 2000       // Delay sebelum prompt install (ms)
})
```

### Function Options
```jsx
printStrukToRawBT('strukId', {
  showAlert: true,
  autoInstallPrompt: true,
  fallbackDelay: 2000
})
```

## Troubleshooting

### 1. Element Tidak Ditemukan
```
Error: Element dengan id "struk" tidak ditemukan
```
**Solusi**: Pastikan element dengan ID yang benar ada di DOM

### 2. Konten Struk Kosong
```
Error: Konten struk kosong
```
**Solusi**: Pastikan element struk berisi text/content

### 3. RawBT Tidak Terbuka
**Gejala**: URL scheme tidak membuka aplikasi
**Solusi**: 
- Install aplikasi RawBT dari Play Store
- Pastikan device Android mendukung URL schemes
- Check permission aplikasi

### 4. SSR Error
**Gejala**: Error saat build/render di server
**Solusi**: 
- Gunakan `'use client'` di component
- Fungsi otomatis handle SSR dengan check `typeof window !== 'undefined'`

## Contoh Implementasi di Komponen yang Ada

### POSKasir Integration
```jsx
// Di POSKasir.jsx
import { useRawBTPrint } from '@/hooks/useRawBTPrint'

const POSKasir = () => {
  // Jika sudah ada sistem print, tambahkan RawBT option
  const { printToRawBT } = useRawBTPrint()
  
  const handlePrintOptions = () => {
    const choice = confirm('Pilih metode print:\nOK = RawBT (Mobile)\nCancel = Bluetooth (Desktop)')
    
    if (choice) {
      printToRawBT() // Print ke RawBT
    } else {
      // Existing print method
      printViaBluetooth()
    }
  }
  
  return (
    // ... existing JSX
  )
}
```

## Testing

### 1. Test di Desktop
- Buka halaman dengan struk
- Klik tombol print
- Harus muncul prompt install RawBT

### 2. Test di Android
- Install RawBT dari Play Store
- Buka halaman dengan struk
- Klik tombol print
- RawBT app harus terbuka dengan data struk

### 3. Test Konten
- Pastikan format struk rapi di RawBT
- Test dengan berbagai panjang text
- Test dengan karakter khusus (Rp, -, =, dll)

## URL Scheme Details

### Format URL
```
rawbt://print?text=<encodedText>
```

### Encoding
- Menggunakan `encodeURIComponent()` untuk encode text
- Semua karakter khusus akan di-encode otomatis
- RawBT akan decode dan print sesuai format

### Contoh URL Generated
```
rawbt://print?text=HD%20MOTOPART%0AJl%20Maulana%20hasanudin%20RT%2002%20RW%2002%0A---%0AOli%20Mesin%20Shell%20%202x%20%20Rp%2045.000%0ATOTAL%3A%20Rp%2090.000
```

## Best Practices

1. **Gunakan font monospace** untuk format yang rapi
2. **Test di berbagai device** Android untuk kompatibilitas
3. **Sediakan fallback** untuk non-Android users
4. **Validate konten struk** sebelum print
5. **Handle error gracefully** dengan user-friendly messages
6. **Test dengan content panjang** untuk memastikan tidak ada truncation

## Integrasi dengan Existing System

Jika sudah ada sistem print, integrasikan sebagai option tambahan:

```jsx
const existingPrintFunction = async () => {
  // Show options
  const printMethod = await showPrintOptions()
  
  if (printMethod === 'rawbt') {
    printStrukToRawBT('struk')
  } else if (printMethod === 'bluetooth') {
    // Existing bluetooth print
  } else if (printMethod === 'web') {
    // Web print API
  }
}
```

## Dependencies

### Required
- React 18+ (untuk hooks)
- Next.js 14+ (untuk 'use client')

### Optional
- Tailwind CSS (untuk styling examples)
- Lucide React (untuk icons di examples)

## License & Support

Fungsi ini free untuk digunakan. Untuk support RawBT app:
- Play Store: https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter
- Developer: ru.a402d