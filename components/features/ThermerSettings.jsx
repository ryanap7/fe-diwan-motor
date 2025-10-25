'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Printer, 
  Smartphone, 
  Bluetooth, 
  CheckCircle, 
  XCircle, 
  Settings,
  Download,
  X,
  Monitor
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ThermalPrinter from '@/lib/thermal-printer'

const ThermerSettings = ({ onClose }) => {
  const [thermalPrinter, setThermalPrinter] = useState(null)
  const [thermerStatus, setThermerStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Platform detection
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  useEffect(() => {
    initializePrinter()
  }, [])

  const initializePrinter = async () => {
    try {
      const printer = new ThermalPrinter()
      setThermalPrinter(printer)
      
      const status = printer.thermerIntegration.getStatus()
      setThermerStatus(status)
    } catch (error) {
      console.error('Error initializing printer:', error)
    }
  }

  const testThermerPrint = async () => {
    if (!thermalPrinter) return
    
    setIsLoading(true)
    try {
      const testReceipt = {
        items: [{
          name: 'Test Print Receipt',
          quantity: 1,
          unitPrice: 5000,
          subtotal: 5000
        }],
        subtotal: 5000,
        total: 5000,
        amountPaid: 10000,
        change: 5000,
        cashierName: 'Test User',
        date: new Date().toLocaleDateString('id-ID'),
        time: new Date().toLocaleTimeString('id-ID')
      }

      // Use appropriate method based on platform
      const result = await thermalPrinter.smartPrint(testReceipt, { 
        forceThermer: isAndroid,
        forceWebBluetooth: !isAndroid
      })
      
      toast({
        title: "Test Print Berhasil",
        description: `Receipt dicetak via ${result.method}`
      })
    } catch (error) {
      console.error('Test print error:', error)
      toast({
        title: "Test Print Gagal",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openThermerApp = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=mate.bluetoothprint'
    window.open(playStoreUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isAndroid ? (
                  <>
                    <Smartphone className="w-5 h-5" />
                    Thermer App (Android)
                  </>
                ) : (
                  <>
                    <Monitor className="w-5 h-5" />
                    Web Bluetooth (Desktop)
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isAndroid 
                  ? "Printing via Thermer app untuk stabilitas maksimal"
                  : "Printing via Web Bluetooth untuk desktop browser"
                }
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {isAndroid ? (
                  <>
                    <Smartphone className="w-4 h-4" />
                    Status Thermer App
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4" />
                    Status Web Bluetooth
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Platform:</span>
                  <Badge variant="outline">
                    {thermerStatus?.platform || 'Unknown'}
                  </Badge>
                </div>
                {isAndroid ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Thermer Ready:</span>
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Siap Digunakan
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Web Bluetooth:</span>
                    <Badge variant={navigator.bluetooth ? "default" : "secondary"}>
                      {navigator.bluetooth ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Didukung</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" />Tidak Didukung</>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Alert>
            <AlertDescription>
              {isAndroid ? (
                <div>
                  <strong>Mode Android - Thermer Intent</strong><br />
                  Sistem akan menggunakan Thermer app untuk printing. Pastikan Thermer sudah terinstall untuk hasil terbaik.
                </div>
              ) : (
                <div>
                  <strong>Mode Desktop - Web Bluetooth</strong><br />
                  Sistem menggunakan Web Bluetooth langsung. Pastikan browser mendukung dan printer dalam mode pairing.
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-2">
            {isAndroid ? (
              <>
                <Button 
                  onClick={testThermerPrint} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Test Thermer Intent
                </Button>
                <Button 
                  onClick={openThermerApp} 
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install/Buka Thermer
                </Button>
              </>
            ) : (
              <Button 
                onClick={testThermerPrint} 
                disabled={isLoading}
                className="w-full"
              >
                <Bluetooth className="w-4 h-4 mr-2" />
                Test Web Bluetooth
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Cara Kerja:</strong></p>
            {isAndroid ? (
              <>
                <p>• Sistem prioritas Thermer Intent untuk Android</p>
                <p>• Install Thermer app dari Play Store</p>
                <p>• Print otomatis via Thermer tanpa setup printer</p>
                <p>• Lebih stabil dan fitur lengkap</p>
              </>
            ) : (
              <>
                <p>• Sistem Web Bluetooth untuk desktop</p>
                <p>• Pair printer manual via Bluetooth settings</p>
                <p>• Klik tombol print → pilih printer</p>
                <p>• Cocok untuk Chrome/Edge desktop</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ThermerSettings