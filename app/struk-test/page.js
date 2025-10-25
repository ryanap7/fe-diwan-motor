'use client'

import { useEffect } from 'react'
import RawBTPrint from '@/components/RawBTPrint'

const StrukPage = () => {
  // Contoh data struk
  const strukData = {
    storeName: 'HD MOTOPART',
    address: 'Jl Maulana Hasanudin RT 02 RW 02',
    date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    items: [
      { name: 'Oli Mesin Shell', qty: 2, price: 45000 },
      { name: 'Filter Udara', qty: 1, price: 25000 },
      { name: 'Busi NGK', qty: 4, price: 15000 }
    ]
  }

  const calculateTotal = () => {
    return strukData.items.reduce((total, item) => total + (item.qty * item.price), 0)
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* RawBT Print Component */}
      <RawBTPrint />
      
      <h1 className="text-xl font-bold mb-4">Struk Pembelian</h1>
      
      {/* Struk Content */}
      <div id="struk" className="bg-white p-4 border border-gray-300 font-mono text-sm">
        <div className="text-center border-b pb-2 mb-2">
          <div className="font-bold">{strukData.storeName}</div>
          <div>{strukData.address}</div>
          <div>{strukData.date}</div>
        </div>
        
        <div className="border-b pb-2 mb-2">
          {strukData.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div>
                <div>{item.name}</div>
                <div className="text-xs">{item.qty} x Rp {item.price.toLocaleString('id-ID')}</div>
              </div>
              <div>Rp {(item.qty * item.price).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between font-bold">
          <div>TOTAL:</div>
          <div>Rp {calculateTotal().toLocaleString('id-ID')}</div>
        </div>
        
        <div className="text-center mt-2 text-xs">
          Terima kasih atas kunjungan Anda!
        </div>
      </div>
      
      {/* Print Button */}
      <button 
        id="btnPrint"
        className="w-full mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Print ke RawBT
      </button>
      
      {/* Info */}
      <div className="mt-4 p-3 bg-yellow-100 rounded text-sm">
        <strong>Info:</strong> Pastikan aplikasi RawBT sudah terinstall di Android Anda. 
        Tombol "Print ke RawBT" akan mengambil konten dari area struk dan mengirimkannya ke aplikasi RawBT.
      </div>
    </div>
  )
}

export default StrukPage