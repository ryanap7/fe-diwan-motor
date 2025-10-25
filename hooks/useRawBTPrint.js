'use client'

import { useEffect, useCallback } from 'react'

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
      const strukText = strukElement.innerText || strukElement.textContent || ''
      
      if (!strukText.trim()) {
        const errorMsg = 'Konten struk kosong'
        console.warn(errorMsg)
        if (showAlert) alert(errorMsg + '!')
        onError(new Error(errorMsg))
        return false
      }

      // Encode untuk URL
      const encodedText = encodeURIComponent(strukText)
      
      // Log untuk debugging
      console.log('RawBT Print - Original text length:', strukText.length)
      console.log('RawBT Print - Encoded text length:', encodedText.length)
      
      // Buat URL untuk RawBT
      const rawbtUrl = `rawbt://print?text=${encodedText}`
      
      // Buka RawBT
      window.location.href = rawbtUrl
      
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
    const strukText = strukElement.innerText || strukElement.textContent || ''
    
    if (!strukText.trim()) {
      const errorMsg = 'Konten struk kosong'
      console.warn(errorMsg)
      if (showAlert) alert(errorMsg + '!')
      return false
    }

    // Encode dan buka RawBT
    const encodedText = encodeURIComponent(strukText)
    const rawbtUrl = `rawbt://print?text=${encodedText}`
    
    window.location.href = rawbtUrl
    
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