/**
 * Thermer App Integration for Thermal Printing
 * Integrates with Thermer mobile app for seamless thermal printing
 * Website: https://www.thermerapp.com
 */

export class ThermerIntegration {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Thermer app configuration
    this.thermerConfig = {
      packageName: 'mate.bluetoothprint',
      intentAction: 'mate.bluetoothprint.PRINT',
      urlScheme: 'thermer://',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=mate.bluetoothprint',
      webUrl: 'https://www.thermerapp.com'
    };
  }

  /**
   * Check if Thermer app is available
   */
  async checkThermerAvailability() {
    if (!this.isMobile) {
      return {
        available: false,
        reason: 'Thermer hanya tersedia di perangkat mobile',
        fallback: 'web-bluetooth'
      };
    }

    if (!this.isAndroid) {
      return {
        available: false,
        reason: 'Thermer hanya tersedia di Android',
        fallback: 'web-bluetooth'
      };
    }

    return {
      available: true,
      reason: 'Thermer app tersedia',
      method: 'intent'
    };
  }

  /**
   * Print receipt via Thermer app using Intent
   */
  async printViaIntent(receiptData) {
    try {
      const receiptText = this.formatReceiptForThermer(receiptData);
      
      // Create intent URL for Thermer
      const intentUrl = `intent://#Intent;action=${this.thermerConfig.intentAction};package=${this.thermerConfig.packageName};S.text=${encodeURIComponent(receiptText)};S.cut=true;end`;
      
      // Try to open Thermer app
      window.location.href = intentUrl;
      
      // Fallback after delay if app not installed
      setTimeout(() => {
        this.showInstallPrompt();
      }, 2000);

      return {
        success: true,
        method: 'intent',
        message: 'Membuka Thermer app untuk printing...'
      };

    } catch (error) {
      console.error('Error printing via Intent:', error);
      throw new Error(`Gagal print via Intent: ${error.message}`);
    }
  }

  /**
   * Main print method
   */
  async print(receiptData) {
    console.log('ThermerIntegration: Starting print process', receiptData);

    // Check availability
    const availability = await this.checkThermerAvailability();
    
    if (!availability.available) {
      if (availability.fallback === 'web-bluetooth') {
        throw new Error(availability.reason);
      } else {
        this.showInstallPrompt();
        return {
          success: false,
          message: availability.reason,
          action: 'install-required'
        };
      }
    }

    // Use intent method for Android
    return await this.printViaIntent(receiptData);
  }

  /**
   * Format receipt data for Thermer app
   */
  formatReceiptForThermer(receiptData) {
    try {
      let receipt = '';

      // Header
      receipt += '================================\n';
      receipt += '         HD MOTOPART\n';
      receipt += '  Jl Maulana hasanudin RT 02 RW 02\n';
      receipt += '================================\n\n';

      // Transaction details
      receipt += `Tanggal: ${receiptData.date || new Date().toLocaleDateString('id-ID')}\n`;
      receipt += `Waktu: ${receiptData.time || new Date().toLocaleTimeString('id-ID')}\n`;
      receipt += `Kasir: ${receiptData.cashierName || receiptData.userName || 'Admin'}\n`;
      
      if (receiptData.customerName && receiptData.customerName !== 'Customer') {
        receipt += `Customer: ${receiptData.customerName}\n`;
      }
      
      receipt += '\n================================\n';

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
      receipt += `TOTAL: ${this.formatCurrency(total)}\n`;
      receipt += `Bayar: ${this.formatCurrency(paid)}\n`;
      receipt += `Kembali: ${this.formatCurrency(change)}\n`;

      receipt += '\n================================\n';
      receipt += '        Terima Kasih!\n';
      receipt += '   Selamat Berbelanja Kembali\n';
      receipt += '================================\n';

      // Add timestamp
      const jakartaTime = new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"});
      receipt += `\n${jakartaTime}\n`;

      return receipt;

    } catch (error) {
      console.error('Error formatting receipt:', error);
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
   * Show install prompt for Thermer app
   */
  showInstallPrompt() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 m-4 max-w-md">
        <div class="text-center">
          <div class="text-6xl mb-4">📱</div>
          <h3 class="text-lg font-semibold mb-2">Install Thermer App</h3>
          <p class="text-gray-600 mb-4">
            Untuk print thermal receipt, silakan install aplikasi Thermer dari Google Play Store.
          </p>
          <div class="flex gap-2">
            <button 
              onclick="window.open('${this.thermerConfig.playStoreUrl}', '_blank')" 
              class="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Install Thermer
            </button>
            <button 
              onclick="this.parentElement.parentElement.parentElement.remove()" 
              class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Setelah install, refresh halaman dan coba print lagi.
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
      thermerSupported: this.isAndroid,
      methods: this.isAndroid ? ['intent'] : [],
      recommended: this.isAndroid ? 'thermer' : 'web-bluetooth-fallback'
    };
  }
}

export default ThermerIntegration;