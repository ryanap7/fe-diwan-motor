/**
 * Thermal Printer Utility for Web Bluetooth API
 * Supports ESC/POS commands for thermal printers
 * Now with RawBT App Integration for Mobile devices
 */

import RawBTIntegration from './rawbt-integration.js';

export class ThermalPrinter {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;
    
    // Initialize RawBT integration
    this.rawbtIntegration = new RawBTIntegration();
    this.preferRawBT = true; // Default to prefer RawBT on Mobile
    
    // ESC/POS Commands
    this.ESC = '\x1B';
    this.GS = '\x1D';
    this.FS = '\x1C';
    
    this.commands = {
      // Initialization
      INIT: this.ESC + '@',
      
      // Text alignment
      ALIGN_LEFT: this.ESC + 'a' + '\x00',
      ALIGN_CENTER: this.ESC + 'a' + '\x01',
      ALIGN_RIGHT: this.ESC + 'a' + '\x02',
      
      // Text formatting
      BOLD_ON: this.ESC + 'E' + '\x01',
      BOLD_OFF: this.ESC + 'E' + '\x00',
      UNDERLINE_ON: this.ESC + '-' + '\x01',
      UNDERLINE_OFF: this.ESC + '-' + '\x00',
      ITALIC_ON: this.ESC + '4',
      ITALIC_OFF: this.ESC + '5',
      
      // Text size
      SIZE_NORMAL: this.GS + '!' + '\x00',
      SIZE_DOUBLE_WIDTH: this.GS + '!' + '\x10',
      SIZE_DOUBLE_HEIGHT: this.GS + '!' + '\x01',
      SIZE_DOUBLE: this.GS + '!' + '\x11',
      SIZE_TRIPLE: this.GS + '!' + '\x22',
      
      // Paper handling
      LINE_FEED: '\x0A',
      CARRIAGE_RETURN: '\x0D',
      FORM_FEED: '\x0C',
      CUT_PAPER: this.GS + 'V' + '\x41' + '\x10',
      CUT_PAPER_PARTIAL: this.GS + 'V' + '\x42' + '\x10',
      
      // Drawer control
      OPEN_DRAWER: this.ESC + 'p' + '\x00' + '\x19' + '\xFA',
      
      // Sound
      BEEP: this.ESC + 'B' + '\x05' + '\x05',
      
      // QR Code (if supported)
      QR_SIZE: this.GS + '(' + 'k' + '\x03' + '\x00' + '1' + 'C',
      QR_ERROR_CORRECTION: this.GS + '(' + 'k' + '\x03' + '\x00' + '1' + 'E',
      
      // Barcode
      BARCODE_HEIGHT: this.GS + 'h',
      BARCODE_WIDTH: this.GS + 'w',
      BARCODE_POSITION: this.GS + 'H',
      
      // Character encoding
      CHARSET_USA: this.ESC + 'R' + '\x00',
      CHARSET_FRANCE: this.ESC + 'R' + '\x01',
      CHARSET_GERMANY: this.ESC + 'R' + '\x02'
    };
  }

  /**
   * Connect to Bluetooth thermal printer
   */
  async connect(options = {}) {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth tidak didukung di browser ini');
    }

    const defaultOptions = {
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
        { namePrefix: 'MTP' },
        { namePrefix: 'RPP' },
        { namePrefix: 'POS' },
        { namePrefix: 'Thermal' },
        { namePrefix: 'EPSON' },
        { namePrefix: 'Star' },
        { namePrefix: 'Citizen' },
        { namePrefix: 'TSP' }, // Star TSP series
        { namePrefix: 'DPP' }, // Datecs printers
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '00001801-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455' // Microchip data service
      ]
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      // Request device
      this.device = await navigator.bluetooth.requestDevice(requestOptions);
      
      // Connect to GATT server
      this.server = await this.device.gatt.connect();
      
      // Find suitable service and characteristic
      await this.findServiceAndCharacteristic();
      
      this.isConnected = true;
      
      // Setup disconnect listener
      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
      });

      return {
        device: this.device,
        name: this.device.name,
        id: this.device.id
      };

    } catch (error) {
      throw new Error(`Gagal terhubung ke printer: ${error.message}`);
    }
  }

  /**
   * Find suitable service and characteristic for printing
   */
  async findServiceAndCharacteristic() {
    const serviceUUIDs = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '00001801-0000-1000-8000-00805f9b34fb',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455'
    ];

    for (const serviceUUID of serviceUUIDs) {
      try {
        this.service = await this.server.getPrimaryService(serviceUUID);
        const characteristics = await this.service.getCharacteristics();
        
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            return;
          }
        }
      } catch (e) {
        continue;
      }
    }

    throw new Error('Tidak dapat menemukan characteristic yang sesuai');
  }

  /**
   * Disconnect from printer
   */
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
  }

  /**
   * Send raw data to printer
   */
  async sendRaw(data) {
    if (!this.isConnected || !this.characteristic) {
      throw new Error('Printer tidak terhubung');
    }

    try {
      const encoder = new TextEncoder();
      const dataArray = encoder.encode(data);
      
      // Send in chunks to avoid buffer overflow
      const chunkSize = 20;
      for (let i = 0; i < dataArray.length; i += chunkSize) {
        const chunk = dataArray.slice(i, i + chunkSize);
        
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      throw new Error(`Gagal mengirim data: ${error.message}`);
    }
  }

  /**
   * Print text with formatting
   */
  async printText(text, options = {}) {
    const {
      align = 'left',
      bold = false,
      underline = false,
      size = 'normal',
      cut = true,
      feed = 2
    } = options;

    let output = this.commands.INIT;
    
    // Set alignment
    switch (align) {
      case 'center':
        output += this.commands.ALIGN_CENTER;
        break;
      case 'right':
        output += this.commands.ALIGN_RIGHT;
        break;
      default:
        output += this.commands.ALIGN_LEFT;
    }
    
    // Set text formatting
    if (bold) output += this.commands.BOLD_ON;
    if (underline) output += this.commands.UNDERLINE_ON;
    
    // Set text size
    switch (size) {
      case 'double':
        output += this.commands.SIZE_DOUBLE;
        break;
      case 'double-width':
        output += this.commands.SIZE_DOUBLE_WIDTH;
        break;
      case 'double-height':
        output += this.commands.SIZE_DOUBLE_HEIGHT;
        break;
      default:
        output += this.commands.SIZE_NORMAL;
    }
    
    // Add text
    output += text;
    
    // Reset formatting
    if (bold) output += this.commands.BOLD_OFF;
    if (underline) output += this.commands.UNDERLINE_OFF;
    output += this.commands.SIZE_NORMAL;
    
    // Add line feeds
    for (let i = 0; i < feed; i++) {
      output += this.commands.LINE_FEED;
    }
    
    // Cut paper
    if (cut) output += this.commands.CUT_PAPER;
    
    await this.sendRaw(output);
  }

  /**
   * Print image as bitmap
   */
  async printImage(imageFile, options = {}) {
    const {
      maxWidth = 384,
      threshold = 128,
      align = 'center',
      cut = true
    } = options;

    const bitmap = await this.convertImageToBitmap(imageFile, maxWidth, threshold);
    
    let output = this.commands.INIT;
    
    // Set alignment
    switch (align) {
      case 'center':
        output += this.commands.ALIGN_CENTER;
        break;
      case 'right':
        output += this.commands.ALIGN_RIGHT;
        break;
      default:
        output += this.commands.ALIGN_LEFT;
    }
    
    // Add bitmap data using GS v 0 command
    const widthBytes = Math.ceil(bitmap.width / 8);
    const heightBytes = Math.ceil(bitmap.height / 8);
    
    output += this.GS + 'v0';
    output += String.fromCharCode(0); // Normal mode
    output += String.fromCharCode(widthBytes & 0xFF);
    output += String.fromCharCode((widthBytes >> 8) & 0xFF);
    output += String.fromCharCode(heightBytes & 0xFF);
    output += String.fromCharCode((heightBytes >> 8) & 0xFF);
    
    // Add bitmap data
    bitmap.data.forEach(byte => {
      output += String.fromCharCode(byte);
    });
    
    output += this.commands.LINE_FEED + this.commands.LINE_FEED;
    
    if (cut) output += this.commands.CUT_PAPER;
    
    await this.sendRaw(output);
  }

  /**
   * Convert image to monochrome bitmap
   */
  async convertImageToBitmap(imageFile, maxWidth = 384, threshold = 128) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const width = Math.floor(img.width * ratio);
        const height = Math.floor(img.height * ratio);

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Convert to bitmap
        const bitmap = this.convertToMonochrome(imageData, width, height, threshold);
        resolve(bitmap);
      };

      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Convert image data to monochrome bitmap array
   */
  convertToMonochrome(imageData, width, height, threshold = 128) {
    const data = imageData.data;
    const bitmap = [];
    
    for (let y = 0; y < height; y += 8) {
      for (let x = 0; x < width; x++) {
        let byte = 0;
        
        for (let bit = 0; bit < 8; bit++) {
          const pixelY = y + bit;
          if (pixelY >= height) break;
          
          const pixelIndex = (pixelY * width + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          
          // Convert to grayscale
          const gray = (r + g + b) / 3;
          if (gray < threshold) { // Black pixel
            byte |= (1 << (7 - bit));
          }
        }
        
        bitmap.push(byte);
      }
    }
    
    return { data: bitmap, width, height };
  }

  /**
   * Print receipt
   */
  async printReceipt(receiptData) {
    let output = this.commands.INIT;
    
    // Header
    if (receiptData.header) {
      output += this.commands.ALIGN_CENTER;
      output += this.commands.SIZE_DOUBLE;
      output += this.commands.BOLD_ON;
      output += receiptData.header;
      output += this.commands.BOLD_OFF;
      output += this.commands.SIZE_NORMAL;
      output += this.commands.LINE_FEED + this.commands.LINE_FEED;
    }
    
    // Store info
    if (receiptData.store) {
      output += this.commands.ALIGN_CENTER;
      output += receiptData.store;
      output += this.commands.LINE_FEED + this.commands.LINE_FEED;
    }
    
    // Transaction details
    output += this.commands.ALIGN_LEFT;
    output += '================================\n';
    
    if (receiptData.items) {
      receiptData.items.forEach(item => {
        output += `${item.name.padEnd(20)} ${item.price.toString().padStart(10)}\n`;
        if (item.qty > 1) {
          output += `  ${item.qty} x ${item.unitPrice}\n`;
        }
      });
    }
    
    output += '================================\n';
    
    // Totals
    if (receiptData.subtotal) {
      output += `Subtotal:${receiptData.subtotal.toString().padStart(22)}\n`;
    }
    if (receiptData.tax) {
      output += `Pajak:${receiptData.tax.toString().padStart(25)}\n`;
    }
    if (receiptData.total) {
      output += this.commands.BOLD_ON;
      output += `TOTAL:${receiptData.total.toString().padStart(25)}\n`;
      output += this.commands.BOLD_OFF;
    }
    
    output += '================================\n';
    
    // Footer
    output += this.commands.ALIGN_CENTER;
    output += receiptData.footer || 'Terima kasih atas kunjungan Anda';
    output += this.commands.LINE_FEED + this.commands.LINE_FEED;
    
    // Timestamp (Jakarta timezone)
    const jakartaTime = new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"});
    output += jakartaTime;
    output += this.commands.LINE_FEED + this.commands.LINE_FEED;
    
    output += this.commands.CUT_PAPER;
    
    await this.sendRaw(output);
  }

  /**
   * Print QR Code (if supported by printer)
   */
  async printQRCode(text, options = {}) {
    const { size = 6, errorCorrection = 'M' } = options;
    
    let output = this.commands.INIT;
    output += this.commands.ALIGN_CENTER;
    
    // Set QR code size
    output += this.GS + '(' + 'k' + '\x03' + '\x00' + '1' + 'C' + String.fromCharCode(size);
    
    // Set error correction
    const ecLevel = { 'L': 48, 'M': 49, 'Q': 50, 'H': 51 }[errorCorrection] || 49;
    output += this.GS + '(' + 'k' + '\x03' + '\x00' + '1' + 'E' + String.fromCharCode(ecLevel);
    
    // Store QR code data
    const textLength = text.length;
    output += this.GS + '(' + 'k' + String.fromCharCode((textLength + 3) & 0xFF) + String.fromCharCode(((textLength + 3) >> 8) & 0xFF) + '1' + 'P' + '0' + text;
    
    // Print QR code
    output += this.GS + '(' + 'k' + '\x03' + '\x00' + '1' + 'Q' + '0';
    
    output += this.commands.LINE_FEED + this.commands.LINE_FEED;
    
    await this.sendRaw(output);
  }

  /**
   * Open cash drawer
   */
  async openDrawer() {
    await this.sendRaw(this.commands.OPEN_DRAWER);
  }

  /**
   * Beep sound
   */
  async beep(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.sendRaw(this.commands.BEEP);
      if (i < times - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  /**
   * Cut paper
   */
  async cutPaper(partial = false) {
    await this.sendRaw(partial ? this.commands.CUT_PAPER_PARTIAL : this.commands.CUT_PAPER);
  }

  /**
   * Feed paper
   */
  async feedPaper(lines = 1) {
    let output = '';
    for (let i = 0; i < lines; i++) {
      output += this.commands.LINE_FEED;
    }
    await this.sendRaw(output);
  }

  /**
   * Print complete receipt
   */
  async printReceipt(receiptData) {
    try {
      console.log('Thermal printer printReceipt called with:', receiptData);
      
      // Validate and sanitize data
      const safePrint = (value) => {
        try {
          if (value === null || value === undefined) return '';
          if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
          if (typeof value === 'number') return value.toString();
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
        } catch (error) {
          console.error('Error in safePrint:', error, 'for value:', value);
          return '';
        }
      };

      const safeNumber = (value) => {
        try {
          if (value === null || value === undefined || value === '') return 0;
          if (typeof value === 'boolean') return value ? 1 : 0;
          if (typeof value === 'number') return isNaN(value) ? 0 : value;
          if (typeof value === 'string') {
            const cleaned = value.replace(/[^0-9.-]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          }
          const num = parseFloat(value);
          return isNaN(num) ? 0 : num;
        } catch (error) {
          console.error('Error in safeNumber:', error, 'for value:', value);
          return 0;
        }
      };

      let output = this.commands.INIT;

      // Header
      output += this.commands.ALIGN_CENTER + this.commands.BOLD_ON;
      output += 'HD MOTOPART' + '\n';
      output += this.commands.BOLD_OFF;
      output += 'Jl Maulana hasanudin RT 02 RW 02' + '\n';
      output += this.commands.LINE_FEED;

      // Receipt info
      output += this.commands.ALIGN_LEFT;
      output += 'Tanggal: ' + safePrint(receiptData.date || '') + '\n';
      output += 'Waktu: ' + safePrint(receiptData.time || '') + '\n';
      output += 'Kasir: ' + safePrint(receiptData.cashierName || receiptData.userName || 'Admin') + '\n';
      if (receiptData.customerName && receiptData.customerName !== 'Customer') {
        output += 'Customer: ' + safePrint(receiptData.customerName) + '\n';
      }
      output += this.commands.LINE_FEED;

      // Separator
      output += '================================\n';

      // Items
      if (receiptData.items && Array.isArray(receiptData.items)) {
        receiptData.items.forEach(item => {
          try {
            const name = safePrint(item?.name || 'Item');
            const qty = safeNumber(item?.quantity || 0);
            const price = safeNumber(item?.unitPrice || 0);
            const subtotal = safeNumber(item?.subtotal || 0);

            if (name && qty > 0) {
              output += name + '\n';
              output += `${qty} x ${this.formatCurrency(price)} = ${this.formatCurrency(subtotal)}\n`;
            }
          } catch (itemError) {
            console.error('Error processing item:', itemError, item);
            output += 'Item tidak valid\n';
          }
        });
      }

      output += '================================\n';

      // Totals
      try {
        const subtotal = safeNumber(receiptData?.subtotal);
        const discount = safeNumber(receiptData?.discount);
        const tax = safeNumber(receiptData?.tax);
        const total = safeNumber(receiptData?.total);
        const paid = safeNumber(receiptData?.amountPaid);
        const change = safeNumber(receiptData?.change);

        output += `Subtotal: ${this.formatCurrency(subtotal)}\n`;
        if (discount > 0) {
          output += `Diskon: -${this.formatCurrency(discount)}\n`;
        }
        if (tax > 0) {
          output += `Pajak: ${this.formatCurrency(tax)}\n`;
        }
        output += this.commands.BOLD_ON;
        output += `TOTAL: ${this.formatCurrency(total)}\n`;
        output += this.commands.BOLD_OFF;
        output += `Bayar: ${this.formatCurrency(paid)}\n`;
        output += `Kembali: ${this.formatCurrency(change)}\n`;
      } catch (totalsError) {
        console.error('Error processing totals:', totalsError);
        output += 'Error dalam perhitungan total\n';
      }

      output += this.commands.LINE_FEED + this.commands.LINE_FEED;
      output += this.commands.ALIGN_CENTER;
      output += 'Terima Kasih!\n';
      output += 'Selamat Berbelanja Kembali\n';
      output += this.commands.LINE_FEED + this.commands.LINE_FEED;

      // Cut paper
      output += this.commands.CUT_PAPER;

      console.log('Sending to printer:', output);
      await this.sendRaw(output);
      
    } catch (error) {
      console.error('Error in printReceipt:', error);
      throw error;
    }
  }

  /**
   * Format currency for printing
   */
  formatCurrency(amount) {
    try {
      // Ensure we have a valid number
      let num;
      if (amount === null || amount === undefined || amount === '') {
        num = 0;
      } else if (typeof amount === 'string') {
        num = parseFloat(amount.replace(/[^0-9.-]/g, ''));
      } else {
        num = parseFloat(amount);
      }
      
      if (isNaN(num)) {
        num = 0;
      }
      
      return 'Rp ' + Math.round(num).toLocaleString('id-ID');
    } catch (error) {
      console.error('Error formatting currency:', error, 'for amount:', amount);
      return 'Rp 0';
    }
  }

  /**
   * Smart print method that chooses between RawBT and Web Bluetooth
   */
  async smartPrint(receiptData, options = {}) {
    const { 
      forceRawBT = false, 
      forceWebBluetooth = false,
      fallbackToWebBluetooth = true 
    } = options;

    console.log('ThermalPrinter: Starting smart print', { receiptData, options });

    // Force specific method if requested
    if (forceWebBluetooth) {
      return await this.printReceipt(receiptData);
    }

    if (forceRawBT) {
      return await this.rawbtIntegration.print(receiptData);
    }

    // Auto-select best method
    const rawbtStatus = this.rawbtIntegration.getStatus();
    
    if (rawbtStatus.rawbtSupported && this.preferRawBT) {
      try {
        console.log('Attempting RawBT print...');
        const result = await this.rawbtIntegration.print(receiptData);
        
        if (result.success) {
          return {
            success: true,
            method: 'rawbt',
            message: result.message || 'Receipt dikirim ke RawBT app'
          };
        }
      } catch (error) {
        console.warn('RawBT print failed, trying Web Bluetooth fallback:', error);
        
        if (!fallbackToWebBluetooth) {
          throw error;
        }
      }
    }

    // Fallback to Web Bluetooth
    try {
      console.log('Using Web Bluetooth print...');
      await this.printReceipt(receiptData);
      
      return {
        success: true,
        method: 'web-bluetooth',
        message: 'Receipt printed via Web Bluetooth'
      };
    } catch (error) {
      throw new Error(`Semua metode print gagal: ${error.message}`);
    }
  }
}

export default ThermalPrinter;