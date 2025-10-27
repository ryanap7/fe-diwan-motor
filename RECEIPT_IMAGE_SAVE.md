# Save Receipt as Image Feature

## Overview
Fitur untuk menyimpan struk sebagai gambar PNG yang dapat didownload ke galeri/folder download device.

## Implementation

### Component: `ReceiptPreview.jsx`
- **Tombol**: "Simpan Struk" dengan icon Download
- **Function**: `handleSaveAsImage()` - trigger save process
- **Generator**: `generateReceiptImage()` - create canvas image

### How It Works

1. **Canvas Creation**
   - Membuat HTML5 Canvas element
   - Set ukuran canvas untuk thermal receipt (400px width)
   - Calculate height berdasarkan content

2. **Content Rendering**
   - Header: HD MOTOPART + alamat
   - Transaction info: tanggal, waktu, kasir
   - Items: nama produk, quantity, harga, subtotal  
   - Totals: subtotal, diskon, pajak, total, bayar, kembali
   - Footer: terima kasih + timestamp

3. **Image Generation**
   - Convert canvas to PNG blob
   - Create download link
   - Trigger automatic download
   - Cleanup resources

### Features

#### ✅ **Native Canvas API**
- Tidak perlu library eksternal
- No dependency pada html2canvas
- Built-in browser support

#### ✅ **Thermal Receipt Format**
- 58mm width standard (400px)
- Proper spacing dan alignment
- Professional receipt layout

#### ✅ **Complete Content**
- Store header dengan nama dan alamat
- Transaction details lengkap
- Item list dengan formatting
- Total calculations
- Footer dengan timestamp

#### ✅ **Auto Download** 
- Generate filename: `struk-{invoiceNo}-{date}.png`
- Direct download ke device
- Compatible dengan mobile dan desktop

## Usage

### Di ReceiptPreview Modal
```jsx
<Button 
  variant="outline" 
  className="flex-1 border-green-500 text-green-600 hover:bg-green-50" 
  onClick={handleSaveAsImage}
>
  <Download className="w-4 h-4 mr-2" />
  Simpan Struk
</Button>
```

### Manual Function Call
```jsx
const receiptData = {
  date: '27/10/2025',
  time: '08.01.05',
  cashierName: 'Admin',
  items: [
    { name: 'Item', quantity: 1, unitPrice: 3, subtotal: 3 }
  ],
  subtotal: 3,
  total: 0,
  amountPaid: 3,
  change: 0
}

// Call the save function
handleSaveAsImage(receiptData)
```

## Technical Details

### Canvas Properties
```jsx
canvas.width = 400        // Thermal receipt width
canvas.height = calculated // Based on content
backgroundColor = '#ffffff'
textColor = '#000000'
```

### Text Formatting
```jsx
// Header
font: 'bold 18px Arial'
align: 'center'

// Content  
font: '11-12px Arial'
align: 'left' / 'right' (for prices)

// Lines
strokeStyle: '#000000'
lineWidth: 1px
```

### File Output
- **Format**: PNG image
- **Quality**: 1.0 (maximum)
- **Filename**: `struk-{invoice}-{date}.png`
- **Location**: Browser default download folder

## Browser Compatibility

### ✅ **Desktop**
- Chrome, Firefox, Safari, Edge
- Auto download ke Downloads folder

### ✅ **Mobile** 
- Chrome Mobile, Safari Mobile
- Android: Download ke Downloads/Pictures
- iOS: Save to Files/Photos (user choice)

### ✅ **Canvas Support**
- All modern browsers
- IE11+ support
- No polyfill needed

## Testing

### Test Cases
1. **Basic Receipt**: Simple transaction dengan 1 item
2. **Multiple Items**: Transaction dengan beberapa produk  
3. **With Discount**: Transaction dengan diskon
4. **With Tax**: Transaction dengan pajak
5. **Long Item Names**: Test text wrapping
6. **No Customer**: Transaction tanpa customer name
7. **Large Numbers**: Test formatting angka besar

### Expected Output
```
================================
        HD MOTOPART        
  Jl Maulana hasanudin RT 02 RW 02  
================================

Tanggal: 27/10/2025
Waktu: 08.01.05  
Kasir: Admin

================================

Item
1x Rp 3                    Rp 3

--------------------------------
Subtotal:              Rp 3
TOTAL:                 Rp 0  
Bayar:                 Rp 3
Kembali:               Rp 0
================================

       Terima Kasih!       
   Selamat Berbelanja Kembali   

      27/10/2025, 08.01.05      
```

## Troubleshooting

### Image Not Downloading
1. Check browser popup blocker
2. Verify canvas support
3. Check file permissions

### Content Cutoff
1. Adjust canvas height calculation
2. Check text positioning
3. Verify padding values

### Blurry Text
1. Increase canvas scale
2. Use proper font sizes
3. Check device pixel ratio

## Future Enhancements

### Possible Improvements
1. **QR Code**: Add QR code dengan transaction ID
2. **Logo**: Include store logo di header
3. **Barcode**: Add item barcodes
4. **Colors**: Support colored receipts
5. **Templates**: Multiple receipt templates
6. **Print Preview**: Show image preview sebelum save

### Advanced Features
1. **Batch Export**: Save multiple receipts
2. **Email Integration**: Send receipt via email
3. **Cloud Sync**: Sync ke cloud storage
4. **OCR Ready**: Format untuk OCR scanning

## Security Notes

- No data dikirim ke server
- Image generated locally di browser
- No external dependencies
- Privacy-friendly implementation

Fitur ini memberikan user kemampuan untuk menyimpan struk sebagai gambar berkualitas tinggi yang bisa dibagikan atau disimpan untuk keperluan record-keeping.