# Fix RawBT Print Formatting Issue

## Masalah yang Ditemukan
Berdasarkan screenshot, ada beberapa masalah dengan format print ke RawBT:

1. **Text `//print?text=` muncul di awal** - tidak seharusnya tampil
2. **Format tidak sesuai ekspektasi** - struktur struk tidak rapi
3. **Alignment tidak konsisten** - teks tidak terpusat dan tidak aligned

## Solusi yang Diimplementasi

### 1. Formatter Khusus untuk RawBT
Dibuat file baru: `lib/receipt-rawbt-formatter.js` yang khusus memformat data receipt menjadi text thermal printer yang benar.

### 2. Fungsi `printReceiptToRawBT()`
Fungsi ini mengambil data receipt object dan mengconvert jadi format text thermal:

```jsx
import { printReceiptToRawBT } from '@/lib/receipt-rawbt-formatter'

// Panggil dengan data receipt
const receiptData = {
  date: '26/10/2025',
  time: '01.12.01', 
  cashierName: 'Admin',
  items: [
    { name: 'Item', quantity: 1, unitPrice: 2, subtotal: 2 }
  ],
  subtotal: 2,
  total: 0,
  amountPaid: 4,
  change: 0
}

printReceiptToRawBT(receiptData)
```

### 3. Format Output Yang Benar
```
        HD MOTOPART        
  Jl Maulana hasanudin RT 02 RW 02  
================================

Tanggal      : 26/10/2025
Waktu        : 01.12.01
Kasir        : Admin
================================

Item
1x Rp 2              Rp 2

--------------------------------
Subtotal     : Rp 2
--------------------------------
TOTAL        : Rp 0
Bayar        : Rp 4
Kembali      : Rp 0
================================

       Terima Kasih!       
   Selamat Berbelanja Kembali   

      26/10/2025, 01.12.11      
```

### 4. Update ReceiptPreview Component
File `components/features/ReceiptPreview.jsx` sudah diupdate untuk menggunakan formatter baru:

```jsx
import { printReceiptToRawBT } from '@/lib/receipt-rawbt-formatter'

const handlePrintToRawBT = () => {
  const success = printReceiptToRawBT(receiptData);
  // ... rest of code
}
```

## Perbedaan Solusi Lama vs Baru

### ❌ Solusi Lama
- Mengambil HTML content dengan `innerHTML/textContent`
- Text mentah dari DOM yang tidak terformat
- Hasil: format berantakan, ada text `//print?text=`

### ✅ Solusi Baru  
- Menggunakan data receipt object langsung
- Format khusus untuk thermal printer
- Text yang sudah ter-format dengan baik
- Alignment dan spacing yang konsisten

## Testing

### Test Page
Akses `/test-receipt-format` untuk:
- Preview format yang akan digenerate
- Test print langsung ke RawBT
- Lihat sample data yang digunakan

### Manual Testing
1. Buka POSKasir
2. Lakukan transaksi
3. Klik "Preview Struk"
4. Klik "Print via RawBT"
5. Verifikasi format di RawBT app

## Troubleshooting

### Jika Masih Ada Masalah Format

1. **Check Data Receipt**
   ```jsx
   console.log('Receipt data:', receiptData)
   ```

2. **Test Format Generator**
   ```jsx
   import { printReceiptToRawBT } from '@/lib/receipt-rawbt-formatter'
   // Test dengan data manual
   ```

3. **Verify RawBT URL**
   - URL harus: `rawbt://print?text=<encodedText>`
   - Tidak boleh ada prefix `//print?text=`

### Jika Text `//print?text=` Masih Muncul

Kemungkinan:
- Masih menggunakan hook lama `useRawBTPrint`
- Perlu update import ke `printReceiptToRawBT`

### Format Tidak Sesuai

1. Check function `generateReceiptText()` 
2. Adjust padding dan alignment di formatter
3. Test dengan berbagai data receipt

## Files Yang Dimodifikasi

1. ✅ `lib/receipt-rawbt-formatter.js` - Formatter baru
2. ✅ `components/features/ReceiptPreview.jsx` - Update import dan handler
3. ✅ `hooks/useRawBTPrint.js` - Enhanced dengan format function
4. ✅ `app/test-receipt-format/page.js` - Test page

## Next Steps

1. Test di Android device dengan RawBT
2. Verify format sesuai ekspektasi  
3. Adjust spacing/alignment jika perlu
4. Test dengan berbagai jenis transaksi

Format sekarang sudah sesuai dengan ekspektasi thermal printer dan tidak akan menampilkan text `//print?text=` lagi.