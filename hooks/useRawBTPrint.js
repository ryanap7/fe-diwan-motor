'use client'

import { useEffect, useCallback } from 'react'

/**
 * Format text khusus untuk thermal printer
 */
const formatForThermalPrint = (text) => {
  // Split text menjadi lines
  const lines = text.split('\n')
  let formattedLines = []
  
  lines.forEach(line => {
    line = line.trim()
    if (!line) return
    
    // Format header toko
    if (line.includes('HD MOTOPART')) {
      formattedLines.push('        HD MOTOPART        ')
      return
    }
    
    // Format alamat
    if (line.includes('Jl Maulana hasanudin')) {
      formattedLines.push('  Jl Maulana hasanudin RT 02 RW 02  ')
      formattedLines.push('================================')
      return
    }
    
    // Format tanggal/waktu/kasir info
    if (line.includes('Tanggal:') || line.includes('Waktu:') || line.includes('Kasir:')) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const label = parts[0].trim()
        const value = parts.slice(1).join(':').trim()
        formattedLines.push(`${label.padEnd(12)}: ${value}`)
      }
      return
    }
    
    // Format item lines (yang mengandung 'x Rp')
    if (line.includes('x Rp')) {
      // Parse item line: "1 x Rp 2000" -> format jadi thermal style
      const match = line.match(/^(.+?)\s+(\d+)\s*x\s*Rp\s*([\d,\.]+).*?Rp\s*([\d,\.]+)/)
      if (match) {
        const [, itemName, qty, price, subtotal] = match
        const cleanItemName = itemName.trim()
        const itemLine = `${cleanItemName}`
        const priceLine = `${qty}x ${formatCurrency(price)}     ${formatCurrency(subtotal)}`
        
        formattedLines.push(itemLine)
        formattedLines.push(priceLine)
      } else {
        formattedLines.push(line)
      }
      return
    }
    
    // Format total lines
    if (line.includes('Subtotal:') || line.includes('TOTAL:') || line.includes('Bayar:') || line.includes('Kembali:')) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const label = parts[0].trim()
        const value = parts.slice(1).join(':').trim()
        
        if (label === 'TOTAL') {
          formattedLines.push('--------------------------------')
          formattedLines.push(`${label.padEnd(20)}: ${value}`)
          formattedLines.push('--------------------------------')
        } else {
          formattedLines.push(`${label.padEnd(20)}: ${value}`)
        }
      }
      return
    }
    
    // Format footer
    if (line.includes('Terima kasih') || line.includes('Selamat Berbelanja')) {
      formattedLines.push('================================')
      formattedLines.push('       Terima Kasih!       ')
      formattedLines.push('   Selamat Berbelanja Kembali   ')
      return
    }
    
    // Handle date timestamp di footer
    if (line.match(/\d{2}\/\d{2}\/\d{4}/)) {
      formattedLines.push(`        ${line}        `)
      return
    }
    
    // Default: add line as is
    formattedLines.push(line)
  })
  
  return formattedLines.join('\n')
}

/**
 * Helper untuk format currency
 */
const formatCurrency = (amount) => {
  const num = parseFloat(amount.toString().replace(/[^\d]/g, '')) || 0
  return `Rp ${num.toLocaleString('id-ID')}`
}

/**
 * Custom hook untuk print struk ke RawBT App (Android)
 * @param {string} strukElementId - ID element yang berisi konten struk (default: 'struk')
 * @param {string} printButtonId - ID tombol print (default: 'btnPrint')
 * @param {object} options - Opsi tambahan
 */
export const useRawBTPrint = (strukElementId = 'struk', printButtonId = 'btnPrint', options = {}) => {
  const {
    onSuccess = () => {},
    onError = () => {},
    showAlert = true,
    autoInstallPrompt = true,
    fallbackDelay = 2000
  } = options

  // Fungsi untuk print ke RawBT
  const printToRawBT = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('printToRawBT: Window object not available (SSR)')
      return false
    }

    try {
      // Ambil element struk
      const strukElement = document.getElementById(strukElementId)
      
      if (!strukElement) {
        const errorMsg = `Element dengan id "${strukElementId}" tidak ditemukan`
        console.error(errorMsg)
        if (showAlert) alert(errorMsg + '!')
        onError(new Error(errorMsg))
        return false
      }

      // Ambil teks dari element
      let strukText = strukElement.innerText || strukElement.textContent || ''
      
      if (!strukText.trim()) {
        const errorMsg = 'Konten struk kosong'
        console.warn(errorMsg)
        if (showAlert) alert(errorMsg + '!')
        onError(new Error(errorMsg))
        return false
      }

      // Clean dan format text untuk RawBT
      strukText = strukText
        .replace(/\s+/g, ' ')           // Replace multiple spaces dengan single space
        .replace(/\n\s*\n/g, '\n')      // Remove empty lines
        .trim()                         // Trim whitespace
        .replace(/\s*\n\s*/g, '\n')     // Clean line breaks
        
      // Format ulang untuk thermal printer
      strukText = formatForThermalPrint(strukText)

      // Encode untuk URL
      const encodedText = encodeURIComponent(strukText)
      
      // Log untuk debugging
      console.log('RawBT Print - Original text length:', strukText.length)
      console.log('RawBT Print - Encoded text length:', encodedText.length)
      
      // Buat Intent untuk RawBT yang lebih reliable
      const intentUrl = `intent://print#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.text=${encodedText};end`
      
      // Buka RawBT
      console.log('Opening RawBT with Intent:', intentUrl)
      window.location.href = intentUrl
      
      // Callback sukses
      onSuccess(strukText)
      
      // Fallback - prompt install jika app tidak terbuka
      if (autoInstallPrompt && fallbackDelay > 0) {
        setTimeout(() => {
          const userResponse = confirm(
            'RawBT app tidak terbuka secara otomatis. Apakah Anda ingin menginstall RawBT dari Play Store?'
          )
          
          if (userResponse) {
            window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter', '_blank')
          }
        }, fallbackDelay)
      }
      
      return true
      
    } catch (error) {
      console.error('Error printing to RawBT:', error)
      if (showAlert) alert('Gagal mencetak ke RawBT: ' + error.message)
      onError(error)
      return false
    }
  }, [strukElementId, showAlert, onSuccess, onError, autoInstallPrompt, fallbackDelay])

  // Auto-attach event listener ke tombol print
  useEffect(() => {
    if (typeof window === 'undefined') return

    const attachEventListener = () => {
      const printButton = document.getElementById(printButtonId)
      
      if (printButton) {
        printButton.addEventListener('click', printToRawBT)
        console.log(`RawBT print handler attached to #${printButtonId}`)
        
        // Cleanup function
        return () => {
          printButton.removeEventListener('click', printToRawBT)
        }
      } else {
        console.warn(`Tombol dengan id "${printButtonId}" tidak ditemukan`)
        return () => {} // Empty cleanup
      }
    }

    // Attach handler
    const cleanup = attachEventListener()

    // Return cleanup function
    return cleanup
  }, [printButtonId, printToRawBT])

  // Return fungsi print untuk manual call jika diperlukan
  return {
    printToRawBT,
    isAvailable: typeof window !== 'undefined'
  }
}

/**
 * Fungsi standalone untuk print ke RawBT (tanpa hook)
 * @param {string} strukElementId - ID element struk
 * @param {object} options - Opsi tambahan  
 */
export const printStrukToRawBT = (strukElementId = 'struk', options = {}) => {
  const {
    showAlert = true,
    autoInstallPrompt = true,
    fallbackDelay = 2000
  } = options

  if (typeof window === 'undefined') {
    console.warn('printStrukToRawBT: Not available in SSR')
    return false
  }

  try {
    // Ambil element struk
    const strukElement = document.getElementById(strukElementId)
    
    if (!strukElement) {
      const errorMsg = `Element dengan id "${strukElementId}" tidak ditemukan`
      console.error(errorMsg)
      if (showAlert) alert(errorMsg + '!')
      return false
    }

    // Ambil teks
    let strukText = strukElement.innerText || strukElement.textContent || ''
    
    if (!strukText.trim()) {
      const errorMsg = 'Konten struk kosong'
      console.warn(errorMsg)
      if (showAlert) alert(errorMsg + '!')
      return false
    }

    // Clean dan format text untuk RawBT
    strukText = strukText
      .replace(/\s+/g, ' ')           
      .replace(/\n\s*\n/g, '\n')      
      .trim()                         
      .replace(/\s*\n\s*/g, '\n')     
      
    // Format ulang untuk thermal printer
    strukText = formatForThermalPrint(strukText)

    // Encode dan buka RawBT menggunakan Intent yang lebih reliable
    const encodedText = encodeURIComponent(strukText)
    const intentUrl = `intent://print#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.text=${encodedText};end`
    
    console.log('Opening RawBT with Intent:', intentUrl)
    window.location.href = intentUrl
    
    // Fallback install prompt
    if (autoInstallPrompt && fallbackDelay > 0) {
      setTimeout(() => {
        const userResponse = confirm(
          'RawBT app tidak terbuka secara otomatis. Apakah Anda ingin menginstall RawBT dari Play Store?'
        )
        
        if (userResponse) {
          window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter', '_blank')
        }
      }, fallbackDelay)
    }
    
    return true
    
  } catch (error) {
    console.error('Error printing to RawBT:', error)
    if (showAlert) alert('Gagal mencetak ke RawBT: ' + error.message)
    return false
  }
}

export default useRawBTPrint