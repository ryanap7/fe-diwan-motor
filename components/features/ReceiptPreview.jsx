'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Printer, 
  Eye, 
  X,
  Receipt,
  Smartphone,
  Download,
  Camera
} from "lucide-react"
import { printReceiptToRawBT } from '@/lib/receipt-rawbt-formatter'
import { saveReceipt } from '@/lib/receipt-saver'

const ReceiptPreview = ({ receiptData, onClose, onPrint }) => {
  const formatCurrency = (amount) => {
    try {
      const num = parseFloat(amount) || 0;
      return 'Rp ' + Math.round(num).toLocaleString('id-ID');
    } catch (error) {
      return 'Rp 0';
    }
  }

  // Fungsi untuk print langsung ke RawBT dengan format yang benar
  const handlePrintToRawBT = () => {
    const success = printReceiptToRawBT(receiptData);

    if (success) {
      // Tutup modal setelah print
      onClose();
      
      // Panggil onPrint callback jika ada (untuk update status, dll)
      if (onPrint) {
        onPrint();
      }
    }
  }

  // Fungsi untuk save struk sebagai gambar menggunakan Canvas native
  const handleSaveAsImage = async () => {
    try {
      const receiptElement = document.getElementById('strukPreview');
      if (!receiptElement) {
        alert('Element struk tidak ditemukan!');
        return;
      }

      // Generate gambar dengan canvas
      await generateReceiptImage(receiptElement, receiptData);

    } catch (error) {
      console.error('Error saving receipt as image:', error);
      alert('Gagal menyimpan gambar: ' + error.message);
    }
  }

  // Generate receipt sebagai gambar menggunakan Canvas API
  const generateReceiptImage = async (element, data) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size untuk thermal receipt (58mm width standard)
    const width = 400; // pixel width untuk thermal receipt
    const padding = 20;
    
    // Calculate height berdasarkan content
    let height = padding * 2;
    const lineHeight = 20;
    const headerHeight = 60;
    
    // Estimate height berdasarkan content
    const itemCount = (data.items && Array.isArray(data.items)) ? data.items.length : 0;
    height = headerHeight + (itemCount * lineHeight * 2) + (lineHeight * 15); // rough calculation
    
    canvas.width = width;
    canvas.height = height;
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Set text properties
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    
    let currentY = padding + 20;
    
    // Header
    ctx.font = 'bold 18px Arial';
    ctx.fillText('HD MOTOPART', width/2, currentY);
    currentY += 25;
    
    ctx.font = '12px Arial';
    ctx.fillText('Jl Maulana hasanudin RT 02 RW 02', width/2, currentY);
    currentY += 30;
    
    // Separator line
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(width - padding, currentY);
    ctx.stroke();
    currentY += 20;
    
    // Transaction info
    ctx.textAlign = 'left';
    ctx.font = '11px Arial';
    
    const info = [
      `Tanggal: ${data.date || new Date().toLocaleDateString('id-ID')}`,
      `Waktu: ${data.time || new Date().toLocaleTimeString('id-ID')}`,
      `Kasir: ${data.cashierName || data.userName || 'Admin'}`
    ];
    
    if (data.customerName && data.customerName !== 'Customer') {
      info.push(`Customer: ${data.customerName}`);
    }
    
    info.forEach(line => {
      ctx.fillText(line, padding, currentY);
      currentY += lineHeight;
    });
    
    currentY += 10;
    
    // Separator line
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(width - padding, currentY);
    ctx.stroke();
    currentY += 20;
    
    // Items
    if (data.items && Array.isArray(data.items)) {
      ctx.font = '11px Arial';
      
      data.items.forEach(item => {
        const qty = parseInt(item?.quantity) || 0;
        if (qty > 0) {
          // Item name
          ctx.fillText(item.name || 'Item', padding, currentY);
          currentY += lineHeight;
          
          // Quantity and price
          const qtyText = `${qty}x ${formatCurrency(item.unitPrice || 0)}`;
          const subtotalText = formatCurrency(item.subtotal || 0);
          
          ctx.fillText(qtyText, padding, currentY);
          ctx.textAlign = 'right';
          ctx.fillText(subtotalText, width - padding, currentY);
          ctx.textAlign = 'left';
          currentY += lineHeight + 5;
        }
      });
    }
    
    // Separator line
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(width - padding, currentY);
    ctx.stroke();
    currentY += 20;
    
    // Totals
    const totals = [
      [`Subtotal: `, formatCurrency(data.subtotal || 0)]
    ];
    
    if (parseFloat(data.discount || 0) > 0) {
      totals.push([`Diskon: `, `-${formatCurrency(data.discount)}`]);
    }
    
    if (parseFloat(data.tax || 0) > 0) {
      totals.push([`Pajak: `, formatCurrency(data.tax)]);
    }
    
    totals.push([`TOTAL: `, formatCurrency(data.total || 0)]);
    totals.push([`Bayar: `, formatCurrency(data.amountPaid || 0)]);
    totals.push([`Kembali: `, formatCurrency(data.change || 0)]);
    
    totals.forEach(([label, value], index) => {
      if (index === totals.length - 3) { // TOTAL line
        ctx.font = 'bold 12px Arial';
      } else {
        ctx.font = '11px Arial';
      }
      
      ctx.fillText(label, padding, currentY);
      ctx.textAlign = 'right';
      ctx.fillText(value, width - padding, currentY);
      ctx.textAlign = 'left';
      currentY += lineHeight;
    });
    
    currentY += 10;
    
    // Footer
    ctx.textAlign = 'center';
    ctx.font = '11px Arial';
    ctx.fillText('Terima Kasih!', width/2, currentY);
    currentY += lineHeight;
    ctx.fillText('Selamat Berbelanja Kembali', width/2, currentY);
    currentY += lineHeight + 10;
    
    ctx.font = '10px Arial';
    ctx.fillText(new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"}), width/2, currentY);
    
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Gagal membuat gambar!');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `struk-${data.invoiceNo || 'receipt'}-${new Date().toISOString().slice(0, 10)}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert('Struk berhasil disimpan sebagai gambar!');
    }, 'image/png', 1.0);
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview Struk
              </CardTitle>
              <CardDescription>
                Preview sebelum print ke RawBT
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Receipt Preview - Tambahkan ID untuk RawBT */}
          <div id="strukPreview" className="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-sm">
            {/* Header */}
            <div className="text-center font-bold text-lg mb-2">
              HD MOTOPART
            </div>
            <div className="text-center text-xs mb-4">
              Jl Maulana hasanudin RT 02 RW 02
            </div>
            
            <div className="border-t border-b border-gray-400 py-2 my-2 text-xs">
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{receiptData.date || new Date().toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{receiptData.time || new Date().toLocaleTimeString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{receiptData.cashierName || receiptData.userName || 'Admin'}</span>
              </div>
              {receiptData.customerName && receiptData.customerName !== 'Customer' && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{receiptData.customerName}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1 text-xs mb-2">
              {receiptData.items && Array.isArray(receiptData.items) && receiptData.items.map((item, index) => {
                const name = item?.name || 'Item';
                const qty = parseInt(item?.quantity) || 0;
                const price = parseFloat(item?.unitPrice) || 0;
                const subtotal = parseFloat(item?.subtotal) || 0;

                return qty > 0 && (
                  <div key={index}>
                    <div className="font-medium">{name}</div>
                    <div className="flex justify-between text-gray-600">
                      <span>{qty} x {formatCurrency(price)}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-400 pt-2 space-y-1 text-xs">
              {/* Totals */}
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(receiptData?.subtotal || 0)}</span>
              </div>
              
              {parseFloat(receiptData?.discount || 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon:</span>
                  <span>-{formatCurrency(receiptData.discount)}</span>
                </div>
              )}
              
              {parseFloat(receiptData?.tax || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Pajak:</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(receiptData?.total || 0)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Bayar:</span>
                <span>{formatCurrency(receiptData?.amountPaid || 0)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Kembali:</span>
                <span>{formatCurrency(receiptData?.change || 0)}</span>
              </div>
            </div>

            <div className="border-t border-gray-400 mt-2 pt-2 text-center text-xs">
              <div className="font-medium">Terima Kasih!</div>
              <div>Selamat Berbelanja Kembali</div>
              <div className="mt-2 text-gray-500">
                {new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"})}
              </div>
            </div>
          </div>

          {/* Mobile info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">Mobile Printing</span>
            </div>
            <p className="text-xs text-blue-600">
              Struk akan dikirim ke aplikasi RawBT untuk print via Bluetooth thermal printer. 
              Pastikan RawBT sudah terhubung dengan printer.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Top row - Save and Print buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-green-500 text-green-600 hover:bg-green-50" 
                onClick={handleSaveAsImage}
              >
                <Download className="w-4 h-4 mr-2" />
                Simpan Struk
              </Button>
              <Button 
                id="btnPrint"
                className="flex-1 bg-blue-600 hover:bg-blue-700" 
                onClick={handlePrintToRawBT}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print via RawBT
              </Button>
            </div>
            
            {/* Bottom row - Cancel button */}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReceiptPreview