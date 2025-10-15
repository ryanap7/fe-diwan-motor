'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ArrowLeftRight, Edit3, ClipboardList, Barcode, Calendar, Plus, Minus, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { productsAPI, branchesAPI, stockAPI } from '@/lib/api';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [opnameDialogOpen, setOpnameDialogOpen] = useState(false);
  const [stockDetailDialogOpen, setStockDetailDialogOpen] = useState(false);
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [quickReduceDialogOpen, setQuickReduceDialogOpen] = useState(false);

  // Selected data
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Form states
  const [transferData, setTransferData] = useState({
    product_id: '',
    from_branch_id: '',
    to_branch_id: '',
    quantity: '',
    notes: ''
  });

  const [adjustmentData, setAdjustmentData] = useState({
    product_id: '',
    branch_id: '',
    adjustment_type: 'add', // add, subtract, set
    quantity: '',
    reason: '',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [productStocks, setProductStocks] = useState({});

  // Quick adjustment form states
  const [quickAddData, setQuickAddData] = useState({
    branch_id: '',
    quantity: '',
    reason: 'Purchase order received',
    notes: ''
  });

  const [quickReduceData, setQuickReduceData] = useState({
    branch_id: '',
    quantity: '',
    reason: 'damaged',
    notes: ''
  });

  useEffect(() => {
    // Verifikasi token tersedia sebelum fetch data
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Please login first.');
      return;
    }
    
    // Test API connectivity first
    testAPIConnectivity().then((isConnected) => {
      if (isConnected) {
        fetchInventoryData();
      } else {
        console.warn('API not accessible, using fallback data');
        loadFallbackData();
      }
    });
  }, []);

  // Test API connectivity
  const testAPIConnectivity = async () => {
    try {
      console.log('Testing API connectivity...');
      // Try a simple API call to test connectivity
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.diwanmotor.com/api'}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      console.log('API connectivity test result:', response.status);
      return response.ok;
    } catch (error) {
      console.error('API connectivity test failed:', error);
      return false;
    }
  };

  // Load fallback data when API is not accessible
  const loadFallbackData = () => {
    console.log('Loading fallback inventory data...');
    
    // Set fallback products data
    const fallbackProducts = [
      {
        id: 'prod1',
        name: 'Oli Mesin Shell Helix',
        sku: 'OLI-SHL-001',
        price: 85000,
        stock: 25,
        images: []
      },
      {
        id: 'prod2', 
        name: 'Ban Michelin 185/65R15',
        sku: 'BAN-MCH-185',
        price: 750000,
        stock: 8,
        images: []
      },
      {
        id: 'prod3',
        name: 'Filter Udara Honda',
        sku: 'FLT-HND-001',
        price: 45000,
        stock: 15,
        images: []
      }
    ];

    // Set fallback branches data
    const fallbackBranches = [
      {
        id: 'branch1',
        name: 'Head Office',
        slug: 'head_office'
      },
      {
        id: 'branch2',
        name: 'Cabang Jakarta',
        slug: 'jakarta'
      }
    ];

    setProducts(fallbackProducts);
    setBranches(fallbackBranches);
    setLoading(false);
    
    toast.info('Menggunakan data demo karena API tidak dapat diakses');
  };

  // Fetch stock movements when branch changes and movements tab is active
  useEffect(() => {
    if (activeTab === 'movements') {
      fetchStockMovements(selectedBranch);
    }
  }, [selectedBranch, activeTab]);

  const fetchInventoryData = async () => {
    try {
      console.log('Fetching inventory data...');
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Current token:', localStorage.getItem('token')?.substring(0, 20) + '...');

      // Try to get stock overview first (new endpoint that includes stock per branch)
      const [stockRes, branchesRes] = await Promise.all([
        stockAPI.getStockOverview(),
        branchesAPI.getAll()
      ]);

      console.log('Stock Overview Response:', stockRes);
      console.log('Branches Response:', branchesRes);

      // Handle stock overview response (products with stock information)
      if (stockRes?.success && stockRes.data?.products) {
        setProducts(stockRes.data.products);
        console.log('Loaded products with stock data:', stockRes.data.products.length);
      } else if (stockRes?.data?.products) {
        // Handle case where success field might not exist
        setProducts(stockRes.data.products);
        console.log('Loaded products with stock data (no success flag):', stockRes.data.products.length);
      } else {
        // Fallback to regular products API
        console.log('Stock overview not available, falling back to products API');
        try {
          const productsRes = await productsAPI.getAll();
          if (productsRes?.success && productsRes.data?.products) {
            setProducts(productsRes.data.products);
            // Fetch stock information for each product
            fetchProductStocks(productsRes.data.products);
          } else if (productsRes?.data?.products) {
            setProducts(productsRes.data.products);
            fetchProductStocks(productsRes.data.products);
          } else {
            console.warn('No products data found in fallback response');
            setProducts([]);
          }
        } catch (fallbackError) {
          console.error('Fallback products API also failed:', fallbackError);
          setProducts([]);
        }
      }

      if (branchesRes?.success && branchesRes.data?.branches) {
        setBranches(branchesRes.data.branches);
      } else if (branchesRes?.data?.branches) {
        // Handle case where success field might not exist
        setBranches(branchesRes.data.branches);
      } else {
        console.warn('No branches data found in response');
        setBranches([]);
      }

    } catch (error) {
      console.error('Gagal memuat data inventory:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Handle specific error types
      if (error.response?.status === 401) {
        toast.error('Token tidak valid atau sudah expired. Silakan login ulang.');
        console.log('Attempting to refresh token or redirect to login...');
      } else if (error.response?.status === 404) {
        toast.error('API endpoint tidak ditemukan. Periksa konfigurasi API.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Silakan coba lagi nanti.');
      } else {
        toast.error('Gagal memuat data inventory: ' + (error.response?.data?.message || error.message));
      }
      
      // Set default empty arrays on error
      setProducts([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock information for all products
  const fetchProductStocks = async (productList) => {
    const stocksMap = {};
    
    // Fetch stock for each product (in batches to avoid too many concurrent requests)
    const batchSize = 5;
    for (let i = 0; i < productList.length; i += batchSize) {
      const batch = productList.slice(i, i + batchSize);
      
      const stockPromises = batch.map(async (product) => {
        try {
          const stockRes = await stockAPI.getByProduct(product.id);
          return { productId: product.id, stockData: stockRes };
        } catch (error) {
          console.warn(`Failed to fetch stock for product ${product.id}:`, error);
          return { productId: product.id, stockData: null };
        }
      });

      const batchResults = await Promise.all(stockPromises);
      batchResults.forEach(({ productId, stockData }) => {
        if (stockData?.success && stockData.data) {
          stocksMap[productId] = stockData.data;
        }
      });
      
      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < productList.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setProductStocks(stocksMap);
  };

  // Fetch stock movements history
  const fetchStockMovements = async (branchId = null) => {
    try {
      const params = {};
      if (branchId && branchId !== 'all') {
        params.branchId = branchId;
      }
      
      const response = await stockAPI.getMovements(params);
      if (response?.success && response.data?.movements) {
        setStockMovements(response.data.movements);
      } else {
        setStockMovements([]);
      }
    } catch (error) {
      console.error('Gagal memuat stock movements:', error);
      
      // Handle 404 error specifically for stock movements endpoint
      if (error.response?.status === 404) {
        console.warn('Stock movements endpoint not available (404). Using dummy data for development.');
        
        // Set dummy data untuk development jika endpoint belum tersedia
        const dummyMovements = [
          {
            id: 'mov1',
            product: { name: 'Oli Mesin Shell Helix' },
            type: 'IN',
            quantity: 50,
            reason: 'Purchase Order',
            notes: 'Restok dari supplier',
            branch: { name: 'Head Office' },
            created_at: new Date().toISOString()
          },
          {
            id: 'mov2', 
            product: { name: 'Ban Michelin 185/65R15' },
            type: 'OUT',
            quantity: 2,
            reason: 'Sales Transaction',
            notes: 'Penjualan ke customer',
            branch: { name: 'Head Office' },
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'mov3',
            product: { name: 'Filter Udara Honda' },
            type: 'TRANSFER',
            quantity: 10,
            reason: 'Inter-branch Transfer',
            notes: 'Transfer dari Cabang A ke Cabang B',
            branch: { name: 'Cabang Jakarta' },
            created_at: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        setStockMovements(dummyMovements);
      } else {
        toast.error('Gagal memuat riwayat stock movements: ' + (error.response?.data?.message || error.message));
        setStockMovements([]);
      }
    }
  };

  // Calculate total stock across all branches for a product
  const getTotalStock = (product) => {
    // First check if the product has totalStock from the new API
    if (product.totalStock !== undefined) {
      return product.totalStock;
    }
    
    // Check if stocksByBranch exists and calculate total
    if (product.stocksByBranch && Array.isArray(product.stocksByBranch)) {
      return product.stocksByBranch.reduce((sum, branch) => sum + (parseInt(branch.quantity) || 0), 0);
    }
    
    // Check the productStocks cache
    const stockInfo = productStocks[product.id];
    if (stockInfo?.totalStock !== undefined) {
      return stockInfo.totalStock;
    }
    
    // Fallback to legacy product data
    if (product.stock_per_branch) {
      return Object.values(product.stock_per_branch).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
    }
    
    return parseInt(product.stock) || 0;
  };

  // Get stock for specific branch
  const getBranchStock = (product, branchId) => {
    // First check if the product has stocksByBranch from the new API
    if (product.stocksByBranch && Array.isArray(product.stocksByBranch)) {
      const branchStock = product.stocksByBranch.find(branch => branch.branchId === branchId);
      return branchStock ? parseInt(branchStock.quantity) || 0 : 0;
    }
    
    // Check the productStocks cache
    const stockInfo = productStocks[product.id];
    if (stockInfo?.stocksByBranch) {
      const branchStock = stockInfo.stocksByBranch.find(branch => branch.branchId === branchId);
      return branchStock ? parseInt(branchStock.quantity) || 0 : 0;
    }
    
    // Fallback to legacy product data
    if (product.stock_per_branch) {
      return product.stock_per_branch[branchId] || 0;
    }
    
    return selectedBranch === 'all' ? (parseInt(product.stock) || 0) : (parseInt(product.stock) || 0);
  };

  // Filter products based on search and branch
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchSearch = searchQuery === '' ||
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    // Untuk sementara, tampilkan semua product karena belum ada stock per branch dari API
    const matchBranch = selectedBranch === 'all' || true;

    return matchSearch && matchBranch;
  }) : [];

  // Handle stock transfer
  const handleStockTransfer = async () => {
    try {
      // Validate required fields
      if (!transferData.product_id || !transferData.from_branch_id || !transferData.to_branch_id || !transferData.quantity) {
        toast.error('Semua field wajib diisi!');
        return;
      }

      if (transferData.from_branch_id === transferData.to_branch_id) {
        toast.error('Cabang asal dan tujuan tidak boleh sama!');
        return;
      }

      if (parseInt(transferData.quantity) <= 0) {
        toast.error('Jumlah transfer harus lebih dari 0!');
        return;
      }

      const transferPayload = {
        productId: transferData.product_id,
        fromBranchId: transferData.from_branch_id,
        toBranchId: transferData.to_branch_id,
        quantity: parseInt(transferData.quantity),
        notes: transferData.notes || ''
      };

      console.log('Transfer payload:', transferPayload);

      const response = await stockAPI.transfer(transferPayload);
      
      if (response?.success) {
        toast.success('Transfer stok berhasil!');
        fetchInventoryData();
        fetchStockMovements(selectedBranch);
        setTransferDialogOpen(false);
        setTransferData({
          product_id: '',
          from_branch_id: '',
          to_branch_id: '',
          quantity: '',
          notes: ''
        });
      } else {
        toast.error(response?.message || 'Gagal melakukan transfer stok');
      }
    } catch (error) {
      console.error('Error transfer stock:', error);
      toast.error('Gagal melakukan transfer stok: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    try {
      // Validate required fields
      if (!adjustmentData.product_id || !adjustmentData.branch_id || !adjustmentData.quantity || !adjustmentData.reason) {
        toast.error('Semua field wajib diisi!');
        return;
      }

      if (parseInt(adjustmentData.quantity) <= 0) {
        toast.error('Jumlah adjustment harus lebih dari 0!');
        return;
      }

      // Prepare quantity based on adjustment type
      let quantity = parseInt(adjustmentData.quantity);
      let type = 'IN';

      if (adjustmentData.adjustment_type === 'subtract') {
        quantity = -Math.abs(quantity); // Ensure negative for subtraction
        type = 'OUT';
      } else if (adjustmentData.adjustment_type === 'add') {
        quantity = Math.abs(quantity); // Ensure positive for addition
        type = 'IN';
      }
      // Note: 'set' type might need special handling in backend

      const adjustPayload = {
        productId: adjustmentData.product_id,
        branchId: adjustmentData.branch_id,
        quantity: quantity,
        type: type,
        reason: adjustmentData.reason,
        notes: adjustmentData.notes || ''
      };

      console.log('Adjustment payload:', adjustPayload);

      const response = await stockAPI.adjust(adjustPayload);
      
      if (response?.success) {
        toast.success('Penyesuaian stok berhasil!');
        fetchInventoryData();
        fetchStockMovements(selectedBranch);
        setAdjustmentDialogOpen(false);
        setAdjustmentData({
          product_id: '',
          branch_id: '',
          adjustment_type: 'add',
          quantity: '',
          reason: '',
          notes: ''
        });
      } else {
        toast.error(response?.message || 'Gagal melakukan penyesuaian stok');
      }
    } catch (error) {
      console.error('Error adjust stock:', error);
      toast.error('Gagal melakukan penyesuaian stok: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle quick add stock
  const handleQuickAddStock = async () => {
    try {
      if (!quickAddData.branch_id || !quickAddData.quantity) {
        toast.error('Branch dan jumlah wajib diisi!');
        return;
      }

      if (parseInt(quickAddData.quantity) <= 0) {
        toast.error('Jumlah harus lebih dari 0!');
        return;
      }

      // Validate IDs exist
      if (!selectedProduct?.id) {
        toast.error('Product tidak valid. Silakan refresh halaman dan coba lagi.');
        return;
      }

      // Check if selected branch exists
      const selectedBranchExists = branches.find(b => b.id === quickAddData.branch_id);
      if (!selectedBranchExists) {
        toast.error('Branch yang dipilih tidak valid. Silakan pilih branch lain.');
        return;
      }

      const adjustPayload = {
        productId: selectedProduct.id,
        branchId: quickAddData.branch_id,
        quantity: Math.abs(parseInt(quickAddData.quantity)), // Ensure positive
        type: 'IN',
        reason: quickAddData.reason,
        notes: quickAddData.notes || `Menambah stok ${quickAddData.quantity} unit untuk ${selectedProduct.name}`
      };

      console.log('Quick Add payload:', adjustPayload);
      console.log('Selected Product:', selectedProduct);
      console.log('Selected Branch:', selectedBranchExists);

      // Show loading state
      toast.loading('Memproses penambahan stok...', { id: 'add-stock' });

      const response = await stockAPI.adjust(adjustPayload);
      
      if (response?.success) {
        toast.success(`✅ Berhasil menambah ${quickAddData.quantity} unit stok!`, { id: 'add-stock' });
        
        fetchInventoryData();
        fetchStockMovements(selectedBranch);
        setQuickAddDialogOpen(false);
        setQuickAddData({
          branch_id: '',
          quantity: '',
          reason: 'Purchase order received',
          notes: ''
        });
      } else {
        toast.error(response?.message || 'Gagal menambah stok', { id: 'add-stock' });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      console.error('Error response data:', error.response?.data);
      
      // More specific error messages
      let errorMessage = 'Gagal menambah stok';
      
      if (error.response?.data?.code === 'FOREIGN_KEY_ERROR') {
        errorMessage = `❌ ID tidak valid: Produk "${selectedProduct?.name}" atau Branch "${branches.find(b => b.id === quickAddData.branch_id)?.name}" tidak ditemukan di database. Silakan refresh halaman dan coba lagi.`;
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint stock adjustment belum tersedia di backend';
      } else if (error.response?.status === 401) {
        errorMessage = 'Tidak memiliki izin untuk mengubah stok';
      } else if (error.response?.status === 400) {
        errorMessage = `Data tidak valid: ${error.response?.data?.message || 'Periksa kembali data yang diinput'}`;
      } else if (error.response?.status === 500) {
        errorMessage = 'Error server saat memproses stok';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'add-stock', duration: 5000 });
    }
  };

  // Handle quick reduce stock
  const handleQuickReduceStock = async () => {
    try {
      if (!quickReduceData.branch_id || !quickReduceData.quantity) {
        toast.error('Branch dan jumlah wajib diisi!');
        return;
      }

      if (parseInt(quickReduceData.quantity) <= 0) {
        toast.error('Jumlah harus lebih dari 0!');
        return;
      }

      // Validate IDs exist
      if (!selectedProduct?.id) {
        toast.error('Product tidak valid. Silakan refresh halaman dan coba lagi.');
        return;
      }

      // Check if selected branch exists
      const selectedBranchExists = branches.find(b => b.id === quickReduceData.branch_id);
      if (!selectedBranchExists) {
        toast.error('Branch yang dipilih tidak valid. Silakan pilih branch lain.');
        return;
      }

      const adjustPayload = {
        productId: selectedProduct.id,
        branchId: quickReduceData.branch_id,
        quantity: -Math.abs(parseInt(quickReduceData.quantity)), // Ensure negative
        type: 'OUT',
        reason: quickReduceData.reason,
        notes: quickReduceData.notes || `Mengurangi stok ${quickReduceData.quantity} unit untuk ${selectedProduct.name}`
      };

      console.log('Quick Reduce payload:', adjustPayload);
      console.log('Selected Product:', selectedProduct);
      console.log('Selected Branch:', selectedBranchExists);

      // Show loading state
      toast.loading('Memproses pengurangan stok...', { id: 'reduce-stock' });

      const response = await stockAPI.adjust(adjustPayload);
      
      if (response?.success) {
        toast.success(`✅ Berhasil mengurangi ${quickReduceData.quantity} unit stok!`, { id: 'reduce-stock' });
        
        fetchInventoryData();
        fetchStockMovements(selectedBranch);
        setQuickReduceDialogOpen(false);
        setQuickReduceData({
          branch_id: '',
          quantity: '',
          reason: 'damaged',
          notes: ''
        });
      } else {
        toast.error(response?.message || 'Gagal mengurangi stok', { id: 'reduce-stock' });
      }
    } catch (error) {
      console.error('Error reducing stock:', error);
      console.error('Error response data:', error.response?.data);
      
      // More specific error messages
      let errorMessage = 'Gagal mengurangi stok';
      
      if (error.response?.data?.code === 'FOREIGN_KEY_ERROR') {
        errorMessage = `❌ ID tidak valid: Produk "${selectedProduct?.name}" atau Branch "${branches.find(b => b.id === quickReduceData.branch_id)?.name}" tidak ditemukan di database. Silakan refresh halaman dan coba lagi.`;
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint stock adjustment belum tersedia di backend';
      } else if (error.response?.status === 401) {
        errorMessage = 'Tidak memiliki izin untuk mengubah stok';
      } else if (error.response?.status === 400) {
        errorMessage = `Data tidak valid: ${error.response?.data?.message || 'Periksa kembali data yang diinput'}`;
      } else if (error.response?.status === 500) {
        errorMessage = 'Error server saat memproses stok';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'reduce-stock', duration: 5000 });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center animate-pulse">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kelola Inventory</h3>
          <p className="text-sm text-muted-foreground">Manajemen stok produk per cabang</p>
        </div>
        <div className="flex gap-2">
          {/* <Button
            onClick={() => setTransferDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Transfer Stok
          </Button> */}
          {/* <Button
            onClick={() => setAdjustmentDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Penyesuaian Stok
          </Button> */}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        if (value === 'movements') {
          fetchStockMovements(selectedBranch);
        }
      }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview Stok</TabsTrigger>
          <TabsTrigger value="lowstock">Stok Menipis</TabsTrigger>
          <TabsTrigger value="movements">Riwayat Pergerakan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                  <Input
                    placeholder="Cari produk (nama/SKU)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {Array.isArray(branches) && branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* <div className="flex gap-2">
                  <Button
                    onClick={() => setOpnameDialogOpen(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Stock Opname
                  </Button>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Stock Overview */}
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => {
              const totalStock = getTotalStock(product);
              const isLowStock = totalStock < 10; // Configurable threshold

              return (
                <Card key={product.id} className={`${isLowStock ? 'border-orange-200 bg-orange-50' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      {/* Product Info */}
                      <div className="lg:col-span-4">
                        <div className="flex items-start gap-3">
                          {product.images && product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="object-cover w-16 h-16 border rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {product.sku}
                              </Badge>
                              {isLowStock && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Stok Menipis
                                </Badge>
                              )}
                            </div>
                            <h4 className="mb-1 text-sm font-semibold line-clamp-2">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Total Stok: <span className="font-semibold">{totalStock} unit</span>
                            </p>
                            <Button
                              size="sm"
                              variant="link"
                              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                setSelectedProduct(product);
                                setStockDetailDialogOpen(true);
                              }}
                            >
                              Lihat detail stok →
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Stock per Branch */}
                      <div className="lg:col-span-6">
                        <div className="grid grid-cols-2 gap-2">
                          {Array.isArray(branches) && branches.map((branch) => {
                            const branchStock = getBranchStock(product, branch.id);
                            return (
                              <div key={branch.id} className="p-2 bg-white border rounded">
                                <p className="text-xs font-medium text-gray-600">{branch.name}</p>
                                <p className="text-sm font-semibold">
                                  {branchStock} unit
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-2">
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                            onClick={() => {
                              setSelectedProduct(product);
                              setQuickAddDialogOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah Stok
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-700 border-red-200 bg-red-50 hover:bg-red-100"
                            onClick={() => {
                              setSelectedProduct(product);
                              setQuickReduceDialogOpen(true);
                            }}
                          >
                            <Minus className="w-3 h-3 mr-1" />
                            Kurangi Stok
                          </Button>
                          {/* <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setTransferData(prev => ({ ...prev, product_id: product.id }));
                              setTransferDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            <ArrowLeftRight className="w-3 h-3 mr-1" />
                            Transfer
                          </Button> */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Tidak ada produk ditemukan
                </h3>
                <p className="text-muted-foreground">
                  Coba ubah filter pencarian atau tambah produk baru
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Produk Dengan Stok Menipis
              </CardTitle>
              <CardDescription>
                Produk yang perlu segera direstok
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts
                  .filter(product => getTotalStock(product) < 10)
                  .map((product) => (
                    <div key={product.id} className="p-4 border rounded-lg bg-orange-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                          <p className="text-sm font-medium text-orange-600">
                            Sisa: {getTotalStock(product)} unit
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => {
                            // Store product info for PO creation
                            localStorage.setItem('preSelectedProduct', product.id);

                            // Navigate to Purchase Orders using Next.js router
                            router.push('/purchase-orders');

                            // Show success message
                            toast.success(`Navigating to create PO for ${product.name}`);
                          }}
                        >
                          Buat Purchase Order
                        </Button>
                      </div>
                    </div>
                  ))}

                {filteredProducts.filter(product => getTotalStock(product) < 10).length === 0 && (
                  <div className="py-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">Semua produk memiliki stok yang cukup</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-500" />
                Riwayat Pergerakan Stock
              </CardTitle>
              <CardDescription>
                History pergerakan stock per cabang - {selectedBranch === 'all' ? 'Semua Cabang' : branches.find(b => b.id === selectedBranch)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="py-8 text-center">
                    <div className="w-8 h-8 mx-auto border-b-2 border-gray-900 rounded-full animate-spin"></div>
                    <p className="mt-2 text-muted-foreground">Memuat data...</p>
                  </div>
                ) : stockMovements.length > 0 ? (
                  <div className="space-y-2">
                    {stockMovements.map((movement, index) => (
                      <div key={movement.id || index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{movement.product?.name || 'Unknown Product'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {movement.type === 'IN' ? '+ ' : movement.type === 'OUT' ? '- ' : '↔ '}
                              {Math.abs(movement.quantity)} unit
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {movement.branch?.name} • {movement.reason}
                            </p>
                            {movement.notes && (
                              <p className="mt-1 text-xs text-gray-500">{movement.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              movement.type === 'IN' ? 'default' : 
                              movement.type === 'OUT' ? 'destructive' : 
                              'secondary'
                            }>
                              {movement.type}
                            </Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {movement.created_at ? new Date(movement.created_at).toLocaleDateString('id-ID') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">Belum ada riwayat pergerakan stock</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Lakukan transfer atau penyesuaian stock untuk melihat history
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Stock Opname Dialog */}
      <Dialog open={opnameDialogOpen} onOpenChange={setOpnameDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock Opname (Inventory Count)</DialogTitle>
            <DialogDescription>
              Lakukan penghitungan fisik stok dan sesuaikan dengan data sistem
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Stock Opname adalah proses penghitungan fisik barang di gudang 
                untuk mencocokkan dengan data sistem. Fitur ini akan membantu Anda mengidentifikasi 
                selisih stok dan melakukan penyesuaian yang diperlukan.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Pilih Cabang untuk Stock Opname</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(branches) && branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="mb-3 font-semibold">Langkah-langkah Stock Opname:</h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Pilih cabang yang akan dilakukan stock opname</li>
                <li>Hitung secara fisik semua barang yang ada di gudang</li>
                <li>Bandingkan hasil hitungan dengan data sistem</li>
                <li>Lakukan penyesuaian stok jika ada selisih</li>
                <li>Catat alasan penyesuaian untuk audit trail</li>
              </ol>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpnameDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={() => {
                  // Close opname dialog and switch to overview tab to see current stock
                  setOpnameDialogOpen(false);
                  setActiveTab('overview');
                  toast.success(`Stock opname dimulai untuk ${branches.find(b => b.id === selectedBranch)?.name || 'cabang yang dipilih'}`);
                }} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Mulai Stock Opname
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Stok Antar Cabang</DialogTitle>
            <DialogDescription>
              Pindahkan stok produk dari satu cabang ke cabang lain
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                value={transferData.product_id}
                onValueChange={(value) => setTransferData(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(products) && products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dari Cabang</Label>
                <Select
                  value={transferData.from_branch_id}
                  onValueChange={(value) => setTransferData(prev => ({ ...prev, from_branch_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(branches) && branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ke Cabang</Label>
                <Select
                  value={transferData.to_branch_id}
                  onValueChange={(value) => setTransferData(prev => ({ ...prev, to_branch_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(branches) && branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                value={transferData.quantity}
                onChange={(e) => setTransferData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                placeholder="Catatan transfer..."
                value={transferData.notes}
                onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleStockTransfer} className="bg-blue-600 hover:bg-blue-700">
                Transfer Stok
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok Manual</DialogTitle>
            <DialogDescription>
              Koreksi stok produk secara manual
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                value={adjustmentData.product_id}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(products) && products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cabang</Label>
              <Select
                value={adjustmentData.branch_id}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, branch_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(branches) && branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipe Penyesuaian</Label>
              <Select
                value={adjustmentData.adjustment_type}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, adjustment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Tambah Stok</SelectItem>
                  <SelectItem value="subtract">Kurangi Stok</SelectItem>
                  <SelectItem value="set">Set Stok Baru</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                value={adjustmentData.quantity}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan</Label>
              <Select
                value={adjustmentData.reason}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Barang Rusak</SelectItem>
                  <SelectItem value="lost">Barang Hilang</SelectItem>
                  <SelectItem value="found">Barang Ditemukan</SelectItem>
                  <SelectItem value="correction">Koreksi Data</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                placeholder="Catatan tambahan..."
                value={adjustmentData.notes}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleStockAdjustment} className="bg-green-600 hover:bg-green-700">
                Simpan Penyesuaian
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Detail Dialog */}
      <Dialog open={stockDetailDialogOpen} onOpenChange={setStockDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Stok Produk</DialogTitle>
            <DialogDescription>
              {selectedProduct ? `${selectedProduct.sku} - ${selectedProduct.name}` : 'Informasi detail stok'}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="mt-4 space-y-4">
              {/* Product Info */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                {selectedProduct.images && selectedProduct.images[0] && (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="object-cover w-20 h-20 border rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Total Stok: <strong>{getTotalStock(selectedProduct)} unit</strong></span>
                    <span>Harga: <strong>Rp {parseInt(selectedProduct.price || 0).toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Stock by Branch */}
              <div className="space-y-3">
                <h4 className="font-semibold">Stok per Cabang:</h4>
                <div className="space-y-2">
                  {Array.isArray(branches) && branches.map((branch) => {
                    const branchStock = getBranchStock(selectedProduct, branch.id);
                    const stockInfo = productStocks[selectedProduct.id];
                    const branchData = stockInfo?.stocksByBranch?.find(b => b.branchId === branch.id);
                    
                    return (
                      <div key={branch.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{branch.name}</p>
                          {branchData && (
                            <p className="text-xs text-muted-foreground">
                              Branch ID: {branchData.branchName || branch.id}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{branchStock} unit</p>
                          <Badge 
                            variant={branchStock > 10 ? "default" : branchStock > 0 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {branchStock > 10 ? "Stock Aman" : branchStock > 0 ? "Stock Menipis" : "Habis"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  onClick={() => {
                    setStockDetailDialogOpen(false);
                    setTransferData(prev => ({ ...prev, product_id: selectedProduct.id }));
                    setTransferDialogOpen(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Transfer Stok
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setStockDetailDialogOpen(false);
                    setAdjustmentData(prev => ({ ...prev, product_id: selectedProduct.id }));
                    setAdjustmentDialogOpen(true);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Adjust Stok
                </Button>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setStockDetailDialogOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Add Stock Dialog */}
      <Dialog open={quickAddDialogOpen} onOpenChange={setQuickAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <Plus className="w-5 h-5" />
              Tambah Stok Barang
            </DialogTitle>
            <DialogDescription>
              {selectedProduct ? `${selectedProduct.sku} - ${selectedProduct.name}` : 'Menambah stok produk'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Pilih Cabang</Label>
              <Select
                value={quickAddData.branch_id}
                onValueChange={(value) => setQuickAddData(prev => ({ ...prev, branch_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(branches) && branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah yang Ditambah</Label>
              <Input
                type="number"
                placeholder="0"
                value={quickAddData.quantity}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, quantity: e.target.value }))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan</Label>
              <Select
                value={quickAddData.reason}
                onValueChange={(value) => setQuickAddData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purchase order received">Purchase Order Masuk</SelectItem>
                  <SelectItem value="found">Barang Ditemukan</SelectItem>
                  <SelectItem value="correction">Koreksi Data</SelectItem>
                  <SelectItem value="return">Barang Return</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Input
                placeholder="Catatan tambahan..."
                value={quickAddData.notes}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setQuickAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleQuickAddStock} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Stok
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Reduce Stock Dialog */}
      <Dialog open={quickReduceDialogOpen} onOpenChange={setQuickReduceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Minus className="w-5 h-5" />
              Kurangi Stok Barang
            </DialogTitle>
            <DialogDescription>
              {selectedProduct ? `${selectedProduct.sku} - ${selectedProduct.name}` : 'Mengurangi stok produk'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Pilih Cabang</Label>
              <Select
                value={quickReduceData.branch_id}
                onValueChange={(value) => setQuickReduceData(prev => ({ ...prev, branch_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(branches) && branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah yang Dikurangi</Label>
              <Input
                type="number"
                placeholder="0"
                value={quickReduceData.quantity}
                onChange={(e) => setQuickReduceData(prev => ({ ...prev, quantity: e.target.value }))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan</Label>
              <Select
                value={quickReduceData.reason}
                onValueChange={(value) => setQuickReduceData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Barang Rusak</SelectItem>
                  <SelectItem value="lost">Barang Hilang</SelectItem>
                  <SelectItem value="expired">Barang Kadaluarsa</SelectItem>
                  <SelectItem value="sold">Terjual</SelectItem>
                  <SelectItem value="correction">Koreksi Data</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Input
                placeholder="Catatan tambahan..."
                value={quickReduceData.notes}
                onChange={(e) => setQuickReduceData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setQuickReduceDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleQuickReduceStock} className="bg-red-600 hover:bg-red-700">
                <Minus className="w-4 h-4 mr-2" />
                Kurangi Stok
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;