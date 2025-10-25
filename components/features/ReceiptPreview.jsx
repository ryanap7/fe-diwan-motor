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
  Smartphone
} from "lucide-react"
import { printStrukToRawBT } from '@/hooks/useRawBTPrint'

const ReceiptPreview = ({ receiptData, onClose, onPrint }) => {
  const formatCurrency = (amount) => {
    try {
      const num = parseFloat(amount) || 0;
      return 'Rp ' + Math.round(num).toLocaleString('id-ID');
    } catch (error) {
      return 'Rp 0';
    }
  }

  // Fungsi untuk print langsung ke RawBT
  const handlePrintToRawBT = () => {
    const success = printStrukToRawBT('strukPreview', {
      showAlert: true,
      autoInstallPrompt: true,
      fallbackDelay: 2000
    });

    if (success) {
      // Tutup modal setelah print
      onClose();
      
      // Panggil onPrint callback jika ada (untuk update status, dll)
      if (onPrint) {
        onPrint();
      }
    }
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-2" />
              Batal
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
        </CardContent>
      </Card>
    </div>
  )
}

export default ReceiptPreview