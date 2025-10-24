'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const CashierStatusNotification = ({ 
  productsLoaded = false, 
  printerConnected = false,
  userRole = '',
  onDismiss = () => {} 
}) => {
  const [visible, setVisible] = useState(false);
  const [loginTime, setLoginTime] = useState(null);

  useEffect(() => {
    // Show notification only for cashiers on fresh login
    const isCashier = userRole === 'CASHIER' || userRole === 'KASIR' || userRole === 'cashier';
    const cashierLoginTime = localStorage.getItem('cashierLoginTime');
    
    if (isCashier && cashierLoginTime) {
      const timeSinceLogin = Date.now() - parseInt(cashierLoginTime);
      // Show notification if logged in within last 30 seconds
      if (timeSinceLogin < 30000) {
        setVisible(true);
        setLoginTime(new Date(parseInt(cashierLoginTime)));
        
        // Auto-hide after 10 seconds
        const timer = setTimeout(() => {
          handleDismiss();
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [userRole]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.removeItem('cashierLoginTime'); // Clean up
    onDismiss();
  };

  if (!visible) return null;

  const allReady = productsLoaded && printerConnected;

  return (
    <div className="fixed top-20 right-4 z-50 w-80 animate-in slide-in-from-right-full duration-300">
      <Alert className={`border-2 shadow-lg ${
        allReady 
          ? 'border-green-200 bg-green-50' 
          : 'border-yellow-200 bg-yellow-50'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {allReady ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          
          <div className="flex-1">
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className={`font-semibold ${allReady ? 'text-green-900' : 'text-yellow-900'}`}>
                    {allReady ? '✅ Sistem POS Siap!' : '⏳ Menyiapkan Sistem POS...'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Login pada: {loginTime?.toLocaleTimeString('id-ID')}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Produk</span>
                    <Badge variant={productsLoaded ? 'default' : 'secondary'} className="text-xs">
                      {productsLoaded ? 'Siap' : 'Loading...'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <Printer className="w-3 h-3" />
                      Printer
                    </span>
                    <Badge variant={printerConnected ? 'default' : 'outline'} className="text-xs">
                      {printerConnected ? 'Terhubung' : 'Belum'}
                    </Badge>
                  </div>
                </div>

                {!printerConnected && productsLoaded && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-800">
                      💡 Klik tombol Bluetooth untuk menghubungkan printer thermal
                    </p>
                  </div>
                )}

                <button 
                  onClick={handleDismiss}
                  className="w-full text-xs text-center py-1 px-2 rounded bg-white border hover:bg-gray-50 transition-colors"
                >
                  Tutup Notifikasi
                </button>
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default CashierStatusNotification;