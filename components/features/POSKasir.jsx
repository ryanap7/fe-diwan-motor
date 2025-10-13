'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Minus, ShoppingCart, User, CreditCard, Banknote, Trash2, Check, Receipt } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

// Sample data berdasarkan API yang Anda berikan
const SAMPLE_PRODUCTS = [
  {
    id: "632e1250-019a-4c23-8eb7-ae4dbff32226",
    sku: "GASKET-YAM-001",
    name: "Gasket Set Full Engine Yamaha Mio",
    category: "Mesin",
    brand: "Yamaha",
    price: 125000,
    wholesale_price: 105000,
    stock: 15,
    uom: "Pcs",
    compatible_models: "Mio",
    image: null
  },
  {
    id: "8c8f22b5-d8a9-4b61-b5c9-d66080e3eddf",
    sku: "HANDLE-CNC-001",
    name: "Handle Rem Racing CNC Adjustable",
    category: "Sistem Rem",
    brand: "Universal",
    price: 185000,
    wholesale_price: 155000,
    stock: 8,
    uom: "Pcs",
    compatible_models: "Universal"
  },
  {
    id: "e53e5c08-daa9-46a6-ba09-d9ecb04f05ce",
    sku: "PISTON-HON-001",
    name: "Piston Kit Honda Supra X 125 (54mm)",
    category: "Mesin",
    brand: "Honda",
    price: 245000,
    wholesale_price: 205000,
    stock: 10,
    uom: "Pcs",
    compatible_models: "Supra X 125"
  },
  {
    id: "55082a9d-3234-4d83-af09-f5766d31408c",
    sku: "KABEL-HON-001",
    name: "Kabel Gas Honda Beat Original",
    category: "Sistem Kontrol",
    brand: "Honda",
    price: 65000,
    wholesale_price: 55000,
    stock: 25,
    uom: "Pcs",
    compatible_models: "Beat"
  },
  {
    id: "e9e1d855-98f7-4bef-b17e-3ed93feb415b",
    sku: "WIND-UNI-001",
    name: "Windshield Touring Tinggi Universal",
    category: "Body & Fairing",
    brand: "Universal",
    price: 245000,
    wholesale_price: 205000,
    stock: 12,
    uom: "Pcs",
    compatible_models: "Universal"
  },
  {
    id: "bd0b4bbf-8cf4-454f-acb3-6505a030ac89",
    sku: "SPION-HON-001",
    name: "Spion Kiri Kanan Set Honda Beat",
    category: "Body & Fairing",
    brand: "Honda",
    price: 95000,
    wholesale_price: 80000,
    stock: 20,
    uom: "Pcs",
    compatible_models: "Beat, Scoopy"
  },
  {
    id: "996a114c-7ac0-4aab-ab4d-3775ae75254c",
    sku: "OLI-MOTUL-001",
    name: "Oli Mesin Motul 7100 10W-40 1L",
    category: "Oli & Pelumas",
    brand: "Motul",
    price: 135000,
    wholesale_price: 115000,
    stock: 30,
    uom: "Pcs",
    compatible_models: "All Model"
  },
  {
    id: "5386a007-a4cd-429a-8281-331df15e5062",
    sku: "VELG-001",
    name: "Velg Racing Aluminium 17 inch",
    category: "Ban & Velg",
    brand: "Universal",
    price: 1200000,
    wholesale_price: 1000000,
    stock: 5,
    uom: "Pcs",
    compatible_models: "Universal"
  },
  {
    id: "34678d2a-9fd9-4ef7-8bc7-4b85ae156915",
    sku: "BAN-IRC-001", 
    name: "Ban Motor IRC NF-67 80/90-14 Tubeless",
    category: "Ban & Velg",
    brand: "IRC",
    price: 175000,
    wholesale_price: 150000,
    stock: 18,
    uom: "Pcs",
    compatible_models: "Vario, Beat, Scoopy"
  },
  {
    id: "bd061479-ddcb-4f0a-a656-b981571fefdc",
    sku: "AKI-GS-001",
    name: "Aki Motor GS Astra GTZ5S 12V 4Ah", 
    category: "Kelistrikan",
    brand: "GS Astra",
    price: 265000,
    wholesale_price: 225000,
    stock: 12,
    uom: "Pcs",
    compatible_models: "Vario, Beat, Mio"
  }
]

export default function POSKasir() {
  const [currentStep, setCurrentStep] = useState(1) // 1: Select Items, 2: Customer Info, 3: Payment
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cartItems, setCartItems] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    type: 'walk-in' // walk-in or registered
  })
  const [paymentMethod, setPaymentMethod] = useState('cash') // cash or edc
  const [paymentAmount, setPaymentAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [priceType, setPriceType] = useState('normal') // normal or wholesale

  // Filter products
  const filteredProducts = useMemo(() => {
    return SAMPLE_PRODUCTS.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.compatible_models.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      return matchesSearch && matchesCategory && product.stock > 0
    })
  }, [searchTerm, selectedCategory])

  // Get categories
  const categories = useMemo(() => {
    const cats = [...new Set(SAMPLE_PRODUCTS.map(p => p.category))]
    return cats.sort()
  }, [])

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = priceType === 'wholesale' ? item.product.wholesale_price : item.product.price
      return sum + (price * item.quantity)
    }, 0)
    
    const discount = 0 // Could be calculated based on business rules
    const tax = 0 // Could be calculated based on tax rate
    const total = subtotal - discount + tax
    
    return { subtotal, discount, tax, total }
  }, [cartItems, priceType])

  // Add item to cart
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCartItems(cartItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      } else {
        toast({
          title: "Stok Tidak Mencukupi",
          description: "Kuantitas melebihi stok yang tersedia",
          variant: "destructive"
        })
      }
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }])
    }
  }

  // Update cart item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
      return
    }
    
    const item = cartItems.find(item => item.product.id === productId)
    if (item && newQuantity <= item.product.stock) {
      setCartItems(cartItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ))
    } else {
      toast({
        title: "Stok Tidak Mencukupi",
        description: "Kuantitas melebihi stok yang tersedia",
        variant: "destructive"
      })
    }
  }

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId))
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    setCustomerInfo({ name: '', phone: '', type: 'walk-in' })
    setPaymentAmount('')
    setNotes('')
    setCurrentStep(1)
  }

  // Process payment
  const processPayment = () => {
    if (paymentMethod === 'cash') {
      const amount = parseFloat(paymentAmount)
      if (amount < calculations.total) {
        toast({
          title: "Jumlah Pembayaran Kurang",
          description: "Jumlah pembayaran harus minimal sama dengan total",
          variant: "destructive"
        })
        return
      }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    
    // Simulate transaction processing
    const transaction = {
      invoice_number: invoiceNumber,
      items: cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: priceType === 'wholesale' ? item.product.wholesale_price : item.product.price,
        subtotal: (priceType === 'wholesale' ? item.product.wholesale_price : item.product.price) * item.quantity
      })),
      customer_name: customerInfo.name || 'Walk-in Customer',
      customer_phone: customerInfo.phone,
      subtotal: calculations.subtotal,
      discount: calculations.discount,
      tax: calculations.tax,
      total: calculations.total,
      payment_method: paymentMethod,
      payment_amount: parseFloat(paymentAmount),
      change_amount: paymentMethod === 'cash' ? (parseFloat(paymentAmount) - calculations.total) : 0,
      notes: notes,
      transaction_date: new Date().toISOString()
    }

    console.log('Transaction processed:', transaction)
    
    toast({
      title: "Transaksi Berhasil",
      description: `Invoice: ${invoiceNumber}`,
    })

    // Reset form
    clearCart()
    setShowPaymentDialog(false)
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Point of Sale (POS)</h1>
        <p className="text-gray-600 mt-1">Sistem kasir untuk transaksi penjualan</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          {[
            { step: 1, title: "Pilih Barang", icon: ShoppingCart },
            { step: 2, title: "Info Customer", icon: User },
            { step: 3, title: "Pembayaran", icon: CreditCard }
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-gray-300 text-gray-300'
              }`}>
                {currentStep > step ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`ml-2 font-medium ${
                currentStep >= step ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {title}
              </span>
              {step < 3 && <div className="w-12 h-px bg-gray-300 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari produk (nama, SKU, atau model)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priceType} onValueChange={setPriceType}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="wholesale">Grosir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addToCart(product)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                            <Badge variant="outline" className="text-xs mt-1">{product.brand}</Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="font-bold text-blue-600">
                              {formatCurrency(priceType === 'wholesale' ? product.wholesale_price : product.price)}
                            </p>
                            <p className="text-xs text-gray-500">Stok: {product.stock} {product.uom}</p>
                          </div>
                          <Button size="sm" className="h-8 w-8 p-0">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada produk yang ditemukan</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Cart & Summary Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Keranjang ({cartItems.length})</span>
                {cartItems.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ScrollArea className="h-64">
                    {cartItems.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">{item.product.sku}</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {formatCurrency(priceType === 'wholesale' ? item.product.wholesale_price : item.product.price)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>

                  <Separator />

                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculations.subtotal)}</span>
                    </div>
                    {calculations.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Diskon:</span>
                        <span>-{formatCurrency(calculations.discount)}</span>
                      </div>
                    )}
                    {calculations.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Pajak:</span>
                        <span>{formatCurrency(calculations.tax)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatCurrency(calculations.total)}</span>
                    </div>
                  </div>

                  {/* Step Navigation */}
                  <div className="space-y-2">
                    {currentStep === 1 && (
                      <Button 
                        className="w-full" 
                        onClick={() => setCurrentStep(2)}
                        disabled={cartItems.length === 0}
                      >
                        Lanjut ke Info Customer
                      </Button>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="customer-name">Nama Customer</Label>
                          <Input
                            id="customer-name"
                            placeholder="Masukkan nama customer (opsional)"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customer-phone">No. Telepon</Label>
                          <Input
                            id="customer-phone"
                            placeholder="Masukkan no. telepon (opsional)"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                            Kembali
                          </Button>
                          <Button onClick={() => setCurrentStep(3)} className="flex-1">
                            Lanjut ke Pembayaran
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod('cash')}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Banknote className="w-4 h-4" />
                            <span>Tunai</span>
                          </Button>
                          <Button 
                            variant={paymentMethod === 'edc' ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod('edc')}
                            className="flex items-center justify-center space-x-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>EDC</span>
                          </Button>
                        </div>

                        {paymentMethod === 'cash' && (
                          <div className="space-y-2">
                            <Label htmlFor="payment-amount">Jumlah Bayar</Label>
                            <Input
                              id="payment-amount"
                              type="number"
                              placeholder="0"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                            {paymentAmount && parseFloat(paymentAmount) >= calculations.total && (
                              <div className="text-sm">
                                <span className="text-green-600 font-semibold">
                                  Kembalian: {formatCurrency(parseFloat(paymentAmount) - calculations.total)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="notes">Catatan (opsional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Catatan transaksi..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                            Kembali
                          </Button>
                          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                            <DialogTrigger asChild>
                              <Button className="flex-1">
                                <Receipt className="w-4 h-4 mr-2" />
                                Bayar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Customer:</span>
                                    <span>{customerInfo.name || 'Walk-in Customer'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total:</span>
                                    <span className="font-bold">{formatCurrency(calculations.total)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Metode:</span>
                                    <span>{paymentMethod === 'cash' ? 'Tunai' : 'EDC'}</span>
                                  </div>
                                  {paymentMethod === 'cash' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Bayar:</span>
                                        <span>{formatCurrency(parseFloat(paymentAmount) || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Kembalian:</span>
                                        <span>{formatCurrency((parseFloat(paymentAmount) || 0) - calculations.total)}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                                    Batal
                                  </Button>
                                  <Button onClick={processPayment} className="flex-1">
                                    Konfirmasi
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}