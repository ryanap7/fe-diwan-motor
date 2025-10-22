'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bluetooth, Printer, Image as ImageIcon, Wifi, AlertCircle, QrCode, Receipt, Scissors, Volume2 } from 'lucide-react';
import ThermalPrinter from '@/lib/thermal-printer';

export default function PrinterTestPage() {
  const [printer, setPrinter] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [textToPrint, setTextToPrint] = useState('Hello World!\nTest Print dari POS System');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [qrText, setQrText] = useState('https://example.com');
  const [textAlign, setTextAlign] = useState('left');
  const [textSize, setTextSize] = useState('normal');
  const [isBold, setIsBold] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const fileInputRef = useRef(null);

  // Receipt sample data
  const sampleReceipt = {
    header: 'TOKO ABC',
    store: 'Jl. Contoh No. 123\nTelp: 021-1234567',
    items: [
      { name: 'Oli Motor', qty: 2, unitPrice: 25000, price: 50000 },
      { name: 'Busi NGK', qty: 1, unitPrice: 35000, price: 35000 },
      { name: 'Filter Udara', qty: 1, unitPrice: 45000, price: 45000 }
    ],
    subtotal: 130000,
    tax: 13000,
    total: 143000,
    footer: 'Terima kasih telah berbelanja'
  };

  // Connect ke Bluetooth thermal printer
  const connectToPrinter = async () => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge versi terbaru.');
      return;
    }

    setIsConnecting(true);
    setError('');
    setStatus('Mencari printer Bluetooth...');

    try {
      const thermalPrinter = new ThermalPrinter();
      const deviceInfo = await thermalPrinter.connect();
      
      setPrinter(thermalPrinter);
      setIsConnected(true);
      setStatus('Terhubung ke: ' + deviceInfo.name);
      
      // Listen for disconnect
      thermalPrinter.device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setPrinter(null);
        setStatus('Printer terputus');
      });

    } catch (error) {
      console.error('Bluetooth connection error:', error);
      setError('Gagal terhubung ke printer: ' + error.message);
      setStatus('');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect printer
  const disconnectPrinter = () => {
    if (printer) {
      printer.disconnect();
    }
    setPrinter(null);
    setIsConnected(false);
    setStatus('Printer terputus');
  };

  // Print text with formatting
  const handlePrintText = async () => {
    if (!textToPrint.trim()) {
      setError('Masukkan text yang akan dicetak');
      return;
    }

    try {
      setStatus('Mencetak text...');
      setError('');

      await printer.printText(textToPrint, {
        align: textAlign,
        bold: isBold,
        underline: isUnderline,
        size: textSize,
        cut: true,
        feed: 3
      });

      setStatus('Text berhasil dicetak!');
      
    } catch (error) {
      setError(error.message);
      setStatus('');
    }
  };

  // Print image
  const handlePrintImage = async () => {
    if (!selectedImage) {
      setError('Pilih gambar yang akan dicetak');
      return;
    }

    try {
      setStatus('Memproses dan mencetak gambar...');
      setError('');

      await printer.printImage(selectedImage, {
        maxWidth: 384,
        threshold: 128,
        align: 'center',
        cut: true
      });

      setStatus('Gambar berhasil dicetak!');
      
    } catch (error) {
      setError(error.message);
      setStatus('');
    }
  };

  // Print QR Code
  const handlePrintQR = async () => {
    if (!qrText.trim()) {
      setError('Masukkan text untuk QR Code');
      return;
    }

    try {
      setStatus('Mencetak QR Code...');
      setError('');

      await printer.printQRCode(qrText, {
        size: 6,
        errorCorrection: 'M'
      });

      setStatus('QR Code berhasil dicetak!');
      
    } catch (error) {
      setError(error.message);
      setStatus('');
    }
  };

  // Print sample receipt
  const handlePrintReceipt = async () => {
    try {
      setStatus('Mencetak contoh struk...');
      setError('');

      await printer.printReceipt(sampleReceipt);

      setStatus('Struk berhasil dicetak!');
      
    } catch (error) {
      setError(error.message);
      setStatus('');
    }
  };

  // Cut paper
  const handleCutPaper = async () => {
    try {
      await printer.cutPaper();
      setStatus('Kertas dipotong');
    } catch (error) {
      setError(error.message);
    }
  };

  // Open drawer
  const handleOpenDrawer = async () => {
    try {
      await printer.openDrawer();
      setStatus('Cash drawer dibuka');
    } catch (error) {
      setError(error.message);
    }
  };

  // Beep sound
  const handleBeep = async () => {
    try {
      await printer.beep(3);
      setStatus('Beep sound diputar');
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            <Printer className="w-8 h-8 text-blue-600" />
            Bluetooth Thermal Printer Test
          </h1>
          <p className="mt-2 text-gray-600">
            Test koneksi dan print ke thermal printer via Bluetooth
          </p>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bluetooth className="w-5 h-5" />
              Status Koneksi
            </CardTitle>
            <CardDescription>
              Hubungkan thermal printer Bluetooth untuk mulai test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">
                  {isConnected ? `Terhubung: ${printer?.device?.name}` : 'Tidak terhubung'}
                </span>
              </div>
              
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button 
                    onClick={connectToPrinter} 
                    disabled={isConnecting}
                    className="flex items-center gap-2"
                  >
                    <Bluetooth className="w-4 h-4" />
                    {isConnecting ? 'Menghubungkan...' : 'Hubungkan Printer'}
                  </Button>
                ) : (
                  <Button 
                    onClick={disconnectPrinter}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Wifi className="w-4 h-4" />
                    Putuskan Koneksi
                  </Button>
                )}
              </div>
            </div>

            {status && (
              <Alert className="mt-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
          {/* Text Printing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Print Text
              </CardTitle>
              <CardDescription>
                Cetak text dengan formatting custom
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="printText">Text yang akan dicetak:</Label>
                <Textarea
                  id="printText"
                  value={textToPrint}
                  onChange={(e) => setTextToPrint(e.target.value)}
                  placeholder="Masukkan text yang ingin dicetak..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              
              {/* Text Formatting */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Alignment:</Label>
                  <Select value={textAlign} onValueChange={setTextAlign}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Kiri</SelectItem>
                      <SelectItem value="center">Tengah</SelectItem>
                      <SelectItem value="right">Kanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Size:</Label>
                  <Select value={textSize} onValueChange={setTextSize}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="double-width">Lebar 2x</SelectItem>
                      <SelectItem value="double-height">Tinggi 2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isBold}
                    onChange={(e) => setIsBold(e.target.checked)}
                  />
                  <span>Bold</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isUnderline}
                    onChange={(e) => setIsUnderline(e.target.checked)}
                  />
                  <span>Underline</span>
                </label>
              </div>
              
              <Button 
                onClick={handlePrintText} 
                disabled={!isConnected}
                className="w-full"
              >
                Print Text
              </Button>
            </CardContent>
          </Card>

          {/* Image Printing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Print Gambar
              </CardTitle>
              <CardDescription>
                Cetak gambar/logo ke thermal printer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imageFile">Pilih gambar:</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  className="mt-1"
                />
              </div>

              {imagePreview && (
                <div className="text-center">
                  <p className="mb-2 text-sm text-gray-600">Preview:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full mx-auto border rounded max-h-32"
                  />
                </div>
              )}

              <Button 
                onClick={handlePrintImage}
                disabled={!isConnected || !selectedImage}
                className="w-full"
              >
                Print Gambar
              </Button>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Print QR Code
              </CardTitle>
              <CardDescription>
                Generate dan cetak QR Code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="qrText">Text/URL untuk QR Code:</Label>
                <Textarea
                  id="qrText"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="https://example.com atau text lainnya"
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={handlePrintQR}
                disabled={!isConnected}
                className="w-full"
              >
                Print QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Receipt Sample */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Print Struk
              </CardTitle>
              <CardDescription>
                Cetak contoh struk penjualan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 text-xs border rounded bg-gray-50">
                <div className="font-semibold text-center">TOKO ABC</div>
                <div className="text-center">Jl. Contoh No. 123</div>
                <div>--------------------------------</div>
                <div>Oli Motor      x2    50,000</div>
                <div>Busi NGK       x1    35,000</div>
                <div>Filter Udara   x1    45,000</div>
                <div>--------------------------------</div>
                <div>Total:              143,000</div>
                <div className="text-center">Terima kasih</div>
              </div>

              <Button 
                onClick={handlePrintReceipt}
                disabled={!isConnected}
                className="w-full"
              >
                Print Contoh Struk
              </Button>
            </CardContent>
          </Card>

          {/* Printer Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Kontrol Printer
              </CardTitle>
              <CardDescription>
                Fungsi kontrol tambahan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleCutPaper}
                disabled={!isConnected}
                variant="outline"
                className="w-full"
              >
                <Scissors className="w-4 h-4 mr-2" />
                Potong Kertas
              </Button>

              <Button 
                onClick={handleOpenDrawer}
                disabled={!isConnected}
                variant="outline"
                className="w-full"
              >
                💰 Buka Cash Drawer
              </Button>

              <Button 
                onClick={handleBeep}
                disabled={!isConnected}
                variant="outline"
                className="w-full"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test Beep
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Petunjuk Penggunaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>1. Persiapan:</strong></p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Pastikan thermal printer Bluetooth sudah dalam mode pairing</li>
                <li>Gunakan browser Chrome/Edge yang mendukung Web Bluetooth API</li>
                <li>Pastikan Bluetooth device aktif</li>
              </ul>
              
              <p><strong>2. Koneksi:</strong></p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Klik tombol "Hubungkan Printer"</li>
                <li>Pilih printer dari daftar device yang muncul</li>
                <li>Tunggu hingga status menunjukkan "Terhubung"</li>
              </ul>

              <p><strong>3. Print Test:</strong></p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Untuk text: Masukkan text dan klik "Print Text"</li>
                <li>Untuk gambar: Upload gambar dan klik "Print Gambar"</li>
                <li>Gambar akan otomatis dikonversi ke format monochrome bitmap</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}