'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Printer, 
  Smartphone, 
  Bluetooth, 
  CheckCircle, 
  XCircle, 
  Settings,
  Download,
  TestTube
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ThermalPrinter from '@/lib/thermal-printer'

const PrinterSettings = ({ onClose }) => {
  const [thermalPrinter, setThermalPrinter] = useState(null)
  const [printerStatus, setPrinterStatus] = useState(null)
  const [preferThermer, setPreferThermer] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    initializePrinter()
    loadPreferences()
  }, [])

  const initializePrinter = async () => {
    try {
      const printer = new ThermalPrinter()
      setThermalPrinter(printer)
      
      const status = await printer.getStatus()
      setPrinterStatus(status)
    } catch (error) {
      console.error('Error initializing printer:', error)
      toast({
        title: "Error",
        description: "Gagal menginisialisasi printer",
        variant: "destructive"
      })
    }
  }

  const loadPreferences = () => {
    const savedPreference = localStorage.getItem('thermal_printer_prefer_thermer')
    if (savedPreference !== null) {
      setPreferThermer(savedPreference === 'true')
    }
  }

  const handlePreferenceChange = (value) => {
    setPreferThermer(value)
    if (thermalPrinter) {
      thermalPrinter.setPreference(value)
    }
    localStorage.setItem('thermal_printer_prefer_thermer', value.toString())
    
    toast({
      title: "Preferensi Disimpan",
      description: `Sekarang menggunakan ${value ? 'Thermer App' : 'Web Bluetooth'} sebagai prioritas utama`
    })
  }

  const connectWebBluetooth = async () => {
    if (!thermalPrinter) return
    
    setIsLoading(true)
    try {
      await thermalPrinter.connect()
      const status = await thermalPrinter.getStatus()
      setPrinterStatus(status)
      
      toast({
        title: "Koneksi Berhasil",
        description: `Terhubung ke ${thermalPrinter.device?.name || 'printer thermal'}`
      })
    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: "Koneksi Gagal",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testPrinting = async () => {
    if (!thermalPrinter) return
    
    setIsLoading(true)
    try {
      const results = await thermalPrinter.testAllMethods()
      setTestResults(results)
      
      toast({
        title: "Test Selesai",
        description: "Hasil test printing tersedia"
      })
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: "Test Gagal",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSingleReceipt = async () => {
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

      const result = await thermalPrinter.smartPrint(testReceipt)
      
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pengaturan Printer Thermal
              </CardTitle>
              <CardDescription>
                Kelola koneksi dan preferensi printer thermal
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Thermer App
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={printerStatus?.thermer?.thermerSupported ? "default" : "secondary"}>
                    {printerStatus?.thermer?.thermerSupported ? "Didukung" : "Tidak Didukung"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform: {printerStatus?.thermer?.platform || 'Unknown'}
                </p>
                {!printerStatus?.thermer?.thermerSupported && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full" 
                    onClick={openThermerApp}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Install Thermer
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bluetooth className="w-4 h-4" />
                  Web Bluetooth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={printerStatus?.webBluetooth?.supported ? "default" : "secondary"}>
                    {printerStatus?.webBluetooth?.supported ? "Didukung" : "Tidak Didukung"}
                  </Badge>
                  {printerStatus?.webBluetooth?.connected && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Terhubung
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Device: {printerStatus?.webBluetooth?.device || 'Tidak terhubung'}
                </p>
                {printerStatus?.webBluetooth?.supported && !printerStatus?.webBluetooth?.connected && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full" 
                    onClick={connectWebBluetooth}
                    disabled={isLoading}
                  >
                    <Bluetooth className="w-3 h-3 mr-1" />
                    Hubungkan
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preferences */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preferensi Printing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Prioritaskan Thermer App</p>
                  <p className="text-xs text-muted-foreground">
                    Gunakan Thermer sebagai metode utama, fallback ke Web Bluetooth
                  </p>
                </div>
                <Switch 
                  checked={preferThermer}
                  onCheckedChange={handlePreferenceChange}
                  disabled={!printerStatus?.thermer?.thermerSupported}
                />
              </div>
              
              {printerStatus?.recommendation && (
                <Alert className="mt-3">
                  <AlertDescription>
                    <strong>Rekomendasi:</strong> {printerStatus.recommendation === 'thermer' 
                      ? 'Gunakan Thermer App untuk performa terbaik di Android' 
                      : 'Gunakan Web Bluetooth untuk device ini'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Hasil Test Koneksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Thermer App:</span>
                    <Badge variant={testResults.thermer?.success ? "default" : "destructive"}>
                      {testResults.thermer?.success ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Berhasil</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" />Gagal</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Web Bluetooth:</span>
                    <Badge variant={testResults.webBluetooth?.success ? "default" : "destructive"}>
                      {testResults.webBluetooth?.success ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Berhasil</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" />Gagal</>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={testPrinting} 
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Koneksi
            </Button>
            <Button 
              onClick={testSingleReceipt} 
              disabled={isLoading}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Test Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PrinterSettings