'use client';

import { Loader2, CreditCard, ShoppingCart, Store } from 'lucide-react';

const CashierLoadingScreen = ({ message = "Memuat POS Kasir..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="text-center max-w-md mx-auto p-6">
        {/* Animated Icons */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 shadow-lg">
            <CreditCard className="w-10 h-10 text-white animate-pulse" />
          </div>
          
          {/* Floating icons animation */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
            <Store className="w-4 h-4 text-green-600" />
          </div>
        </div>

        {/* Loading spinner */}
        <div className="mb-4">
          <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
        </div>

        {/* Loading text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          POS Kasir
        </h2>
        <p className="text-gray-600 mb-4">
          {message}
        </p>

        {/* Progress steps */}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Memuat data produk...</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span>Menyiapkan keranjang belanja...</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span>Menghubungkan printer...</span>
          </div>
        </div>

        {/* Tips for cashier */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-2">💡 Tips Kasir:</h3>
          <ul className="text-xs text-green-700 space-y-1 text-left">
            <li>• Gunakan pencarian untuk menemukan produk dengan cepat</li>
            <li>• Klik tombol Bluetooth untuk menghubungkan printer</li>
            <li>• Pastikan printer thermal sudah menyala</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CashierLoadingScreen;