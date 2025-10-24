"use client";

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Minus, ShoppingCart, User, CreditCard, Banknote, Trash2, Check, Receipt, Loader2, Percent, Printer, Bluetooth, BluetoothConnected, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import axios from 'axios'
import { transactionsAPI, categoriesAPI, stockAPI, customersAPI, productsAPI } from '@/lib/api'
import ThermalPrinter from '@/lib/thermal-printer'

// API functions untuk POS - mengambil produk dari productsAPI dan stock dari stockAPI
const fetchProducts = async (params = {}) => {
  try {
    console.log('POS - Fetching products and stock data...');
    
    // Ambil data produk dengan harga dari products API
    console.log('Fetching products from products API...');
    const productsResponse = await productsAPI.getAll(params);
    console.log('Products API Response:', productsResponse);
    
    // Handle products response structure
    let products = [];
    if (productsResponse?.success && productsResponse.data?.products) {
      products = productsResponse.data.products;
    } else if (Array.isArray(productsResponse?.data)) {
      products = productsResponse.data;
    } else if (Array.isArray(productsResponse)) {
      products = productsResponse;
    }
    
    console.log('Products loaded:', products.length);
    
    // Ambil data stock dari stock API
    try {
      console.log('Fetching stock data from stock API...');
      const stockResponse = await stockAPI.getStockOverview(params);
      console.log('Stock API Response:', stockResponse);
      
      // Handle stock response structure
      let stockData = [];
      if (stockResponse?.success && stockResponse.data?.products) {
        stockData = stockResponse.data.products;
      } else if (stockResponse?.success && Array.isArray(stockResponse.data)) {
        stockData = stockResponse.data;
      } else if (Array.isArray(stockResponse?.data)) {
        stockData = stockResponse.data;
      } else if (Array.isArray(stockResponse)) {
        stockData = stockResponse;
      }
      
      console.log('Stock data loaded:', stockData.length);
      
      // Gabungkan data produk dengan stock data
      if (stockData.length > 0) {
        const stockMap = new Map();
        stockData.forEach(stock => {
          const productId = stock.productId || stock.id;
          if (productId) {
            stockMap.set(productId, {
              stock: stock.stock || stock.quantity || stock.available || stock.currentStock || stock.totalStock || 0,
              stockData: stock
            });
          }
        });
        
        // Update products dengan stock information
        products = products.map(product => {
          const stockInfo = stockMap.get(product.id);
          return {
            ...product,
            stock: stockInfo ? stockInfo.stock : 0,
            stockData: stockInfo ? stockInfo.stockData : null
          };
        });
        
        console.log('Products merged with stock data');
      }
      
    } catch (stockError) {
      console.warn('Stock API error, products will have 0 stock:', stockError);
      // Jika stock API gagal, set semua stock ke 0
      products = products.map(product => ({
        ...product,
        stock: 0
      }));
    }
    
    if (products.length > 0) {
      console.log('Final product sample:', products[0]);
      console.log('Product fields:', Object.keys(products[0]));
      console.log('Price fields:', {
        sellingPrice: products[0].sellingPrice,
        purchasePrice: products[0].purchasePrice,
        wholesalePrice: products[0].wholesalePrice
      });
      console.log('Stock field value:', products[0].stock);
    }
    
    return products;
    
  } catch (error) {
    console.error('Error fetching products with stock for POS:', error);
    // Fallback ke products API biasa jika stock API tidak tersedia
    try {
      console.log('Falling back to products API...');
      const token = localStorage.getItem('token') || '';
      
      const fallbackResponse = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!fallbackResponse.ok) {
        const errorText = await fallbackResponse.text();
        console.error('Products API Error:', fallbackResponse.status, errorText);
        throw new Error(`HTTP error! status: ${fallbackResponse.status} - ${errorText}`);
      }

      const data = await fallbackResponse.json();
      console.log('Fallback Products API Response:', data);
      
      // Handle API response structure
      if (data?.success && data.data?.products) {
        return data.data.products;
      } else if (Array.isArray(data?.data)) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
      
    } catch (fallbackError) {
      console.error('Fallback products fetch also failed:', fallbackError);
      return [];
    }
  }
};

const fetchCategories = async () => {
  try {
    const response = await categoriesAPI.getAll();
    console.log("Categories API Response:", response);

    // Handle API response structure
    if (response?.success && response.data?.categories) {
      return response.data.categories;
    } else if (Array.isArray(response?.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Fetch customers untuk mendapatkan default customer
const fetchCustomers = async () => {
  try {
    console.log('POS - Fetching customers...');
    const response = await customersAPI.getAll();
    console.log('Customers API Response:', response);
    
    // Handle API response structure
    if (response?.success && response.data?.customers) {
      return response.data.customers;
    } else if (Array.isArray(response?.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    return [];
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Fallback to direct API call
    try {
      const fallbackResponse = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
      }

      const data = await fallbackResponse.json();
      console.log('Fallback Customers API Response:', data);
      
      if (data?.success && data.data?.customers) {
        return data.data.customers;
      } else if (Array.isArray(data?.data)) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
      
    } catch (fallbackError) {
      console.error('Fallback customers fetch also failed:', fallbackError);
      return [];
    }
  }
};

// Search customer by phone
const searchCustomerByPhone = async (phone) => {
  try {
    const response = await transactionsAPI.searchCustomerByPhone(phone);
    return response.data;
  } catch (error) {
    console.error("Error searching customer:", error);
    return null;
  }
};

// Create quick customer for POS
const createQuickCustomer = async (customerData) => {
  try {
    const response = await transactionsAPI.createQuickCustomer(customerData);
    return response.data;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

// Create transaction
const createTransaction = async (transactionData) => {
  try {
    // Format data according to API specification
    const formattedData = {
      // Only include customerId if it exists (for registered customers)
      ...(transactionData.customerId && {
        customerId: transactionData.customerId,
      }),
      items: transactionData.items.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        subtotal: parseFloat(item.subtotal),
      })),
      subtotal: parseFloat(transactionData.subtotal),
      taxAmount: parseFloat(transactionData.taxAmount || 0),
      discountAmount: parseFloat(transactionData.discountAmount || 0),
      totalAmount: parseFloat(transactionData.totalAmount),
      paymentMethod: transactionData.paymentMethod,
      amountPaid: parseFloat(transactionData.amountPaid || 0),
      changeAmount: parseFloat(transactionData.changeAmount || 0),
      notes: transactionData.notes || "",
    };

    console.log("Creating transaction with formatted data:", formattedData);
    console.log("JSON payload:", JSON.stringify(formattedData, null, 2));

    const token = localStorage.getItem("token") || "";
    console.log(
      "POS - Using token for transaction:",
      token.substring(0, 50) + "..."
    );

    const response = await transactionsAPI.create(formattedData);
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);

    // Handle specific error cases
    if (error.response?.status === 400) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message;

      if (errorData?.code === "NO_BRANCH_ASSIGNED") {
        throw new Error(
          "User belum di-assign ke cabang. Hubungi administrator untuk mengatur branch assignment."
        );
      } else if (
        errorData?.code === "INSUFFICIENT_STOCK" ||
        errorMessage.includes("Insufficient stock")
      ) {
        throw new Error(`Stok tidak mencukupi: ${errorMessage}`);
      } else if (errorMessage.includes("User is not assigned to any branch")) {
        throw new Error("User belum di-assign ke cabang manapun");
      }
    } else if (error.response?.status === 422) {
      const errorData = error.response?.data;
      if (errorData?.errors) {
        const errorKeys = Object.keys(errorData.errors);
        const firstError = errorData.errors[errorKeys[0]][0];
        throw new Error(`Validation error: ${firstError}`);
      }
    }

    throw error;
  }
};

export default function POSKasir() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Items, 2: Customer Info, 3: Payment
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    type: 'walk-in' // walk-in or registered
  })
  const [paymentMethod, setPaymentMethod] = useState('CASH') // Only CASH payment allowed
  const [paymentAmount, setPaymentAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [priceType, setPriceType] = useState('normal') // normal or wholesale
  const [discountAmount, setDiscountAmount] = useState('')
  const [showDiscountConfirmDialog, setShowDiscountConfirmDialog] = useState(false)
  const [printer, setPrinter] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printerConnectionStatus, setPrinterConnectionStatus] = useState({
    isConnected: false,
    deviceName: '',
    lastConnected: null,
    error: null
  })
  
  // API Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function untuk mendapatkan stock value (sekarang sudah di-merge)
  const getProductStock = (product) => {
    // Setelah merge, stock sudah ada di field stock
    return product.stock || 0;
  };
  const getProductPrice = (product, quantity = 1) => {
    // Auto wholesale: if quantity >= minStock, use wholesalePrice
    const shouldUseWholesale =
      priceType === "wholesale" ||
      (quantity >= (product.minStock || 0) && product.minStock > 0);

    return shouldUseWholesale
      ? product.wholesalePrice || product.sellingPrice || 0
      : product.sellingPrice || product.price || 0;
  };

  // Helper function to check if product should show wholesale indicator
  const shouldShowWholesaleIndicator = (product, quantity = 1) => {
    return (
      quantity >= (product.minStock || 0) &&
      product.minStock > 0 &&
      product.wholesalePrice
    );
  };

  // Load initial data
  useEffect(() => {
    // Check if user is logged in and has valid token
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token) {
      console.error("No access token found. User needs to login first.");
      setError("Silakan login terlebih dahulu untuk mengakses POS");
      return;
    }

    try {
      // Parse user data to check if user has branch assignment
      if (user) {
        const userData = JSON.parse(user);
        console.log("POS - Current user:", userData);

        if (!userData.branch || !userData.branch.id) {
          console.error("User is not assigned to any branch");
          setError(
            "User belum di-assign ke cabang. Hubungi administrator untuk assign ke cabang."
          );
          return;
        }

        console.log("POS - User branch:", userData.branch.name);
      }

      console.log(
        "POS - Using accessToken from login:",
        token.substring(0, 50) + "..."
      );
    } catch (error) {
      console.error("Error parsing user data:", error);
      setError("Data user tidak valid. Silakan login ulang.");
      return;
    }

    loadInitialData();
  }, []);

  // Monitor printer connection status
  useEffect(() => {
    const checkPrinterStatus = () => {
      if (printer?.device) {
        if (printer.device.gatt && printer.device.gatt.connected) {
          setPrinterConnectionStatus(prev => ({
            ...prev,
            isConnected: true,
            deviceName: printer.device.name || 'Bluetooth Printer',
            error: null
          }));
        } else {
          // Connection lost
          const wasConnected = printerConnectionStatus.isConnected;
          setPrinterConnectionStatus(prev => ({
            ...prev,
            isConnected: false,
            error: 'Koneksi terputus'
          }));
          
          // Show notification if connection was previously established
          if (wasConnected) {
            toast({
              title: "Printer Terputus",
              description: "Koneksi Bluetooth printer terputus secara tidak terduga",
              variant: "destructive"
            });
            setPrinter(null);
          }
        }
      } else {
        setPrinterConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          deviceName: '',
          error: prev.error // Keep existing error if any
        }));
      }
    };

    // Initial check
    checkPrinterStatus();

    // Check every 5 seconds
    const interval = setInterval(checkPrinterStatus, 5000);

    return () => clearInterval(interval);
  }, [printer, printerConnectionStatus.isConnected]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify token before making API calls
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No access token available. Please login first.");
      }

      console.log("=== LOADING POS DATA ===");
      console.log("Using token:", token.substring(0, 50) + "...");

      const [productsData, categoriesData, customersData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchCustomers()
      ])
      
      console.log('=== POS DATA LOADED ===')
      console.log('Products loaded:', productsData.length)
      console.log('Sample product data:', productsData[0])
      console.log('Categories loaded:', categoriesData.length)
      console.log('Customers loaded:', customersData.length)
      
      // Check if products have stock information
      if (productsData.length > 0) {
        const sampleProduct = productsData[0];
        console.log('Sample product fields:', Object.keys(sampleProduct));
        console.log('Price fields:', {
          sellingPrice: sampleProduct.sellingPrice,
          purchasePrice: sampleProduct.purchasePrice,
          wholesalePrice: sampleProduct.wholesalePrice
        });
        console.log('Stock field value:', sampleProduct.stock);
      }
      console.log('Customers loaded:', customersData.length, customersData)
      console.log('=====================')
      
      setProducts(productsData)
      setCategories(categoriesData)
      setCustomers(customersData)
    } catch (err) {
      console.error("Error loading POS data:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Gagal memuat data. " + err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      console.log("Products is not array, returning empty");
      return [];
    }

    const filtered = products.filter((product) => {
      const searchFields = [
        product.name || "",
        product.sku || "",
        product.compatibleModels || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        product.category?.id === selectedCategory ||
        product.category?.name === selectedCategory;

      // Check if product has stock (assume stock comes from inventory)
      const productStock = getProductStock(product);
      const hasStock = productStock > 0; // Remove fallback untuk debugging stock issues
      
      console.log(`Product ${product.name}: stock=${productStock}, hasStock=${hasStock}`);
      
      const result = matchesSearch && matchesCategory && product.isActive !== false
      
      console.log(`Product ${product.name}: search=${matchesSearch}, category=${matchesCategory}, hasStock=${hasStock}, result=${result}`);
      console.log(`  - Prices: selling=${product.sellingPrice}, purchase=${product.purchasePrice}, wholesale=${product.wholesalePrice}`);
      console.log(`  - Stock: ${productStock}`);
      
      if (!result) {
        console.log("Product filtered out:", product.name, {
          matchesSearch,
          matchesCategory,
          hasStock,
          isActive: product.isActive,
        });
      }

      return result;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory]);

  // Available category options for filter
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    const uniqueCategories = categories.filter((cat) => cat.isActive !== false);
    return uniqueCategories.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [categories]);

  // Calculate totals with automatic wholesale pricing and manual discount
  const calculations = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = getProductPrice(item.product, item.quantity);
      return sum + (price * item.quantity)
    }, 0)
    
    const discount = parseFloat(discountAmount) || 0 // Manual discount from input
    const tax = 0 // Could be calculated based on tax rate
    const total = subtotal - discount + tax
    
    return { subtotal, discount, tax, total }
  }, [cartItems, priceType, discountAmount])

  // Add item to cart
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id)
    const availableStock = getProductStock(product); // Use helper function untuk mendapatkan stock
    
    // Check stock availability
    if (availableStock <= 0) {
      toast({
        title: "Stok Habis",
        description: `${product.name} tidak tersedia (stok: ${availableStock})`,
        variant: "destructive",
      });
      return;
    }

    if (existingItem) {
      if (existingItem.quantity < availableStock) {
        const newQuantity = existingItem.quantity + 1;
        setCartItems(
          cartItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          )
        );

        // Check if reached wholesale threshold
        const willUseWholesale = shouldShowWholesaleIndicator(
          product,
          newQuantity
        );
        const wasWholesale = shouldShowWholesaleIndicator(
          product,
          existingItem.quantity
        );

        if (willUseWholesale && !wasWholesale) {
          toast({
            title: "Harga Grosir Aktif!",
            description: `${
              product.name
            } sekarang menggunakan harga grosir ${formatCurrency(
              product.wholesalePrice
            )}`,
          });
        } else {
          toast({
            title: "Produk Ditambahkan",
            description: `${product.name} berhasil ditambahkan ke keranjang`,
          });
        }
      } else {
        toast({
          title: "Stok Tidak Mencukupi",
          description: "Kuantitas melebihi stok yang tersedia",
          variant: "destructive",
        });
      }
    } else {
      // Check stock before adding new item
      if (availableStock < 1) {
        toast({
          title: "Stok Tidak Mencukupi",
          description: `${product.name} hanya tersisa ${availableStock} unit`,
          variant: "destructive",
        });
        return;
      }

      setCartItems([...cartItems, { product, quantity: 1 }]);
      toast({
        title: "Produk Ditambahkan",
        description: `${product.name} berhasil ditambahkan ke keranjang`,
      });
    }
  };

  // Update cart item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }
    
    const item = cartItems.find(item => item.product.id === productId)
    const availableStock = item?.product ? getProductStock(item.product) : 999;
    if (item && newQuantity <= availableStock) {
      const oldQuantity = item.quantity;

      setCartItems(
        cartItems.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );

      // Check wholesale threshold changes
      const willUseWholesale = shouldShowWholesaleIndicator(
        item.product,
        newQuantity
      );
      const wasWholesale = shouldShowWholesaleIndicator(
        item.product,
        oldQuantity
      );

      if (willUseWholesale && !wasWholesale) {
        toast({
          title: "Harga Grosir Aktif!",
          description: `${
            item.product.name
          } sekarang menggunakan harga grosir ${formatCurrency(
            item.product.wholesalePrice
          )}`,
        });
      } else if (!willUseWholesale && wasWholesale) {
        toast({
          title: "Harga Normal",
          description: `${item.product.name} kembali menggunakan harga normal`,
        });
      }
    } else {
      toast({
        title: "Stok Tidak Mencukupi",
        description: "Kuantitas melebihi stok yang tersedia",
        variant: "destructive",
      });
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.product.id !== productId));
  };

  // Validate stock before payment
  const validateStockBeforePayment = async () => {
    for (const item of cartItems) {
      const availableStock = getProductStock(item.product);
      if (item.quantity > availableStock) {
        return {
          isValid: false,
          message: `${item.product.name} tidak cukup stok (tersedia: ${availableStock}, dibutuhkan: ${item.quantity})`,
        };
      }
    }
    return { isValid: true, message: "Stock validation passed" };
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    setCustomerInfo({ name: '', phone: '', type: 'walk-in' })
    setPaymentAmount('')
    setDiscountAmount('')
    setNotes('')
    setCurrentStep(1)
  }

  // Handle payment with discount confirmation
  const handlePaymentClick = () => {
    const discountValue = parseFloat(discountAmount) || 0;
    
    // If there's a discount, show confirmation dialog
    if (discountValue > 0) {
      setShowDiscountConfirmDialog(true);
    } else {
      // No discount, proceed directly
      processPayment();
    }
  };

  // Confirm discount and process payment
  const confirmDiscountAndPay = () => {
    setShowDiscountConfirmDialog(false);
    processPayment();
  };

  // Process payment
  const processPayment = async () => {
    if (processing) return; // Prevent double submission

    setProcessing(true);
    try {
      // Validation untuk pembayaran tunai (CASH only)
      const amount = parseFloat(paymentAmount || 0);
      if (!paymentAmount || amount < calculations.total) {
        toast({
          title: "Jumlah Pembayaran Kurang",
          description: `Minimum pembayaran: ${formatCurrency(
            calculations.total
          )}`,
          variant: "destructive",
        });
        return;
      }

      // Additional validation untuk stock sebelum proses pembayaran
      const stockValidation = await validateStockBeforePayment();
      if (!stockValidation.isValid) {
        toast({
          title: "Validasi Stok Gagal",
          description: stockValidation.message,
          variant: "destructive",
        });
        return;
      }

      // Handle customer creation if needed
      let customerId = null;
      if (
        customerInfo.phone &&
        customerInfo.name &&
        customerInfo.type !== "walk-in"
      ) {
        try {
          // Search for existing customer first
          const existingCustomer = await searchCustomerByPhone(
            customerInfo.phone
          );
          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            // Create new customer
            const newCustomer = await createQuickCustomer({
              name: customerInfo.name,
              phone: customerInfo.phone,
            });
            customerId = newCustomer.id;
          }
        } catch (error) {
          console.error("Customer handling error:", error);
        }
      }

      // Fallback: Use first customer as default if no customer specified
      if (!customerId && customers.length > 0) {
        customerId = customers[0].id;
        console.log(
          "Using default customer:",
          customers[0].id,
          customers[0].name
        );
      }

      // Prepare transaction data according to API specification
      const transactionData = {
        // customerId is optional - can be null or omitted for walk-in customers
        ...(customerId && { customerId: customerId }),
        items: cartItems.map((item) => {
          const unitPrice = getProductPrice(item.product, item.quantity);
          return {
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: unitPrice,
            subtotal: unitPrice * item.quantity,
          };
        }),
        subtotal: calculations.subtotal,
        taxAmount: calculations.tax || 0,
        discountAmount: calculations.discount || 0,
        totalAmount: calculations.total,
        paymentMethod: "CASH", // Only cash payment allowed
        amountPaid: parseFloat(paymentAmount || 0),
        changeAmount: Math.max(
          0,
          parseFloat(paymentAmount || 0) - calculations.total
        ),
        notes:
          notes ||
          `${customerInfo.name || "Walk-in Customer"} - Pembayaran Tunai`,
      };

      console.log("Processing transaction:", transactionData);

      // Create transaction via API
      const result = await createTransaction(transactionData)
      
      // Print receipt after successful transaction
      try {
        await printReceipt(result)
      } catch (printError) {
        console.error('Error printing receipt:', printError)
        // Don't fail the transaction if printing fails
      }
      
      // Reset form
      clearCart();
      setShowPaymentDialog(false);
      setCurrentStep(1);
      setCustomerInfo({ name: "", phone: "", type: "walk-in" });
      setPaymentAmount("");
      setNotes("");

      toast({
        title: "Transaksi Berhasil",
        description: `Invoice: ${result.invoiceNo || result.id}`,
      });
    } catch (error) {
      console.error("Error processing transaction:", error);

      let errorMessage = "Gagal memproses transaksi";
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.code === "NO_BRANCH_ASSIGNED") {
          errorMessage =
            "User belum di-assign ke cabang. Hubungi administrator untuk assign user ke cabang.";
        } else if (errorData?.code === "INSUFFICIENT_STOCK") {
          errorMessage = `Stok tidak mencukupi: ${errorData.message}`;
        } else {
          errorMessage = errorData?.message || errorMessage;
        }
      } else if (error.response?.status === 422) {
        errorMessage =
          "Data transaksi tidak valid. Periksa kembali form input.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }

  // Connect to thermal printer
  const connectPrinter = async () => {
    try {
      setIsConnecting(true)
      
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth tidak didukung di browser ini');
      }
      
      console.log('Creating thermal printer instance...');
      const thermalPrinter = new ThermalPrinter()
      
      console.log('Connecting to thermal printer...');
      const deviceInfo = await thermalPrinter.connect()
      
      console.log('Thermal printer connected successfully', deviceInfo);
      setPrinter(thermalPrinter)
      
      // Update connection status
      setPrinterConnectionStatus({
        isConnected: true,
        deviceName: deviceInfo.name || 'Bluetooth Printer',
        lastConnected: new Date(),
        error: null
      });
      
      toast({
        title: "Printer Terhubung",
        description: `${deviceInfo.name || 'Bluetooth Printer'} berhasil terhubung`,
      })
      
      return thermalPrinter
    } catch (error) {
      console.error('Error connecting printer:', error)
      
      // Update connection status with error
      setPrinterConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error.message
      }));
      
      toast({
        title: "Gagal Menghubungkan Printer",
        description: error.message || "Gagal menghubungkan ke thermal printer",
        variant: "destructive"
      })
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect from thermal printer
  const disconnectPrinter = () => {
    try {
      if (printer && printer.device) {
        printer.disconnect();
        setPrinter(null);
        setPrinterConnectionStatus({
          isConnected: false,
          deviceName: '',
          lastConnected: null,
          error: null
        });
        
        toast({
          title: "Printer Terputus",
          description: "Koneksi printer telah diputuskan",
        });
      }
    } catch (error) {
      console.error('Error disconnecting printer:', error);
    }
  }

  // Print receipt
  const printReceipt = async (transactionData) => {
    if (isPrinting) {
      console.log('Already printing, skipping...');
      return;
    }

    let printTimeout;
    try {
      setIsPrinting(true);
      console.log('Starting print process...', transactionData);
      
      let printerInstance = printer
      
      // If no printer connected, try to connect
      if (!printerInstance) {
        printerInstance = await connectPrinter()
        if (!printerInstance) {
          return // Connection failed
        }
      }

      // Add loading toast with delay protection
      const loadingToast = toast({
        title: "Mencetak Struk...",
        description: "Mohon tunggu, sedang mencetak struk",
        duration: 5000,
      });

      // Set a timeout to prevent getting stuck
      printTimeout = setTimeout(() => {
        console.warn('Print process taking too long, continuing...');
        toast({
          title: "Proses Print Lama",
          description: "Proses print memakan waktu lebih lama dari biasanya",
          variant: "destructive"
        });
      }, 2000);

      // Ensure calculations is available and valid
      if (!calculations || typeof calculations !== 'object') {
        throw new Error('Data perhitungan tidak tersedia');
      }

      // Prepare receipt data with proper validation
      const receiptData = {
        storeName: String(transactionData?.storeName || "DIWAN MOTOR"),
        storeAddress: String(transactionData?.storeAddress || "Jl. Contoh No. 123, Kota"),
        phoneNumber: String(transactionData?.phoneNumber || "0812-3456-7890"),
        invoiceNo: String(transactionData?.invoiceNo || transactionData?.id || 'INV-' + Date.now()),
        date: String(new Date().toLocaleDateString('id-ID')),
        time: String(new Date().toLocaleTimeString('id-ID')),
        customerName: String(customerInfo?.name || 'Walk-in Customer'),
        customerPhone: String(customerInfo?.phone || '-'),
        items: Array.isArray(cartItems) ? cartItems.map(item => {
          const unitPrice = Number(getProductPrice(item?.product, item?.quantity) || 0);
          const quantity = Number(item?.quantity || 0);
          return {
            name: String(item?.product?.name || 'Produk'),
            quantity: quantity,
            unitPrice: unitPrice,
            subtotal: Number(unitPrice * quantity)
          };
        }).filter(item => item.name && item.quantity > 0) : [],
        subtotal: Number(calculations?.subtotal || 0),
        discount: Number(calculations?.discount || 0),
        tax: Number(calculations?.tax || 0),
        total: Number(calculations?.total || 0),
        amountPaid: Number(parseFloat(paymentAmount || 0)),
        change: Number(Math.max(0, parseFloat(paymentAmount || 0) - (calculations?.total || 0))),
        paymentMethod: String('TUNAI')
      }

      console.log('Validated receipt data:', receiptData);
      
      // Ensure all critical fields are valid
      if (!receiptData.invoiceNo || receiptData.items.length === 0) {
        throw new Error('Data struk tidak lengkap');
      }

      // Print the receipt with delay
      await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            console.log('About to call printReceipt with data:', receiptData);
            
            // Validate the printer instance exists and has printReceipt method
            if (!printerInstance || typeof printerInstance.printReceipt !== 'function') {
              throw new Error('Printer instance tidak valid atau method printReceipt tidak tersedia');
            }
            
            // Simple call to printReceipt - let the thermal printer handle the validation
            await printerInstance.printReceipt(receiptData);
            console.log('Print receipt completed successfully');
            resolve();
          } catch (err) {
            console.error('Error in printReceipt call:', err);
            reject(err);
          }
        }, 500); // Small delay to ensure data is ready
      });

      // Clear timeout since print succeeded
      if (printTimeout) {
        clearTimeout(printTimeout);
        printTimeout = null;
      }
      
      toast({
        title: "Struk Dicetak",
        description: "Struk berhasil dicetak ke thermal printer",
      });
      
    } catch (error) {
      // Clear timeout on error
      if (printTimeout) {
        clearTimeout(printTimeout);
        printTimeout = null;
      }
      
      console.error('Error printing receipt:', error);
      toast({
        title: "Gagal Mencetak Struk",
        description: error.message || "Gagal mencetak struk ke thermal printer",
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
    );
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
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              POS Tidak Dapat Diakses
            </h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <div className="space-x-2">
              <Button
                onClick={() => (window.location.href = "/login")}
                variant="default"
              >
                Login
              </Button>
              <Button onClick={loadInitialData} variant="outline">
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Point of Sale (POS)
            </h1>
            <p className="mt-1 text-gray-600">
              Sistem kasir untuk transaksi penjualan
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Bluetooth Printer Status Indicator */}
            <div className="flex items-center px-4 py-2 bg-white border rounded-lg">
              <div className="flex items-center gap-2">
                {printerConnectionStatus.isConnected ? (
                  <>
                    <BluetoothConnected className="w-5 h-5 text-green-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-green-800">
                        Printer Terhubung
                      </span>
                      <span className="text-xs text-green-600">
                        {printerConnectionStatus.deviceName}
                      </span>
                      {printerConnectionStatus.lastConnected && (
                        <span className="text-xs text-gray-500">
                          Sejak: {printerConnectionStatus.lastConnected.toLocaleTimeString('id-ID')}
                        </span>
                      )}
                    </div>
                  </>
                ) : isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-800">
                        Menghubungkan...
                      </span>
                      <span className="text-xs text-blue-600">
                        Bluetooth Printer
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-5 h-5 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Printer Tidak Terhubung
                      </span>
                      <span className="text-xs text-gray-500">
                        {printerConnectionStatus.error || 'Klik untuk menghubungkan'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 ml-3">
                {!printerConnectionStatus.isConnected ? (
                  <Button
                    onClick={connectPrinter}
                    disabled={isConnecting}
                    size="sm"
                    variant="outline"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bluetooth className="w-4 h-4" />
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={disconnectPrinter}
                    disabled={isPrinting}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <BluetoothConnected className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div className="text-right">
              {(() => {
                try {
                  const userData = JSON.parse(
                    localStorage.getItem("user") || "{}"
                  );
                  return (
                    <div className="px-4 py-2 rounded-lg bg-blue-50">
                      <p className="text-sm font-medium text-blue-900">
                        {userData.full_name ||
                          userData.fullName ||
                          userData.username}
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
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          {[
            { step: 1, title: "Pilih Barang", icon: ShoppingCart },
            { step: 2, title: "Info Customer", icon: User },
            { step: 3, title: "Pembayaran", icon: CreditCard },
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300 text-gray-300"
                }`}
              >
                {currentStep > step ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`ml-2 font-medium ${
                  currentStep >= step ? "text-blue-600" : "text-gray-400"
                }`}
              >
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
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categoryOptions.map((category) => (
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
                  {filteredProducts.map(product => {
                    const availableStock = getProductStock(product);
                    const isOutOfStock = availableStock <= 0;

                    return (
                      <Card
                        key={product.id}
                        className={`transition-shadow ${
                          isOutOfStock
                            ? "opacity-50 cursor-not-allowed bg-gray-50"
                            : "cursor-pointer hover:shadow-md"
                        }`}
                        onClick={() => !isOutOfStock && addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold line-clamp-2">
                                {product.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {product.sku}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {product.brand?.name ||
                                    product.brand ||
                                    "No Brand"}
                                </Badge>
                                {isOutOfStock && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Habis
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="font-bold text-blue-600">
                                {formatCurrency(getProductPrice(product, 1))}
                              </p>
                              {product.wholesalePrice &&
                                product.minStock > 0 &&
                                !isOutOfStock && (
                                  <p className="text-xs font-medium text-orange-600">
                                    Grosir:{" "}
                                    {formatCurrency(product.wholesalePrice)} (≥
                                    {product.minStock} {product.unit || "Pcs"})
                                  </p>
                                )}
                              <p
                                className={`text-xs ${
                                  isOutOfStock
                                    ? "text-red-500 font-medium"
                                    : "text-gray-500"
                                }`}
                              >
                                Stok: {availableStock} {product.unit || "Pcs"}
                                {availableStock > 0 && availableStock <= 5 && (
                                  <span className="ml-1 text-orange-500">
                                    (Terbatas)
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="w-8 h-8 p-0"
                              disabled={isOutOfStock}
                              variant={isOutOfStock ? "secondary" : "default"}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">
                      Tidak ada produk yang ditemukan
                    </p>
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
                <div className="flex items-center gap-3">
                  <span>Keranjang ({cartItems.length})</span>
                  {/* Printer Status Badge */}
                  <Badge 
                    variant={
                      printerConnectionStatus.isConnected ? "default" :
                      printerConnectionStatus.error ? "destructive" :
                      "secondary"
                    }
                    className={`text-xs ${
                      printerConnectionStatus.isConnected ? "bg-green-100 text-green-800 border-green-300" :
                      printerConnectionStatus.error ? "bg-red-100 text-red-800 border-red-300" :
                      "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    {printerConnectionStatus.isConnected ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Printer Siap
                      </>
                    ) : printerConnectionStatus.error ? (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Printer Error
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-3 h-3 mr-1" />
                        Printer Offline
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {/* Printer Connection Button with Detailed Status */}
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={printerConnectionStatus.isConnected ? disconnectPrinter : connectPrinter}
                      disabled={isConnecting || isPrinting}
                      className={`${
                        printerConnectionStatus.isConnected 
                          ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100" 
                          : printerConnectionStatus.error
                          ? "border-red-500 text-red-600 bg-red-50 hover:bg-red-100"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      title={
                        printerConnectionStatus.isConnected 
                          ? `Terhubung: ${printerConnectionStatus.deviceName}\nKlik untuk memutuskan koneksi`
                          : printerConnectionStatus.error
                          ? `Error: ${printerConnectionStatus.error}\nKlik untuk coba lagi`
                          : "Hubungkan Bluetooth Printer"
                      }
                    >
                      {isConnecting || isPrinting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : printerConnectionStatus.isConnected ? (
                        <BluetoothConnected className="w-4 h-4" />
                      ) : printerConnectionStatus.error ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Bluetooth className="w-4 h-4" />
                      )}
                    </Button>
                    
                    {/* Status Indicator Dot */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      printerConnectionStatus.isConnected ? 'bg-green-500' :
                      printerConnectionStatus.error ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                  </div>
                  
                  {cartItems.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearCart}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between p-3 mb-2 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-2">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {item.product.sku}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-blue-600">
                              {formatCurrency(
                                getProductPrice(item.product, item.quantity)
                              )}
                            </p>
                            {shouldShowWholesaleIndicator(
                              item.product,
                              item.quantity
                            ) && (
                              <Badge variant="secondary" className="text-xs">
                                Grosir
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-6 h-6 p-0"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-sm text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-6 h-6 p-0"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>

                  <Separator />

                  {/* Discount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="flex items-center gap-2 text-sm font-medium">
                      <Percent className="w-4 h-4" />
                      Diskon Kasir
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full"
                      min="0"
                      max={calculations.subtotal}
                    />
                    <p className="text-xs text-gray-500">
                      Masukkan nominal diskon dalam rupiah
                    </p>
                  </div>

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
                      <span className="text-blue-600">
                        {formatCurrency(calculations.total)}
                      </span>
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
                            onChange={(e) =>
                              setCustomerInfo({
                                ...customerInfo,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customer-phone">No. Telepon</Label>
                          <Input
                            id="customer-phone"
                            placeholder="Masukkan no. telepon (opsional)"
                            value={customerInfo.phone}
                            onChange={(e) =>
                              setCustomerInfo({
                                ...customerInfo,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                            className="flex-1"
                          >
                            Kembali
                          </Button>
                          <Button
                            onClick={() => setCurrentStep(3)}
                            className="flex-1"
                          >
                            Lanjut ke Pembayaran
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-3">
                        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-2 text-blue-800">
                            <Banknote className="w-5 h-5" />
                            <span className="font-medium">
                              Pembayaran Tunai
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-blue-600">
                            Hanya pembayaran tunai yang diterima
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment-amount">Jumlah Bayar *</Label>
                          <Input
                            id="payment-amount"
                            type="number"
                            placeholder={`Minimum: ${formatCurrency(
                              calculations.total
                            )}`}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className={
                              parseFloat(paymentAmount) < calculations.total
                                ? "border-red-300"
                                : ""
                            }
                          />
                          {paymentAmount &&
                            parseFloat(paymentAmount) < calculations.total && (
                              <p className="text-sm text-red-600">
                                Jumlah bayar harus minimal{" "}
                                {formatCurrency(calculations.total)}
                              </p>
                            )}
                          {paymentAmount &&
                            parseFloat(paymentAmount) >= calculations.total && (
                              <div className="text-sm">
                                <span className="font-semibold text-green-600">
                                  Kembalian:{" "}
                                  {formatCurrency(
                                    parseFloat(paymentAmount) -
                                      calculations.total
                                  )}
                                </span>
                              </div>
                            )}
                        </div>

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
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep(2)}
                            className="flex-1"
                          >
                            Kembali
                          </Button>
                          <Dialog
                            open={showPaymentDialog}
                            onOpenChange={setShowPaymentDialog}
                          >
                            <DialogTrigger asChild>
                              <Button
                                className="flex-1"
                                disabled={
                                  !paymentAmount ||
                                  parseFloat(paymentAmount) <
                                    calculations.total ||
                                  processing
                                }
                              >
                                <Receipt className="w-4 h-4 mr-2" />
                                {!paymentAmount ||
                                parseFloat(paymentAmount) < calculations.total
                                  ? "Jumlah Bayar Kurang"
                                  : "Bayar"}
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
                                    <span>
                                      {customerInfo.name || "Walk-in Customer"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total:</span>
                                    <span className="font-bold">
                                      {formatCurrency(calculations.total)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Metode:</span>
                                    <span className="flex items-center space-x-1">
                                      <Banknote className="w-4 h-4" />
                                      <span>Tunai</span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Bayar:</span>
                                    <span className="font-medium text-green-600">
                                      {formatCurrency(
                                        parseFloat(paymentAmount) || 0
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Kembalian:</span>
                                    <span className="font-medium text-blue-600">
                                      {formatCurrency(
                                        Math.max(
                                          0,
                                          (parseFloat(paymentAmount) || 0) -
                                            calculations.total
                                        )
                                      )}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Printer Status Warning */}
                                {!printerConnectionStatus.isConnected && (
                                  <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                                    <div className="flex items-center gap-2 text-orange-800">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-sm font-medium">
                                        Printer Tidak Terhubung
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-orange-700">
                                      Struk tidak akan dicetak otomatis. Pastikan untuk mencatat transaksi secara manual.
                                    </p>
                                  </div>
                                )}
                                
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowPaymentDialog(false)}
                                    className="flex-1"
                                  >
                                    Batal
                                  </Button>
                                  <Button 
                                    onClick={handlePaymentClick} 
                                    className="flex-1"
                                    disabled={
                                      !paymentAmount ||
                                      parseFloat(paymentAmount) <
                                        calculations.total ||
                                      processing
                                    }
                                  >
                                    {processing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Memproses...
                                      </>
                                    ) : (
                                      "Konfirmasi Pembayaran"
                                    )}
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
      
      {/* Discount Confirmation Dialog */}
      <AlertDialog open={showDiscountConfirmDialog} onOpenChange={setShowDiscountConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-orange-500" />
              Konfirmasi Diskon Kasir
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Anda akan memberikan diskon kasir sebesar:</p>
              <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div className="text-lg font-bold text-orange-700">
                  {formatCurrency(parseFloat(discountAmount) || 0)}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculations.subtotal)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Diskon:</span>
                  <span>-{formatCurrency(parseFloat(discountAmount) || 0)}</span>
                </div>
                <div className="flex justify-between pt-1 font-semibold border-t">
                  <span>Total Bayar:</span>
                  <span>{formatCurrency(calculations.total)}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-red-600">
                Pastikan diskon sudah sesuai sebelum melanjutkan pembayaran.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDiscountAndPay}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Ya, Lanjutkan Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}