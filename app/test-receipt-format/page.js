'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { printReceiptToRawBT } from '@/lib/receipt-rawbt-formatter'

const ReceiptFormattingTest = () => {
  // Sample data seperti di screenshot
  const sampleReceiptData = {
    date: '26/10/2025',
    time: '01.12.01',
    cashierName: 'Admin',
    customerName: 'Customer',
    items: [
      {
        name: 'Item',
        quantity: 1,
        unitPrice: 2,
        subtotal: 2
      }
    ],
    subtotal: 2,
    discount: 0,
    tax: 0,
    total: 0,
    amountPaid: 4,
    change: 0
  }

  const [testResult, setTestResult] = useState('')

  const handleTestFormat = () => {
    // Generate formatted text untuk preview
    const formatCurrency = (amount) => {
      const num = parseFloat(amount) || 0
      return `Rp ${Math.round(num).toLocaleString('id-ID')}`
    }

    let receipt = []
    
    // Header toko
    receipt.push('        HD MOTOPART        ')
    receipt.push('  Jl Maulana hasanudin RT 02 RW 02  ')
    receipt.push('================================')
    receipt.push('')
    
    // Info transaksi
    receipt.push(`Tanggal      : ${sampleReceiptData.date}`)
    receipt.push(`Waktu        : ${sampleReceiptData.time}`)
    receipt.push(`Kasir        : ${sampleReceiptData.cashierName}`)
    
    receipt.push('================================')
    receipt.push('')
    
    // Items
    sampleReceiptData.items.forEach(item => {
      const name = item?.name || 'Item'
      const qty = parseInt(item?.quantity) || 0
      const price = parseFloat(item?.unitPrice) || 0
      const subtotal = parseFloat(item?.subtotal) || 0

      if (qty > 0) {
        // Nama produk
        receipt.push(name)
        // Quantity x harga = subtotal
        const qtyLine = `${qty}x ${formatCurrency(price)}`
        const subtotalLine = formatCurrency(subtotal)
        const priceLine = qtyLine.padEnd(20) + subtotalLine.padStart(12)
        receipt.push(priceLine)
        receipt.push('')
      }
    })
    
    receipt.push('--------------------------------')
    
    // Totals
    receipt.push(`Subtotal     : ${formatCurrency(sampleReceiptData.subtotal)}`)
    receipt.push('--------------------------------')
    receipt.push(`TOTAL        : ${formatCurrency(sampleReceiptData.total)}`)
    receipt.push(`Bayar        : ${formatCurrency(sampleReceiptData.amountPaid)}`)
    receipt.push(`Kembali      : ${formatCurrency(sampleReceiptData.change)}`)
    receipt.push('================================')
    receipt.push('')
    receipt.push('       Terima Kasih!       ')
    receipt.push('   Selamat Berbelanja Kembali   ')
    receipt.push('')
    receipt.push(`      ${new Date().toLocaleString("id-ID", {timeZone: "Asia/Jakarta"})}      `)
    
    setTestResult(receipt.join('\n'))
  }

  const handlePrintToRawBT = () => {
    printReceiptToRawBT(sampleReceiptData)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Receipt Formatting untuk RawBT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleTestFormat}>
              Generate Format Preview
            </Button>
            <Button onClick={handlePrintToRawBT} className="bg-blue-600 hover:bg-blue-700">
              Test Print ke RawBT
            </Button>
          </div>

          {testResult && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Preview Format Yang Akan Dikirim ke RawBT:</h3>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-line border">
                {testResult}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-700">
                  <strong>Format ini akan dikirim ke RawBT:</strong><br/>
                  - Header terpusat dengan padding<br/>
                  - Info transaksi aligned dengan ":"<br/>
                  - Item dengan quantity x harga = subtotal<br/>
                  - Total section dengan separator<br/>
                  - Footer terpusat dengan timestamp
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded">
            <h4 className="font-semibold mb-2">Sample Data Yang Digunakan:</h4>
            <pre className="text-xs text-gray-700">
              {JSON.stringify(sampleReceiptData, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReceiptFormattingTest