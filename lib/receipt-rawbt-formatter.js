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
    let strukText = generateReceiptText(receiptData)
    
    // Validate generated text
    if (!strukText || strukText.trim().length === 0) {
      console.error('Generated receipt text is empty! Using fallback text.')
      console.log('Receipt data:', receiptData)
      
      // Fallback with minimal receipt
      strukText = `        HD MOTOPART        
  Jl Maulana hasanudin RT 02 RW 02  
================================

Tanggal  : ${new Date().toLocaleDateString('id-ID')}
Waktu    : ${new Date().toLocaleTimeString('id-ID')}
Kasir    : Admin

================================

Test Item
1x Rp 5.000                 Rp 5.000

................................
Subtotal : Rp 5.000
................................
TOTAL    : Rp 5.000
Bayar    : Rp 5.000
Kembali  : Rp 0
================================

         Terima Kasih!         
     Selamat Berbelanja Kembali     

${new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"})}`
      
      console.log('Using fallback receipt text')
    }
    
    // Debug the generated text
    console.log('=== RAWBT DEBUG ===')
    console.log('Receipt data received:', receiptData)
    console.log('Generated receipt text:')
    console.log(strukText)
    console.log('Text length:', strukText.length)
    console.log('First 200 chars:', strukText.substring(0, 200))
    console.log('===================')
    
    // Clean the text to remove any unwanted prefixes and artifacts
    let cleanText = strukText
      .replace(/^\/\/[^\n]*\n?/gm, '') // Remove lines starting with //
      .replace(/\/\/print\?text=/g, '') // Remove //print?text= completely
      .replace(/^\/+/gm, '') // Remove leading slashes from lines
      .replace(/\/\/HD MOTOPART/g, 'HD MOTOPART') // Specifically fix //HD MOTOPART
      .replace(/\/\/.*(?=HD MOTOPART)/g, '') // Remove // before HD MOTOPART
      .trim()
    
    console.log('Original text preview:', strukText.substring(0, 200))
    console.log('Cleaned text preview:', cleanText.substring(0, 200))
    
    // Encode untuk URL
    const encodedText = encodeURIComponent(cleanText)
    console.log('Encoded length:', encodedText.length)
    console.log('Encoded preview:', encodedText.substring(0, 200) + '...')
    
    // Use clean RawBT URL format to avoid showing parameter names
    const cleanUrl = `rawbt:${encodedText}`
    console.log('Using clean RawBT URL format')
    console.log('Clean URL length:', cleanUrl.length)
    console.log('URL preview:', cleanUrl.substring(0, 100) + '...')
    
    window.location.href = cleanUrl
    
    // Fallback dengan deteksi yang lebih baik
    let appOpened = false
    let fallbackTimer = null
    
    // Detect if app opened by monitoring page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true
        if (fallbackTimer) {
          clearTimeout(fallbackTimer)
          fallbackTimer = null
        }
      }
    }
    
    // Detect if user navigated back without app opening
    const handleFocus = () => {
      if (!appOpened) {
        // User came back quickly, app probably didn't open
        setTimeout(() => {
          if (!appOpened) {
            const userResponse = confirm(
              'RawBT app tidak terbuka. Pastikan RawBT sudah terinstall dengan benar. Apakah Anda ingin membuka Play Store untuk install/update RawBT?'
            )
            
            if (userResponse) {
              window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter', '_blank')
            }
          }
        }, 1000)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    // Cleanup after reasonable time
    fallbackTimer = setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }, 10000)
    
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
  
  // Header toko - Pastikan center dan tidak ada // 
  receipt.push('        HD MOTOPART        ')
  receipt.push('  Jl Maulana hasanudin RT 02 RW  ')
  receipt.push('               02                ')
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
  
  // Payment method info
  const paymentMethod = receiptData?.paymentMethod || 'TUNAI'
  receipt.push(`Metode       : ${paymentMethod}`)
  
  receipt.push(`Bayar        : ${formatCurrency(receiptData?.amountPaid || 0)}`)
  if (paymentMethod === 'TUNAI' && parseFloat(receiptData?.change || 0) > 0) {
    receipt.push(`Kembali      : ${formatCurrency(receiptData?.change || 0)}`)
  }
  receipt.push('================================')
  receipt.push('')
  receipt.push('       Terima Kasih!       ')
  receipt.push('   Selamat Berbelanja Kembali   ')
  receipt.push('')
  receipt.push(`      ${new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"})}      `)
  
  return receipt.join('\n')
}

export default printReceiptToRawBT