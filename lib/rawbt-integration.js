/**
 * RawBT Integration for Thermal Printing
 * Integrates with RawBT mobile app for seamless thermal printing
 * Website: RawBT inkless print service
 */

export class RawBTIntegration {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // RawBT app configuration
    this.rawbtConfig = {
      packageName: 'ru.a402d.rawbtprinter',
      intentAction: 'android.intent.action.SEND',
      dataType: 'text/plain',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter',
      appName: 'RawBT'
    };
  }

  /**
   * Check if RawBT integration is available
   */
  async checkRawBTAvailability() {
    if (!this.isMobile) {
      return {
        available: false,
        reason: 'RawBT hanya tersedia di perangkat mobile',
        fallback: 'web-bluetooth'
      };
    }

    return {
      available: true,
      reason: 'RawBT integration tersedia',
      method: 'intent'
    };
  }

  /**
   * Print receipt via RawBT app using Intent
   */
  async printViaRawBT(receiptData) {
    try {
      const receiptText = this.formatReceiptForRawBT(receiptData);
      
      // Create intent URL for RawBT
      const intentUrl = `intent://#Intent;action=${this.rawbtConfig.intentAction};type=${this.rawbtConfig.dataType};package=${this.rawbtConfig.packageName};S.android.intent.extra.TEXT=${encodeURIComponent(receiptText)};end`;
      
      console.log('Opening RawBT with intent:', intentUrl);
      
      // Try to open RawBT app
      window.location.href = intentUrl;
      
      // Show success message immediately
      setTimeout(() => {
        this.showRawBTInfo();
      }, 1000);

      return {
        success: true,
        method: 'rawbt-intent',
        message: 'Membuka RawBT app untuk printing...'
      };

    } catch (error) {
      console.error('Error printing via RawBT Intent:', error);
      throw new Error(`Gagal print via RawBT: ${error.message}`);
    }
  }

  /**
   * Alternative method using direct text sharing
   */
  async printViaShare(receiptData) {
    try {
      const receiptText = this.formatReceiptForRawBT(receiptData);
      
      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share({
          title: 'Print Receipt via RawBT',
          text: receiptText
        });
        
        return {
          success: true,
          method: 'web-share',
          message: 'Pilih RawBT untuk print receipt'
        };
      } else {
        // Fallback to creating a shareable link
        const shareUrl = `intent://#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(receiptText)};end`;
        window.location.href = shareUrl;
        
        return {
          success: true,
          method: 'intent-share',
          message: 'Membuka aplikasi sharing untuk print'
        };
      }
    } catch (error) {
      console.error('Error sharing via RawBT:', error);
      throw new Error(`Gagal share ke RawBT: ${error.message}`);
    }
  }

  /**
   * Main print method
   */
  async print(receiptData, method = 'auto') {
    console.log('RawBTIntegration: Starting print process', receiptData);

    // Check availability
    const availability = await this.checkRawBTAvailability();
    
    if (!availability.available) {
      throw new Error(availability.reason);
    }

    // Try different methods
    if (method === 'auto' || method === 'intent') {
      try {
        return await this.printViaRawBT(receiptData);
      } catch (error) {
        if (method === 'intent') throw error;
        console.warn('RawBT intent failed, trying share method:', error);
      }
    }
    
    if (method === 'auto' || method === 'share') {
      return await this.printViaShare(receiptData);
    }

    throw new Error('Semua metode RawBT gagal');
  }

  /**
   * Format receipt data for RawBT app
   */
  formatReceiptForRawBT(receiptData) {
    try {
      let receipt = '';

      // ESC/POS commands for RawBT
      const ESC = String.fromCharCode(27);
      const GS = String.fromCharCode(29);
      
      // Initialize printer
      receipt += ESC + '@';
      
      // Header - Center aligned, bold, double height
      receipt += ESC + 'a' + String.fromCharCode(1); // Center align
      receipt += GS + '!' + String.fromCharCode(17); // Double size
      receipt += 'HD MOTOPART\n';
      receipt += GS + '!' + String.fromCharCode(0); // Normal size
      receipt += 'Jl Maulana hasanudin RT 02 RW 02\n';
      receipt += ESC + 'a' + String.fromCharCode(0); // Left align
      receipt += '\n';

      // Separator
      receipt += '================================\n';

      // Transaction details
      receipt += `Tanggal: ${receiptData.date || new Date().toLocaleDateString('id-ID')}\n`;
      receipt += `Waktu: ${receiptData.time || new Date().toLocaleTimeString('id-ID')}\n`;
      receipt += `Kasir: ${receiptData.cashierName || receiptData.userName || 'Admin'}\n`;
      
      if (receiptData.customerName && receiptData.customerName !== 'Customer') {
        receipt += `Customer: ${receiptData.customerName}\n`;
      }
      
      receipt += '================================\n';

      // Items
      if (receiptData.items && Array.isArray(receiptData.items)) {
        receiptData.items.forEach(item => {
          const name = item?.name || 'Item';
          const qty = parseInt(item?.quantity) || 0;
          const price = parseFloat(item?.unitPrice) || 0;
          const subtotal = parseFloat(item?.subtotal) || 0;

          if (qty > 0) {
            receipt += `${name}\n`;
            receipt += `${qty} x ${this.formatCurrency(price)} = ${this.formatCurrency(subtotal)}\n`;
          }
        });
      }

      receipt += '================================\n';

      // Totals
      const subtotal = parseFloat(receiptData?.subtotal) || 0;
      const discount = parseFloat(receiptData?.discount) || 0;
      const tax = parseFloat(receiptData?.tax) || 0;
      const total = parseFloat(receiptData?.total) || 0;
      const paid = parseFloat(receiptData?.amountPaid) || 0;
      const change = parseFloat(receiptData?.change) || 0;

      receipt += `Subtotal: ${this.formatCurrency(subtotal)}\n`;
      if (discount > 0) {
        receipt += `Diskon: -${this.formatCurrency(discount)}\n`;
      }
      if (tax > 0) {
        receipt += `Pajak: ${this.formatCurrency(tax)}\n`;
      }
      
      // Total with bold
      receipt += ESC + 'E' + String.fromCharCode(1); // Bold on
      receipt += `TOTAL: ${this.formatCurrency(total)}\n`;
      receipt += ESC + 'E' + String.fromCharCode(0); // Bold off
      
      receipt += `Bayar: ${this.formatCurrency(paid)}\n`;
      receipt += `Kembali: ${this.formatCurrency(change)}\n`;

      receipt += '================================\n';
      
      // Footer - Center aligned
      receipt += ESC + 'a' + String.fromCharCode(1); // Center align
      receipt += 'Terima Kasih!\n';
      receipt += 'Selamat Berbelanja Kembali\n';
      receipt += ESC + 'a' + String.fromCharCode(0); // Left align
      receipt += '================================\n';

      // Add timestamp
      const jakartaTime = new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"});
      receipt += `\n${jakartaTime}\n`;
      
      // Cut paper
      receipt += '\n\n\n';
      receipt += GS + 'V' + String.fromCharCode(66) + String.fromCharCode(3);

      return receipt;

    } catch (error) {
      console.error('Error formatting receipt for RawBT:', error);
      return 'Error: Gagal memformat receipt';
    }
  }

  /**
   * Format currency for receipt
   */
  formatCurrency(amount) {
    try {
      const num = parseFloat(amount) || 0;
      return 'Rp ' + Math.round(num).toLocaleString('id-ID');
    } catch (error) {
      return 'Rp 0';
    }
  }

  /**
   * Show RawBT info modal
   */
  showRawBTInfo() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 m-4 max-w-md">
        <div class="text-center">
          <div class="text-6xl mb-4">🖨️</div>
          <h3 class="text-lg font-semibold mb-2">RawBT Printing</h3>
          <p class="text-gray-600 mb-4">
            Receipt data telah dikirim ke RawBT app. Pastikan printer Bluetooth sudah terhubung di RawBT.
          </p>
          <div class="flex gap-2">
            <button 
              onclick="window.open('${this.rawbtConfig.playStoreUrl}', '_blank')" 
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Install RawBT
            </button>
            <button 
              onclick="this.parentElement.parentElement.parentElement.remove()" 
              class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              OK
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            RawBT: Aplikasi gratis untuk print via Bluetooth
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Auto remove after 8 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 8000);
  }

  /**
   * Show install prompt for RawBT app
   */
  showInstallPrompt() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 m-4 max-w-md">
        <div class="text-center">
          <div class="text-6xl mb-4">📱</div>
          <h3 class="text-lg font-semibold mb-2">Install RawBT App</h3>
          <p class="text-gray-600 mb-4">
            Untuk print thermal receipt, silakan install aplikasi RawBT dari Google Play Store.
          </p>
          <div class="flex gap-2">
            <button 
              onclick="window.open('${this.rawbtConfig.playStoreUrl}', '_blank')" 
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Install RawBT
            </button>
            <button 
              onclick="this.parentElement.parentElement.parentElement.remove()" 
              class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            RawBT adalah aplikasi gratis untuk thermal printing
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Auto remove after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      platform: this.isAndroid ? 'Android' : (this.isMobile ? 'Mobile' : 'Desktop'),
      rawbtSupported: this.isMobile,
      methods: this.isMobile ? ['intent', 'share'] : [],
      recommended: this.isMobile ? 'rawbt' : 'web-bluetooth-fallback',
      appName: 'RawBT'
    };
  }

  /**
   * Test RawBT connection
   */
  async testConnection() {
    const testReceipt = {
      items: [{
        name: 'Test Print RawBT',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000
      }],
      subtotal: 1000,
      total: 1000,
      amountPaid: 1000,
      change: 0,
      cashierName: 'Test User',
      date: new Date().toLocaleDateString('id-ID'),
      time: new Date().toLocaleTimeString('id-ID')
    };

    return await this.print(testReceipt);
  }
}

export default RawBTIntegration;