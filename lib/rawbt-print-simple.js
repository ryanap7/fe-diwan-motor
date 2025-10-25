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
    const strukText = strukElement.innerText || strukElement.textContent || ''
    
    if (!strukText.trim()) {
      console.warn('Konten struk kosong')
      alert('Konten struk kosong!')
      return false
    }

    // Encode teks untuk URL
    const encodedText = encodeURIComponent(strukText)
    
    // Debug log
    console.log('Printing to RawBT - Text length:', strukText.length)
    console.log('Encoded text length:', encodedText.length)
    
    // Buka RawBT app dengan URL scheme
    const rawbtUrl = `rawbt://print?text=${encodedText}`
    
    // Redirect ke RawBT
    window.location.href = rawbtUrl
    
    // Fallback handler
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