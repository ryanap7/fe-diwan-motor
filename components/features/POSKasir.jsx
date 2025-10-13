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
import { Search, Plus, Minus, ShoppingCart, User, CreditCard, Banknote, Trash2, Check, Receipt, Loader2 } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import axios from 'axios'
import { productsAPI, categoriesAPI } from '@/lib/api'
import { setDevToken } from '@/lib/dev-token'
import { getAuthToken } from '@/lib/auth'

// API functions
const fetchProducts = async (params = {}) => {
  try {
    const queryParams = {
      isActive: true,
      sortBy: 'name',
      sortOrder: 'asc',
      limit: 100,
      ...params
    }

    const response = await productsAPI.getAll(queryParams)

    if (response?.success) {
      return response.data?.products || response.data || []
    } else {
      throw new Error(response?.error || 'Failed to fetch products')
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

const fetchCategories = async () => {
  try {
    const response = await categoriesAPI.getAll()
    
    if (response?.success) {
      return response.data?.categories || response.data || []
    } else {
      throw new Error(response?.error || 'Failed to fetch categories')
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

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
  
  // API Data States
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load initial data
  useEffect(() => {
    // Set development token if not already set
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      setDevToken()
    }
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories()
      ])
      
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err.message)
      toast({
        title: "Error",
        description: "Gagal memuat data produk. " + err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return []
    return products.filter(product => {
      const searchFields = [
        product.name || '',
        product.sku || '',
        product.compatibleModels || ''
      ].join(' ').toLowerCase()
      
      const matchesSearch = searchFields.includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || 
        (product.category?.id === selectedCategory || product.category?.name === selectedCategory)
      
      // Check if product has stock (assume stock comes from inventory)
      const hasStock = product.stock > 0 || true // Fallback to true if stock not available
      
      return matchesSearch && matchesCategory && hasStock && product.isActive !== false
    })
  }, [products, searchTerm, selectedCategory])

  // Available category options for filter
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories)) return []
    const uniqueCategories = categories.filter(cat => cat.isActive !== false)
    return uniqueCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [categories])

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = priceType === 'wholesale' 
        ? (item.product.wholesalePrice || item.product.sellingPrice || 0)
        : (item.product.sellingPrice || item.product.price || 0)
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
    const availableStock = product.stock || 999 // Default high stock if not specified
    
    if (existingItem) {
      if (existingItem.quantity < availableStock) {
        setCartItems(cartItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
        toast({
          title: "Produk Ditambahkan",
          description: `${product.name} berhasil ditambahkan ke keranjang`
        })
      } else {
        toast({
          title: "Stok Tidak Mencukupi",
          description: "Kuantitas melebihi stok yang tersedia",
          variant: "destructive"
        })
      }
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }])
      toast({
        title: "Produk Ditambahkan",
        description: `${product.name} berhasil ditambahkan ke keranjang`
      })
    }
  }

  // Update cart item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
      return
    }
    
    const item = cartItems.find(item => item.product.id === productId)
    const availableStock = item?.product?.stock || 999
    if (item && newQuantity <= availableStock) {
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
        price: priceType === 'wholesale' 
          ? (item.product.wholesalePrice || item.product.sellingPrice || 0)
          : (item.product.sellingPrice || item.product.price || 0),
        subtotal: (priceType === 'wholesale' 
          ? (item.product.wholesalePrice || item.product.sellingPrice || 0)
          : (item.product.sellingPrice || item.product.price || 0)) * item.quantity
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

  // Loading state
  if (loading) {
    return (
      <div className="container p-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Memuat data produk...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container p-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">Gagal Memuat Data</h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <Button onClick={loadInitialData} variant="outline">
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container p-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Point of Sale (POS)</h1>
        <p className="mt-1 text-gray-600">Sistem kasir untuk transaksi penjualan</p>
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
              {step < 3 && <div className="w-12 h-px mx-4 bg-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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
                    {categoryOptions.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="transition-shadow cursor-pointer hover:shadow-md"
                          onClick={() => addToCart(product)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold line-clamp-2">{product.name}</h3>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {product.brand?.name || product.brand || 'No Brand'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="font-bold text-blue-600">
                              {formatCurrency(priceType === 'wholesale' 
                                ? (product.wholesalePrice || product.sellingPrice || 0)
                                : (product.sellingPrice || product.price || 0))}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stok: {product.stock || 'N/A'} {product.unit || 'Pcs'}
                            </p>
                          </div>
                          <Button size="sm" className="w-8 h-8 p-0">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="py-8 text-center">
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
                <div className="py-8 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ScrollArea className="h-64">
                    {cartItems.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 mb-2 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-2">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">{item.product.sku}</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {formatCurrency(priceType === 'wholesale' 
                              ? (item.product.wholesalePrice || item.product.sellingPrice || 0)
                              : (item.product.sellingPrice || item.product.price || 0))}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-6 h-6 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-sm text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-6 h-6 p-0"
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
                    <div className="flex justify-between text-lg font-bold">
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
                                <span className="font-semibold text-green-600">
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