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
import { transactionsAPI, categoriesAPI, setDevToken } from '@/lib/api'

// API functions untuk POS - menggunakan endpoint products biasa karena endpoint POS belum ready
const fetchProducts = async (params = {}) => {
  try {
    const token = localStorage.getItem('token') || '';
    console.log('POS - Using token for products:', token.substring(0, 50) + '...');
    
    const response = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Products API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Products API Response:', data)
    
    // Handle API response structure
    if (data?.success && data.data?.products) {
      return data.data.products
    } else if (Array.isArray(data?.data)) {
      return data.data
    } else if (Array.isArray(data)) {
      return data
    }
    return []
    
  } catch (error) {
    console.error('Error fetching products for POS:', error)
    return []
  }
}

const fetchCategories = async () => {
  try {
    const response = await categoriesAPI.getAll()
    console.log('Categories API Response:', response)
    
    // Handle API response structure  
    if (response?.success && response.data?.categories) {
      return response.data.categories
    } else if (Array.isArray(response?.data)) {
      return response.data
    } else if (Array.isArray(response)) {
      return response
    }
    return []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Fetch customers untuk mendapatkan default customer
const fetchCustomers = async () => {
  try {
    const response = await fetch('/api/customers', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Customers API Response:', data)
    
    if (data?.success && data.data?.customers) {
      return data.data.customers
    } else if (Array.isArray(data?.data)) {
      return data.data
    } else if (Array.isArray(data)) {
      return data
    }
    return []
    
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

// Search customer by phone
const searchCustomerByPhone = async (phone) => {
  try {
    const response = await transactionsAPI.searchCustomerByPhone(phone)
    return response.data
  } catch (error) {
    console.error('Error searching customer:', error)
    return null
  }
}

// Create quick customer for POS
const createQuickCustomer = async (customerData) => {
  try {
    const response = await transactionsAPI.createQuickCustomer(customerData)
    return response.data
  } catch (error) {
    console.error('Error creating customer:', error)
    throw error
  }
}

// Create transaction
const createTransaction = async (transactionData) => {
  try {
    // Format data according to API specification
    const formattedData = {
      // Only include customerId if it exists (for registered customers)
      ...(transactionData.customerId && { customerId: transactionData.customerId }),
      items: transactionData.items.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        subtotal: parseFloat(item.subtotal)
      })),
      subtotal: parseFloat(transactionData.subtotal),
      taxAmount: parseFloat(transactionData.taxAmount || 0),
      discountAmount: parseFloat(transactionData.discountAmount || 0),
      totalAmount: parseFloat(transactionData.totalAmount),
      paymentMethod: transactionData.paymentMethod,
      amountPaid: parseFloat(transactionData.amountPaid || 0),
      changeAmount: parseFloat(transactionData.changeAmount || 0),
      notes: transactionData.notes || ''
    }

    console.log('Creating transaction with formatted data:', formattedData)
    console.log('JSON payload:', JSON.stringify(formattedData, null, 2))
    
    const token = localStorage.getItem('token') || '';
    console.log('POS - Using token for transaction:', token.substring(0, 50) + '...');
    
    const response = await transactionsAPI.create(formattedData)
    return response.data
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    // Handle specific error cases
    if (error.response?.status === 400) {
      const errorData = error.response?.data
      const errorMessage = errorData?.message || error.message
      
      if (errorData?.code === 'NO_BRANCH_ASSIGNED') {
        throw new Error('User belum di-assign ke cabang. Hubungi administrator untuk mengatur branch assignment.')
      } else if (errorData?.code === 'INSUFFICIENT_STOCK' || errorMessage.includes('Insufficient stock')) {
        throw new Error(`Stok tidak mencukupi: ${errorMessage}`)
      } else if (errorMessage.includes('User is not assigned to any branch')) {
        throw new Error('User belum di-assign ke cabang manapun')
      }
    } else if (error.response?.status === 422) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        const errorKeys = Object.keys(errorData.errors)
        const firstError = errorData.errors[errorKeys[0]][0]
        throw new Error(`Validation error: ${firstError}`)
      }
    }
    
    throw error
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
  const [paymentMethod, setPaymentMethod] = useState('CASH') // CASH or DEBIT_CARD
  const [paymentAmount, setPaymentAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [priceType, setPriceType] = useState('normal') // normal or wholesale
  
  // API Data States
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper function to get price based on quantity and minStock
  const getProductPrice = (product, quantity = 1) => {
    // Auto wholesale: if quantity >= minStock, use wholesalePrice
    const shouldUseWholesale = priceType === 'wholesale' || 
      (quantity >= (product.minStock || 0) && product.minStock > 0);
    
    return shouldUseWholesale
      ? (product.wholesalePrice || product.sellingPrice || 0)
      : (product.sellingPrice || product.price || 0)
  }

  // Helper function to check if product should show wholesale indicator
  const shouldShowWholesaleIndicator = (product, quantity = 1) => {
    return quantity >= (product.minStock || 0) && product.minStock > 0 && product.wholesalePrice;
  }

  // Load initial data
  useEffect(() => {
    // Check if user is logged in and has valid token
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token) {
      console.error('No access token found. User needs to login first.');
      setError('Silakan login terlebih dahulu untuk mengakses POS');
      return;
    }
    
    try {
      // Parse user data to check if user has branch assignment
      if (user) {
        const userData = JSON.parse(user);
        console.log('POS - Current user:', userData);
        
        if (!userData.branch || !userData.branch.id) {
          console.error('User is not assigned to any branch');
          setError('User belum di-assign ke cabang. Hubungi administrator untuk assign ke cabang.');
          return;
        }
        
        console.log('POS - User branch:', userData.branch.name);
      }
      
      // Set token untuk API interceptor (if using setDevToken for development)
      if (typeof setDevToken === 'function') {
        setDevToken(token);
      }
      
      console.log('POS - Using accessToken from login:', token.substring(0, 50) + '...');
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      setError('Data user tidak valid. Silakan login ulang.');
      return;
    }
    
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Verify token before making API calls
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No access token available. Please login first.');
      }
      
      console.log('=== LOADING POS DATA ===');
      console.log('Using token:', token.substring(0, 50) + '...');
      
      const [productsData, categoriesData, customersData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchCustomers()
      ])
      
      console.log('=== POS DATA LOADED ===')
      console.log('Products loaded:', productsData.length, productsData)
      console.log('Categories loaded:', categoriesData.length, categoriesData)
      console.log('Customers loaded:', customersData.length, customersData)
      console.log('=====================')
      
      setProducts(productsData)
      setCategories(categoriesData)
      setCustomers(customersData)
    } catch (err) {
      console.error('Error loading POS data:', err);
      setError(err.message)
      toast({
        title: "Error",
        description: "Gagal memuat data. " + err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    console.log('=== FILTERING PRODUCTS ===')
    console.log('Products array:', Array.isArray(products), products.length)
    console.log('Search term:', searchTerm)
    console.log('Selected category:', selectedCategory)
    
    if (!Array.isArray(products)) {
      console.log('Products is not array, returning empty')
      return []
    }
    
    const filtered = products.filter(product => {
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
      
      const result = matchesSearch && matchesCategory && hasStock && product.isActive !== false
      
      if (!result) {
        console.log('Product filtered out:', product.name, {
          matchesSearch,
          matchesCategory, 
          hasStock,
          isActive: product.isActive
        })
      }
      
      return result
    })
    
    console.log('Filtered products count:', filtered.length)
    console.log('========================')
    
    return filtered
  }, [products, searchTerm, selectedCategory])

  // Available category options for filter
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories)) return []
    const uniqueCategories = categories.filter(cat => cat.isActive !== false)
    return uniqueCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [categories])

  // Calculate totals with automatic wholesale pricing
  const calculations = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = getProductPrice(item.product, item.quantity);
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
        const newQuantity = existingItem.quantity + 1;
        setCartItems(cartItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        ))
        
        // Check if reached wholesale threshold
        const willUseWholesale = shouldShowWholesaleIndicator(product, newQuantity);
        const wasWholesale = shouldShowWholesaleIndicator(product, existingItem.quantity);
        
        if (willUseWholesale && !wasWholesale) {
          toast({
            title: "Harga Grosir Aktif!",
            description: `${product.name} sekarang menggunakan harga grosir ${formatCurrency(product.wholesalePrice)}`,
          })
        } else {
          toast({
            title: "Produk Ditambahkan",
            description: `${product.name} berhasil ditambahkan ke keranjang`
          })
        }
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
      const oldQuantity = item.quantity;
      
      setCartItems(cartItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ))
      
      // Check wholesale threshold changes
      const willUseWholesale = shouldShowWholesaleIndicator(item.product, newQuantity);
      const wasWholesale = shouldShowWholesaleIndicator(item.product, oldQuantity);
      
      if (willUseWholesale && !wasWholesale) {
        toast({
          title: "Harga Grosir Aktif!",
          description: `${item.product.name} sekarang menggunakan harga grosir ${formatCurrency(item.product.wholesalePrice)}`,
        })
      } else if (!willUseWholesale && wasWholesale) {
        toast({
          title: "Harga Normal",
          description: `${item.product.name} kembali menggunakan harga normal`,
        })
      }
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
  const processPayment = async () => {
    try {
      // Validation untuk payment method
      if (paymentMethod === 'CASH') {
        const amount = parseFloat(paymentAmount || 0)
        if (!paymentAmount || amount < calculations.total) {
          toast({
            title: "Jumlah Pembayaran Kurang",
            description: "Jumlah pembayaran harus minimal sama dengan total",
            variant: "destructive"
          })
          return
        }
      }
      
      // Untuk debit card, set payment amount otomatis ke total amount
      if (paymentMethod === 'DEBIT_CARD') {
        setPaymentAmount(calculations.total.toString())
      }

      // Handle customer creation if needed
      let customerId = null
      if (customerInfo.phone && customerInfo.name && customerInfo.type !== 'walk-in') {
        try {
          // Search for existing customer first
          const existingCustomer = await searchCustomerByPhone(customerInfo.phone)
          if (existingCustomer) {
            customerId = existingCustomer.id
          } else {
            // Create new customer
            const newCustomer = await createQuickCustomer({
              name: customerInfo.name,
              phone: customerInfo.phone
            })
            customerId = newCustomer.id
          }
        } catch (error) {
          console.error('Customer handling error:', error)
        }
      }
      
      // Fallback: Use first customer as default if no customer specified
      if (!customerId && customers.length > 0) {
        customerId = customers[0].id
        console.log('Using default customer:', customers[0].id, customers[0].name)
      }

      // Prepare transaction data according to API specification
      const transactionData = {
        // customerId is optional - can be null or omitted for walk-in customers
        ...(customerId && { customerId: customerId }),
        items: cartItems.map(item => {
          const unitPrice = getProductPrice(item.product, item.quantity);
          return {
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: unitPrice,
            subtotal: unitPrice * item.quantity
          }
        }),
        subtotal: calculations.subtotal,
        taxAmount: calculations.tax || 0,
        discountAmount: calculations.discount || 0,
        totalAmount: calculations.total,
        paymentMethod: paymentMethod, // CASH or DEBIT_CARD
        amountPaid: paymentMethod === 'DEBIT_CARD' ? calculations.total : parseFloat(paymentAmount || 0),
        changeAmount: paymentMethod === 'CASH' ? Math.max(0, parseFloat(paymentAmount || 0) - calculations.total) : 0,
        notes: notes || `${customerInfo.name || 'Walk-in Customer'} - ${paymentMethod} payment`
      }

      console.log('Processing transaction:', transactionData)

      // Create transaction via API
      const result = await createTransaction(transactionData)
      
      // Reset form
      clearCart()
      setShowPaymentDialog(false)
      setCurrentStep(1)
      setCustomerInfo({ name: '', phone: '', type: 'walk-in' })
      setPaymentAmount('')
      setNotes('')

      toast({
        title: "Transaksi Berhasil",
        description: `Invoice: ${result.invoiceNo || result.id}`,
      })

    } catch (error) {
      console.error('Error processing transaction:', error)
      
      let errorMessage = "Gagal memproses transaksi"
      if (error.response?.status === 400) {
        const errorData = error.response?.data
        if (errorData?.code === 'NO_BRANCH_ASSIGNED') {
          errorMessage = "User belum di-assign ke cabang. Hubungi administrator untuk assign user ke cabang."
        } else if (errorData?.code === 'INSUFFICIENT_STOCK') {
          errorMessage = `Stok tidak mencukupi: ${errorData.message}`
        } else {
          errorMessage = errorData?.message || errorMessage
        }
      } else if (error.response?.status === 422) {
        errorMessage = "Data transaksi tidak valid. Periksa kembali form input."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
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
              <User className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">POS Tidak Dapat Diakses</h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <div className="space-x-2">
              <Button onClick={() => window.location.href = '/login'} variant="default">
                Login
              </Button>
              <Button onClick={loadInitialData} variant="outline">
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container p-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Point of Sale (POS)</h1>
            <p className="mt-1 text-gray-600">Sistem kasir untuk transaksi penjualan</p>
          </div>
          {/* User Info */}
          <div className="text-right">
            {(() => {
              try {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                return (
                  <div className="px-4 py-2 rounded-lg bg-blue-50">
                    <p className="text-sm font-medium text-blue-900">
                      {userData.full_name || userData.fullName || userData.username}
                    </p>
                    <p className="text-xs text-blue-600">
                      {userData.branch?.name} ({userData.role})
                    </p>
                  </div>
                );
              } catch {
                return (
                  <div className="px-4 py-2 rounded-lg bg-red-50">
                    <p className="text-sm text-red-600">User tidak login</p>
                  </div>
                );
              }
            })()}
          </div>
        </div>
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
                <div className="flex flex-col w-full md:w-40">
                  <Select value={priceType} onValueChange={setPriceType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="wholesale">Force Grosir</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-gray-500">
                    Auto grosir jika qty ≥ min stok
                  </p>
                </div>
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
                              {formatCurrency(getProductPrice(product, 1))}
                            </p>
                            {product.wholesalePrice && product.minStock > 0 && (
                              <p className="text-xs font-medium text-orange-600">
                                Grosir: {formatCurrency(product.wholesalePrice)} (≥{product.minStock} {product.unit || 'Pcs'})
                              </p>
                            )}
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-blue-600">
                              {formatCurrency(getProductPrice(item.product, item.quantity))}
                            </p>
                            {shouldShowWholesaleIndicator(item.product, item.quantity) && (
                              <Badge variant="secondary" className="text-xs">Grosir</Badge>
                            )}
                          </div>
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
                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                            onClick={() => {
                              setPaymentMethod('CASH')
                              setPaymentAmount('') // Reset amount for manual input
                            }}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Banknote className="w-4 h-4" />
                            <span>Tunai</span>
                          </Button>
                          <Button 
                            variant={paymentMethod === 'DEBIT_CARD' ? 'default' : 'outline'}
                            onClick={() => {
                              setPaymentMethod('DEBIT_CARD')
                              setPaymentAmount(calculations.total.toString()) // Auto-set exact amount
                            }}
                            className="flex items-center justify-center space-x-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Debit Card</span>
                          </Button>
                        </div>

                        {paymentMethod === 'CASH' && (
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
                                    <span>{paymentMethod === 'CASH' ? 'Tunai' : 'Debit Card'}</span>
                                  </div>
                                  {paymentMethod === 'CASH' && (
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