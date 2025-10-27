'use client'

import { printStrukToRawBT } from '@/hooks/useRawBTPrint'

/**
 * Fungsi khusus untuk print dari ReceiptPreview dengan format yang benar
 */
export const printReceiptToRawBT = (receiptData) => {
  if (typeof window === 'undefined') {
    console.warn('printReceiptToRawBT: Not available in SSR')
    return false
  }

  try {
    // Generate formatted receipt text
    const strukText = generateReceiptText(receiptData)
    
    // Encode untuk URL
    const encodedText = encodeURIComponent(strukText)
    
    // Debug log
    console.log('Generated receipt text:', strukText)
    console.log('Encoded length:', encodedText.length)
    
    // Buka RawBT menggunakan Intent (bukan URL scheme)
    const intentUrl = `intent://#Intent;action=android.intent.action.SEND;type=text/plain;package=ru.a402d.rawbtprinter;S.android.intent.extra.TEXT=${encodedText};end`
    window.location.href = intentUrl
    
    // Fallback
    setTimeout(() => {
      const userResponse = confirm(
        'RawBT app tidak terbuka secara otomatis. Apakah Anda ingin menginstall RawBT dari Play Store?'
      )
      
      if (userResponse) {
        window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter', '_blank')
      }
    }, 2000)
    
    return true
    
  } catch (error) {
    console.error('Error printing receipt to RawBT:', error)
    alert('Gagal mencetak ke RawBT: ' + error.message)
    return false
  }
}

/**
 * Generate formatted receipt text untuk thermal printer
 */
const generateReceiptText = (receiptData) => {
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`
  }

  let receipt = []
  
  // Header toko
  receipt.push('        HD MOTOPART        ')
  receipt.push('  Jl Maulana hasanudin RT 02 RW 02  ')
  receipt.push('================================')
  receipt.push('')
  
  // Info transaksi
  receipt.push(`Tanggal      : ${receiptData.date || new Date().toLocaleDateString('id-ID')}`)
  receipt.push(`Waktu        : ${receiptData.time || new Date().toLocaleTimeString('id-ID')}`)
  receipt.push(`Kasir        : ${receiptData.cashierName || receiptData.userName || 'Admin'}`)
  
  if (receiptData.customerName && receiptData.customerName !== 'Customer') {
    receipt.push(`Customer     : ${receiptData.customerName}`)
  }
  
  receipt.push('================================')
  receipt.push('')
  
  // Items
  if (receiptData.items && Array.isArray(receiptData.items)) {
    receiptData.items.forEach(item => {
      const name = item?.name || 'Item'
      const qty = parseInt(item?.quantity) || 0
      const price = parseFloat(item?.unitPrice) || 0
      const subtotal = parseFloat(item?.subtotal) || 0

      if (qty > 0) {
        // Nama produk
        receipt.push(name)
        // Quantity x harga = subtotal
        const qtyLine = `${qty}x ${formatCurrency(price)}`
        const subtotalLine = formatCurrency(subtotal)
        const priceLine = qtyLine.padEnd(20) + subtotalLine.padStart(12)
        receipt.push(priceLine)
        receipt.push('')
      }
    })
  }
  
  receipt.push('--------------------------------')
  
  // Totals
  receipt.push(`Subtotal     : ${formatCurrency(receiptData?.subtotal || 0)}`)
  
  if (parseFloat(receiptData?.discount || 0) > 0) {
    receipt.push(`Diskon       : -${formatCurrency(receiptData.discount)}`)
  }
  
  if (parseFloat(receiptData?.tax || 0) > 0) {
    receipt.push(`Pajak        : ${formatCurrency(receiptData.tax)}`)
  }
  
  receipt.push('--------------------------------')
  receipt.push(`TOTAL        : ${formatCurrency(receiptData?.total || 0)}`)
  receipt.push(`Bayar        : ${formatCurrency(receiptData?.amountPaid || 0)}`)
  receipt.push(`Kembali      : ${formatCurrency(receiptData?.change || 0)}`)
  receipt.push('================================')
  receipt.push('')
  receipt.push('       Terima Kasih!       ')
  receipt.push('   Selamat Berbelanja Kembali   ')
  receipt.push('')
  receipt.push(`      ${new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"})}      `)
  
  return receipt.join('\n')
}

export default printReceiptToRawBT