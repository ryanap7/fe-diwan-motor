'use client'

// Fungsi untuk mencetak ke RawBT
export const printToRawBT = () => {
  try {
    // Ambil elemen struk berdasarkan ID
    const strukElement = document.getElementById('struk')
    
    if (!strukElement) {
      console.error('Element dengan id "struk" tidak ditemukan')
      alert('Element struk tidak ditemukan!')
      return false
    }

    // Ambil teks dari elemen struk
    let strukText = strukElement.innerText || strukElement.textContent || ''
    
    if (!strukText.trim()) {
      console.warn('Konten struk kosong')
      alert('Konten struk kosong!')
      return false
    }

    // Clean text untuk menghilangkan // prefix dan artifacts
    strukText = strukText
      .replace(/^\/\/[^\n]*\n?/gm, '') // Remove lines starting with //
      .replace(/\/\/print\?text=/g, '') // Remove //print?text= completely
      .replace(/^\/+/gm, '') // Remove leading slashes from lines
      .replace(/\/\/HD MOTOPART/g, 'HD MOTOPART') // Specifically fix //HD MOTOPART
      .replace(/\/\/.*(?=HD MOTOPART)/g, '') // Remove // before HD MOTOPART
      .trim()

    // Encode teks untuk URL
    const encodedText = encodeURIComponent(strukText)
    
    // Debug log
    console.log('Printing to RawBT - Text length:', strukText.length)
    console.log('Encoded text length:', encodedText.length)
    
    // Buka RawBT app dengan format URL bersih
    const rawbtUrl = `rawbt://${encodedText}`
    
    // Redirect ke RawBT
    console.log('Opening RawBT with clean URL format')
    console.log('Text preview:', strukText.substring(0, 100) + '...')
    window.location.href = rawbtUrl
    
    // Fallback handler - tunggu lebih lama sebelum menampilkan prompt
    setTimeout(() => {
      const userResponse = confirm(
        'RawBT app tidak terbuka secara otomatis. Pastikan RawBT sudah terinstall. Apakah Anda ingin membuka Play Store untuk install RawBT?'
      )
      
      if (userResponse) {
        window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter', '_blank')
      }
    }, 5000)
    
    return true
    
  } catch (error) {
    console.error('Error printing to RawBT:', error)
    alert('Gagal mencetak ke RawBT: ' + error.message)
    return false
  }
}

// Auto-attach ke button saat DOM ready
if (typeof window !== 'undefined') {
  const attachPrintHandler = () => {
    const printButton = document.getElementById('btnPrint')
    
    if (printButton) {
      printButton.addEventListener('click', printToRawBT)
      console.log('RawBT print handler attached to #btnPrint')
    } else {
      console.warn('Tombol dengan id "btnPrint" tidak ditemukan')
    }
  }

  // Attach setelah DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachPrintHandler)
  } else {
    attachPrintHandler()
  }
}