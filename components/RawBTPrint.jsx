'use client'

import { useEffect } from 'react'

const RawBTPrint = () => {
  useEffect(() => {
    // Pastikan kode hanya berjalan di client side
    if (typeof window === 'undefined') return

    const handlePrintToRawBT = () => {
      try {
        // Ambil elemen struk berdasarkan ID
        const strukElement = document.getElementById('struk')
        
        if (!strukElement) {
          console.error('Element dengan id "struk" tidak ditemukan')
          alert('Element struk tidak ditemukan!')
          return
        }

        // Ambil teks dari elemen struk
        const strukText = strukElement.innerText || strukElement.textContent || ''
        
        if (!strukText.trim()) {
          console.warn('Konten struk kosong')
          alert('Konten struk kosong!')
          return
        }

        // Encode teks untuk URL
        const encodedText = encodeURIComponent(strukText)
        
        // Debug log
        console.log('Struk text:', strukText)
        console.log('Encoded text length:', encodedText.length)
        
        // Buka RawBT app dengan URL scheme
        const rawbtUrl = `rawbt:${encodedText}`
        
        console.log('Opening RawBT with URL:', rawbtUrl.substring(0, 100) + '...')
        
        // Redirect ke RawBT
        window.location.href = rawbtUrl
        
        // Fallback: jika RawBT tidak terbuka dalam 2 detik, tampilkan pesan
        setTimeout(() => {
          const userResponse = confirm(
            'RawBT app tidak terbuka secara otomatis. Apakah Anda ingin menginstall RawBT dari Play Store?'
          )
          
          if (userResponse) {
            window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter', '_blank')
          }
        }, 2000)
        
      } catch (error) {
        console.error('Error printing to RawBT:', error)
        alert('Gagal mencetak ke RawBT: ' + error.message)
      }
    }

    // Cari tombol print berdasarkan ID
    const printButton = document.getElementById('btnPrint')
    
    if (printButton) {
      // Tambahkan event listener untuk tombol print
      printButton.addEventListener('click', handlePrintToRawBT)
      
      console.log('RawBT print handler attached to #btnPrint')
    } else {
      console.warn('Tombol dengan id "btnPrint" tidak ditemukan')
    }

    // Cleanup function untuk remove event listener
    return () => {
      if (printButton) {
        printButton.removeEventListener('click', handlePrintToRawBT)
      }
    }
  }, []) // Empty dependency array - hanya run sekali setelah mount

  // Komponen ini tidak render apapun, hanya menambahkan functionality
  return null
}

export default RawBTPrint