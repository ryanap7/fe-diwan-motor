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
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ThermalPrinter from '@/lib/thermal-printer'

const ThermerSettings = ({ onClose }) => {
  const [thermalPrinter, setThermalPrinter] = useState(null)
  const [thermerStatus, setThermerStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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

      const result = await thermalPrinter.smartPrint(testReceipt, { forceThermer: true })
      
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
                <Settings className="w-5 h-5" />
                Thermer Integration
              </CardTitle>
              <CardDescription>
                Pengaturan integrasi dengan aplikasi Thermer
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
                <Smartphone className="w-4 h-4" />
                Status Thermer App
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
                <div className="flex items-center justify-between">
                  <span className="text-sm">Support Thermer:</span>
                  <Badge variant={thermerStatus?.thermerSupported ? "default" : "secondary"}>
                    {thermerStatus?.thermerSupported ? (
                      <><CheckCircle className="w-3 h-3 mr-1" />Didukung</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" />Tidak Didukung</>
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Alert>
            <AlertDescription>
              {thermerStatus?.thermerSupported ? (
                <div>
                  <strong>Thermer App Didukung!</strong><br />
                  Sistem akan otomatis menggunakan Thermer untuk printing jika tersedia, 
                  dengan fallback ke Web Bluetooth jika diperlukan.
                </div>
              ) : (
                <div>
                  <strong>Thermer Tidak Didukung</strong><br />
                  Platform ini tidak mendukung Thermer app. 
                  Sistem akan menggunakan Web Bluetooth untuk printing.
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-2">
            {thermerStatus?.thermerSupported ? (
              <>
                <Button 
                  onClick={testThermerPrint} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Test Print Thermer
                </Button>
                <Button 
                  onClick={openThermerApp} 
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Buka Thermer
                </Button>
              </>
            ) : (
              <Button 
                onClick={openThermerApp} 
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Thermer App
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Cara Kerja:</strong></p>
            <p>• Android: Print via Thermer app → Fallback Web Bluetooth</p>
            <p>• Desktop/iOS: Print via Web Bluetooth langsung</p>
            <p>• Thermer memberikan stabilitas dan fitur lebih</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ThermerSettings