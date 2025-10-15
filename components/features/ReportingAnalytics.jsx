'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, Download, TrendingUp, TrendingDown, DollarSign, 
  Package, Calendar, BarChart3, PieChart, Filter, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const ReportingAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    branch_id: '',
    category_id: ''
  });

  // Report data states
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && products.length > 0) {
      generateReports();
    }
  }, [transactions, products, inventory, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      };

      const [transactionsRes, productsRes, inventoryRes, branchesRes, categoriesRes] = await Promise.all([
        axios.get('https://api.diwanmotor.com/api/transactions', { headers }),
        axios.get('https://api.diwanmotor.com/api/products', { headers }),
        axios.get('https://api.diwanmotor.com/api/stocks', { headers }),
        axios.get('https://api.diwanmotor.com/api/branches', { headers }),
        axios.get('https://api.diwanmotor.com/api/categories', { headers })
      ]);

      setTransactions(transactionsRes.data?.data?.transactions || []);
      setProducts(productsRes.data?.data || []);
      setInventory(inventoryRes.data?.data || []);
      setBranches(branchesRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
    } catch (error) {
      toast.error('Gagal memuat data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateReports = () => {
    // Filter transactions based on date range and branch
    const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.transactionDate || t.transaction_date);
      const fromDate = new Date(filters.date_from);
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999);

      const dateMatch = tDate >= fromDate && tDate <= toDate;
      const branchMatch = !filters.branch_id || t.branchId === filters.branch_id || t.branch_id === filters.branch_id;
      
      return dateMatch && branchMatch && (t.status === 'COMPLETED' || t.status === 'completed');
    });

    // Generate Sales Report
    generateSalesReport(filteredTransactions);
    
    // Generate Inventory Report
    generateInventoryReport();
    
    // Generate Financial Report
    generateFinancialReport(filteredTransactions);
  };

  const generateSalesReport = (filteredTransactions) => {
    // Daily sales summary
    const dailySales = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.transactionDate || t.transaction_date).toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0, transactions: 0, items: 0 };
      }
      const total = parseFloat(t.totalAmount || t.total || 0);
      dailySales[date].revenue += total;
      dailySales[date].transactions += 1;
      dailySales[date].items += t.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    });

    // Sales by product
    const productSales = {};
    filteredTransactions.forEach(t => {
      t.items?.forEach(item => {
        const productId = item.productId || item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = {
            product_id: productId,
            product_name: item.productName || item.product_name,
            sku: item.productSku || item.sku || item.product?.sku,
            quantity: 0,
            revenue: 0,
            transactions: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        const subtotal = parseFloat(item.subtotal || item.subTotal || 0);
        productSales[productId].revenue += subtotal;
        productSales[productId].transactions += 1;
      });
    });

    // Sales by category
    const categorySales = {};
    filteredTransactions.forEach(t => {
      t.items?.forEach(item => {
        const productId = item.productId || item.product_id;
        const product = products.find(p => p.id === productId);
        const categoryId = product?.categoryId || product?.category_id || 'uncategorized';
        const category = categories.find(c => c.id === categoryId);
        const categoryName = category?.name || 'Uncategorized';

        if (!categorySales[categoryId]) {
          categorySales[categoryId] = {
            category_id: categoryId,
            category_name: categoryName,
            quantity: 0,
            revenue: 0
          };
        }
        categorySales[categoryId].quantity += item.quantity;
        const subtotal = parseFloat(item.subtotal || item.subTotal || 0);
        categorySales[categoryId].revenue += subtotal;
      });
    });

    // Sales by cashier
    const cashierSales = {};
    filteredTransactions.forEach(t => {
      const cashierId = t.cashierId || t.cashier_id;
      const cashierName = t.cashier?.fullName || t.cashier?.username || t.cashierName || t.cashier_name || 'Unknown';
      
      if (!cashierSales[cashierId]) {
        cashierSales[cashierId] = {
          cashier_id: cashierId,
          cashier_name: cashierName,
          transactions: 0,
          revenue: 0
        };
      }
      cashierSales[cashierId].transactions += 1;
      const total = parseFloat(t.totalAmount || t.total || 0);
      cashierSales[cashierId].revenue += total;
    });

    // Best selling products (top 10)
    const bestSelling = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Slow moving products (bottom 10)
    const slowMoving = Object.values(productSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    // Total summary
    const totalRevenue = filteredTransactions.reduce((sum, t) => {
      const amount = parseFloat(t.totalAmount || t.total || 0);
      return sum + amount;
    }, 0);
    const totalTransactions = filteredTransactions.length;
    const totalItems = filteredTransactions.reduce((sum, t) => 
      sum + (t.items?.reduce((s, item) => s + item.quantity, 0) || 0), 0
    );
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    setSalesReport({
      summary: {
        totalRevenue,
        totalTransactions,
        totalItems,
        averageTransaction
      },
      dailySales: Object.values(dailySales).sort((a, b) => new Date(b.date) - new Date(a.date)),
      productSales: Object.values(productSales).sort((a, b) => b.revenue - a.revenue),
      categorySales: Object.values(categorySales).sort((a, b) => b.revenue - a.revenue),
      cashierSales: Object.values(cashierSales).sort((a, b) => b.revenue - a.revenue),
      bestSelling,
      slowMoving
    });
  };

  const generateInventoryReport = () => {
    // Current stock levels
    const stockLevels = inventory.map(inv => {
      const productId = inv.productId || inv.product_id;
      const branchId = inv.branchId || inv.branch_id;
      const product = products.find(p => p.id === productId);
      const branch = branches.find(b => b.id === branchId);
      const purchasePrice = parseFloat(product?.purchasePrice || product?.purchase_price || 0);
      
      return {
        ...inv,
        product_name: product?.name || 'Unknown',
        sku: product?.sku || '-',
        branch_name: branch?.name || 'Unknown',
        purchase_price: purchasePrice,
        stock_value: purchasePrice * inv.quantity
      };
    });

    // Stock valuation
    const totalStockValue = stockLevels.reduce((sum, item) => sum + item.stock_value, 0);
    const totalItems = stockLevels.reduce((sum, item) => sum + item.quantity, 0);

    // Low stock items (< 10)
    const lowStock = stockLevels.filter(item => item.quantity < 10);

    // Dead stock (0 quantity or no sales in 90 days)
    const deadStock = stockLevels.filter(item => item.quantity === 0);

    // Stock by branch
    const stockByBranch = {};
    stockLevels.forEach(item => {
      const branchId = item.branchId || item.branch_id;
      if (!stockByBranch[branchId]) {
        stockByBranch[branchId] = {
          branch_id: branchId,
          branch_name: item.branch_name,
          total_items: 0,
          total_value: 0
        };
      }
      stockByBranch[branchId].total_items += item.quantity;
      stockByBranch[branchId].total_value += item.stock_value;
    });

    setInventoryReport({
      summary: {
        totalStockValue,
        totalItems,
        lowStockCount: lowStock.length,
        deadStockCount: deadStock.length
      },
      stockLevels: stockLevels.sort((a, b) => b.stock_value - a.stock_value),
      lowStock,
      deadStock,
      stockByBranch: Object.values(stockByBranch)
    });
  };

  const generateFinancialReport = (filteredTransactions) => {
    // Calculate revenue
    const totalRevenue = filteredTransactions.reduce((sum, t) => {
      const amount = parseFloat(t.totalAmount || t.total || 0);
      return sum + amount;
    }, 0);
    
    // Calculate COGS (Cost of Goods Sold)
    let totalCOGS = 0;
    filteredTransactions.forEach(t => {
      t.items?.forEach(item => {
        const productId = item.productId || item.product_id;
        const product = products.find(p => p.id === productId);
        const purchasePrice = parseFloat(product?.purchasePrice || product?.purchase_price || 0);
        totalCOGS += purchasePrice * item.quantity;
      });
    });

    // Gross profit
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Net profit (simplified - excluding operational expenses)
    const netProfit = grossProfit;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Cash flow (simplified)
    const cashInflow = totalRevenue;
    const cashOutflow = totalCOGS;
    const netCashFlow = cashInflow - cashOutflow;

    setFinancialReport({
      profitLoss: {
        revenue: totalRevenue,
        cogs: totalCOGS,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin
      },
      cashFlow: {
        inflow: cashInflow,
        outflow: cashOutflow,
        net: netCashFlow
      }
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = (reportType, format) => {
    toast.info(`Export ${reportType} ke ${format} akan segera hadir`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat data laporan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reporting & Analytics</h3>
          <p className="text-sm text-muted-foreground">Laporan penjualan, inventory, dan keuangan</p>
        </div>
        <Button onClick={fetchInitialData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Muat Ulang
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Filter Laporan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Dari</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Sampai</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Cabang</Label>
              <Select
                value={filters.branch_id || 'all'}
                onValueChange={(value) => handleFilterChange('branch_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={filters.category_id || 'all'}
                onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Laporan Penjualan</TabsTrigger>
          <TabsTrigger value="inventory">Laporan Inventory</TabsTrigger>
          <TabsTrigger value="financial">Laporan Keuangan</TabsTrigger>
        </TabsList>

        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="space-y-6">
          {salesReport && (
            <>
              {/* Sales Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(salesReport.summary.totalRevenue)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Transaksi</p>
                        <p className="text-2xl font-bold">{salesReport.summary.totalTransactions}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Item Terjual</p>
                        <p className="text-2xl font-bold">{salesReport.summary.totalItems}</p>
                      </div>
                      <Package className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Rata-rata Transaksi</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(salesReport.summary.averageTransaction)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Selling Products */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Produk Terlaris
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleExport('best-selling', 'Excel')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport.bestSelling.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Slow Moving Products */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                        Produk Lambat Terjual
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleExport('slow-moving', 'Excel')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport.slowMoving.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Sales by Category */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-blue-600" />
                      Penjualan per Kategori
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('category-sales', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">% Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport.categorySales.map((item, index) => {
                        const percentage = (item.revenue / salesReport.summary.totalRevenue) * 100;
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.category_name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                            <TableCell className="text-right text-blue-600 font-semibold">
                              {percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Sales by Cashier */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Performa Kasir
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('cashier-sales', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kasir</TableHead>
                        <TableHead className="text-right">Transaksi</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg/Transaksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport.cashierSales.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.cashier_name}</TableCell>
                          <TableCell className="text-right">{item.transactions}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.revenue)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatCurrency(item.revenue / item.transactions)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Inventory Reports Tab */}
        <TabsContent value="inventory" className="space-y-6">
          {inventoryReport && (
            <>
              {/* Inventory Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Nilai Total Stok</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(inventoryReport.summary.totalStockValue)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Item</p>
                        <p className="text-2xl font-bold">{inventoryReport.summary.totalItems}</p>
                      </div>
                      <Package className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Stok Menipis</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {inventoryReport.summary.lowStockCount}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Dead Stock</p>
                        <p className="text-2xl font-bold text-red-600">
                          {inventoryReport.summary.deadStockCount}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Valuation Report */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      Valuasi Stok
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('stock-valuation', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Cabang</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga Beli</TableHead>
                        <TableHead className="text-right">Nilai Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryReport.stockLevels.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{item.branch_name}</TableCell>
                          <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.purchase_price)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-semibold">
                            {formatCurrency(item.stock_value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                      Stok Menipis (Reorder Alert)
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('low-stock', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {inventoryReport.lowStock.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-green-600 font-medium">✓ Semua stok aman</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead>Cabang</TableHead>
                          <TableHead className="text-right">Sisa Stok</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReport.lowStock.map((item, index) => (
                          <TableRow key={index} className="bg-orange-50">
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{item.branch_name}</TableCell>
                            <TableCell className="text-right font-bold text-orange-600">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Perlu Restock
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="space-y-6">
          {financialReport && (
            <>
              {/* Profit & Loss Report */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Laporan Laba Rugi
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('profit-loss', 'PDF')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                  <CardDescription>
                    Periode: {formatDate(filters.date_from)} - {formatDate(filters.date_to)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Total Pendapatan</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(financialReport.profitLoss.revenue)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Harga Pokok Penjualan (HPP)</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(financialReport.profitLoss.cogs)}
                      </span>
                    </div>
                    
                    <div className="border-t-2 pt-4"></div>
                    
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <div>
                        <p className="font-medium">Laba Kotor</p>
                        <p className="text-sm text-muted-foreground">
                          Margin: {financialReport.profitLoss.grossMargin.toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialReport.profitLoss.grossProfit)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div>
                        <p className="font-medium">Laba Bersih</p>
                        <p className="text-sm text-muted-foreground">
                          Margin: {financialReport.profitLoss.netMargin.toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialReport.profitLoss.netProfit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Flow Report */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Laporan Arus Kas
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('cash-flow', 'PDF')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                  <CardDescription>
                    Periode: {formatDate(filters.date_from)} - {formatDate(filters.date_to)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Kas Masuk</p>
                        <p className="text-sm text-muted-foreground">Dari penjualan</p>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(financialReport.cashFlow.inflow)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">Kas Keluar</p>
                        <p className="text-sm text-muted-foreground">Pembelian barang</p>
                      </div>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(financialReport.cashFlow.outflow)}
                      </span>
                    </div>
                    
                    <div className="border-t-2 pt-4"></div>
                    
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div>
                        <p className="font-medium text-lg">Arus Kas Bersih</p>
                        <p className="text-sm text-muted-foreground">Kas Masuk - Kas Keluar</p>
                      </div>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(financialReport.cashFlow.net)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingAnalytics;
