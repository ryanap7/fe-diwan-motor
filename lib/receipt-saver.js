'use client'

/**
 * Utility untuk save receipt dalam berbagai format
 */

// Generate receipt text dalam format yang bagus untuk sharing/download
export const generateReceiptText = (data, format = 'download') => {
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`
  }

  if (format === 'sharing') {
    // Format untuk mobile sharing (dengan emoji)
    let text = []
    text.push('📄 STRUK PEMBELIAN')
    text.push('🏪 HD MOTOPART')
    text.push('📍 Jl Maulana hasanudin RT 02 RW 02')
    text.push('')
    text.push(`📅 ${data.date || new Date().toLocaleDateString('id-ID')}`)
    text.push(`⏰ ${data.time || new Date().toLocaleTimeString('id-ID')}`)
    text.push(`👤 Kasir: ${data.cashierName || data.userName || 'Admin'}`)
    
    if (data.customerName && data.customerName !== 'Customer') {
      text.push(`👥 Customer: ${data.customerName}`)
    }
    
    text.push('')
    text.push('📦 ITEM PEMBELIAN:')
    
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        const qty = parseInt(item?.quantity) || 0
        if (qty > 0) {
          text.push(`• ${item.name || 'Item'}`)
          text.push(`  ${qty}x ${formatCurrency(item.unitPrice || 0)} = ${formatCurrency(item.subtotal || 0)}`)
        }
      })
    }
    
    text.push('')
    text.push(`💰 TOTAL: ${formatCurrency(data.total || 0)}`)
    text.push(`💳 Bayar: ${formatCurrency(data.amountPaid || 0)}`)
    text.push(`💵 Kembali: ${formatCurrency(data.change || 0)}`)
    text.push('')
    text.push('🙏 Terima kasih telah berbelanja!')
    text.push('🔄 Selamat datang kembali!')
    
    return text.join('\n')
  }

  // Format untuk download/print (text biasa)
  let text = []
  text.push('================================')
  text.push('        HD MOTOPART        ')
  text.push('  Jl Maulana hasanudin RT 02 RW 02  ')
  text.push('================================')
  text.push('')
  text.push(`Tanggal      : ${data.date || new Date().toLocaleDateString('id-ID')}`)
  text.push(`Waktu        : ${data.time || new Date().toLocaleTimeString('id-ID')}`)
  text.push(`Kasir        : ${data.cashierName || data.userName || 'Admin'}`)
  
  if (data.customerName && data.customerName !== 'Customer') {
    text.push(`Customer     : ${data.customerName}`)
  }
  
  text.push('================================')
  text.push('')
  
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach(item => {
      const qty = parseInt(item?.quantity) || 0
      if (qty > 0) {
        text.push(item.name || 'Item')
        const qtyLine = `${qty}x ${formatCurrency(item.unitPrice || 0)}`
        const subtotalLine = formatCurrency(item.subtotal || 0)
        text.push(`${qtyLine.padEnd(20)}${subtotalLine.padStart(12)}`)
        text.push('')
      }
    })
  }
  
  text.push('--------------------------------')
  text.push(`Subtotal     : ${formatCurrency(data.subtotal || 0)}`)
  
  if (parseFloat(data.discount || 0) > 0) {
    text.push(`Diskon       : -${formatCurrency(data.discount)}`)
  }
  
  if (parseFloat(data.tax || 0) > 0) {
    text.push(`Pajak        : ${formatCurrency(data.tax)}`)
  }
  
  text.push('--------------------------------')
  text.push(`TOTAL        : ${formatCurrency(data.total || 0)}`)
  text.push(`Bayar        : ${formatCurrency(data.amountPaid || 0)}`)
  text.push(`Kembali      : ${formatCurrency(data.change || 0)}`)
  text.push('================================')
  text.push('')
  text.push('       Terima Kasih!       ')
  text.push('   Selamat Berbelanja Kembali   ')
  text.push('')
  text.push(`      ${new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"})}      `)
  
  return text.join('\n')
}

// Save receipt as text file
export const saveReceiptAsTextFile = (receiptData) => {
  try {
    const receiptText = generateReceiptText(receiptData, 'download')
    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `struk-${receiptData.invoiceNo || 'receipt'}-${new Date().toISOString().slice(0, 10)}.txt`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('Error saving text file:', error)
    return false
  }
}

// Share receipt via native sharing API
export const shareReceipt = async (receiptData) => {
  if (!navigator.share) {
    return false
  }

  try {
    const receiptText = generateReceiptText(receiptData, 'sharing')
    
    await navigator.share({
      title: 'Struk Pembelian - HD MOTOPART',
      text: receiptText,
      url: window.location.href
    })
    
    return true
  } catch (error) {
    console.error('Error sharing receipt:', error)
    return false
  }
}

// Copy receipt to clipboard
export const copyReceiptToClipboard = async (receiptData) => {
  if (!navigator.clipboard) {
    return false
  }

  try {
    const receiptText = generateReceiptText(receiptData, 'sharing')
    await navigator.clipboard.writeText(receiptText)
    return true
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    return false
  }
}

// Main function untuk save receipt dengan multiple options
export const saveReceipt = async (receiptData, options = {}) => {
  const { preferredMethod = 'auto', showToast = true } = options

  // Try native sharing first (mobile)
  if (preferredMethod === 'auto' || preferredMethod === 'share') {
    const shared = await shareReceipt(receiptData)
    if (shared) {
      if (showToast) alert('Struk berhasil dibagikan!')
      return true
    }
  }

  // Try clipboard copy
  if (preferredMethod === 'auto' || preferredMethod === 'clipboard') {
    const copied = await copyReceiptToClipboard(receiptData)
    if (copied) {
      if (showToast) alert('Struk berhasil disalin ke clipboard!')
      return true
    }
  }

  // Fallback to text file download
  const saved = saveReceiptAsTextFile(receiptData)
  if (saved) {
    if (showToast) alert('Struk berhasil disimpan sebagai file teks!')
    return true
  }

  if (showToast) alert('Gagal menyimpan struk!')
  return false
}

export default saveReceipt