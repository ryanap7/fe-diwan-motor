'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Building2, Store, Users, TrendingUp, Package, ShoppingCart, 
  DollarSign, AlertTriangle, TrendingDown, Calendar, Boxes, Filter
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    // Revenue stats
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalTransactions: 0,
    todayTransactions: 0,
    
    // Product & Inventory stats
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalStockValue: 0,
    

    
    // Branch stats
    totalBranches: 0,
    activeBranches: 0,
    
    // Top products
    topProducts: [],
    recentTransactions: [],
    lowStockItems: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [branches, setBranches] = useState([]);
  const [salesChartData, setSalesChartData] = useState(null);
  const [inventoryAlerts, setInventoryAlerts] = useState(null);

  useEffect(() => {
    fetchBranches();
    fetchDashboardData();
    fetchSalesChartData();
    fetchInventoryAlerts();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/branches', { headers });
      
      // Ensure we always set an array
      const branchData = response.data;
      if (Array.isArray(branchData)) {
        setBranches(branchData);
      } else if (branchData && Array.isArray(branchData.data)) {
        setBranches(branchData.data);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Gagal mengambil data branches:', error);
      setBranches([]); // Set empty array on error
    }
  };

  const fetchSalesChartData = async (params = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.branchId) queryParams.append('branchId', params.branchId);
      if (params.period) queryParams.append('period', params.period); // daily | weekly | monthly | yearly
      if (params.limit) queryParams.append('limit', params.limit);

      const url = `/api/dashboard/sales-chart${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await axios.get(url, { headers });
      
      if (response.data?.success && response.data?.data) {
        setSalesChartData(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data sales chart:', error);
      setSalesChartData(null);
    }
  };

  const fetchInventoryAlerts = async (params = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.branchId) queryParams.append('branchId', params.branchId);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.alertType) queryParams.append('alertType', params.alertType); // low_stock | out_of_stock | all

      const url = `/api/dashboard/inventory-alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await axios.get(url, { headers });
      
      if (response.data?.success && response.data?.data) {
        setInventoryAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data inventory alerts:', error);
      setInventoryAlerts(null);
    }
  };

  const handleRefreshData = () => {
    const params = {};
    if (selectedBranch && selectedBranch !== 'all') params.branchId = selectedBranch;
    if (dateRange?.from) params.startDate = dateRange.from.toISOString().split('T')[0];
    if (dateRange?.to) params.endDate = dateRange.to.toISOString().split('T')[0];
    
    setLoading(true);
    fetchDashboardData(params);
    fetchSalesChartData(params);
    fetchInventoryAlerts(params);
  };

  const fetchDashboardData = async (params = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.branchId) queryParams.append('branchId', params.branchId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const url = `/api/dashboard/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // Call the new dashboard analytics API
      const response = await axios.get(url, { headers });
      
      if (response.data?.success && response.data?.data) {
        const { data } = response.data;
        const { salesPerformance, inventoryStats, customerStats, topSellingProducts, recentTransactions, lowStockAlerts } = data;

        setStats({
          // Sales Performance
          todayRevenue: salesPerformance?.today?.revenue || 0,
          weekRevenue: salesPerformance?.thisWeek?.revenue || 0,
          monthRevenue: salesPerformance?.thisMonth?.revenue || 0,
          totalTransactions: salesPerformance?.totalTransactions || 0,
          todayTransactions: salesPerformance?.today?.transactionCount || 0,
          
          // Inventory Stats
          totalProducts: inventoryStats?.totalProducts || 0,
          activeProducts: inventoryStats?.totalProducts || 0, // Assuming all are active for now
          lowStockProducts: inventoryStats?.lowStockCount || 0,
          totalStockValue: inventoryStats?.totalStockValue || 0,
          

          
          // Branch stats (keeping default values for now)
          totalBranches: 1,
          activeBranches: 1,
          
          // Lists
          topProducts: topSellingProducts || [],
          recentTransactions: recentTransactions || [],
          lowStockItems: lowStockAlerts || []
        });
      } else {
        console.warn('Invalid response format from dashboard analytics API');
        // Set default values
        setStats({
          todayRevenue: 0,
          weekRevenue: 0,
          monthRevenue: 0,
          totalTransactions: 0,
          todayTransactions: 0,
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          totalStockValue: 0,
          totalBranches: 1,
          activeBranches: 1,
          topProducts: [],
          recentTransactions: [],
          lowStockItems: []
        });
      }
    } catch (error) {
      console.error('Gagal mengambil data dashboard analytics:', error);
      
      // Set default values on error
      setStats({
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalTransactions: 0,
        todayTransactions: 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        totalStockValue: 0,
        totalBranches: 1,
        activeBranches: 1,
        topProducts: [],
        recentTransactions: [],
        lowStockItems: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Main stat cards
  const mainStatCards = [
    {
      title: 'Pendapatan Hari Ini',
      value: formatCurrency(stats.todayRevenue),
      description: `${stats.todayTransactions} transaksi`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Pendapatan Minggu Ini',
      value: formatCurrency(stats.weekRevenue),
      description: '7 hari terakhir',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Pendapatan Bulan Ini',
      value: formatCurrency(stats.monthRevenue),
      description: 'Bulan berjalan',
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Total Transaksi',
      value: stats.totalTransactions,
      description: 'Semua transaksi',
      icon: ShoppingCart,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  // Secondary stat cards
  const secondaryStatCards = [
    {
      title: 'Total Produk',
      value: stats.totalProducts,
      description: `${stats.activeProducts} aktif`,
      icon: Package,
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Stok Menipis',
      value: stats.lowStockProducts,
      description: 'Perlu restock',
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-orange-500',
      alert: stats.lowStockProducts > 0
    },
    {
      title: 'Nilai Total Stok',
      value: formatCurrency(stats.totalStockValue),
      description: 'Asset inventory',
      icon: Boxes,
      gradient: 'from-teal-500 to-green-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="w-16 h-8 mb-2 bg-gray-200 rounded"></div>
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="relative overflow-hidden text-white border-0 shadow-lg bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="absolute top-0 right-0 w-64 h-64 -mt-32 -mr-32 bg-white rounded-full opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 -mb-24 -ml-24 bg-white rounded-full opacity-10"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-3xl font-bold">Dashboard POS & Inventory</CardTitle>
          <CardDescription className="mt-2 text-base text-white/90">
            Ringkasan bisnis toko motor Anda - Pendapatan, Stok, dan Performa Penjualan
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filter Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter Dashboard:</span>
              </div>
              
              {/* Branch Filter */}
              <div className="min-w-[200px]">
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {Array.isArray(branches) && branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Tanggal Mulai"
                  value={dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : null;
                    setDateRange(prev => ({ ...prev, from: newDate }));
                  }}
                  className="h-9 w-36"
                />
                <Input
                  type="date" 
                  placeholder="Tanggal Akhir"
                  value={dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : null;
                    setDateRange(prev => ({ ...prev, to: newDate }));
                  }}
                  className="h-9 w-36"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <Button 
              onClick={handleRefreshData}
              disabled={loading}
              size="sm"
              className="w-full md:w-auto"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Revenue Stats */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Performa Penjualan</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {mainStatCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="overflow-hidden transition-all duration-300 transform border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                <CardHeader className="relative pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="mb-1 text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Secondary Stats */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Statistik Inventory</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {secondaryStatCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group ${stat.alert ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                <CardHeader className="relative pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="mb-1 text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sales Chart Section */}
      {salesChartData && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Grafik Penjualan</h3>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Tren Penjualan ({salesChartData.period || 'Harian'})
              </CardTitle>
              <CardDescription>
                {salesChartData.startDate && salesChartData.endDate 
                  ? `Periode: ${salesChartData.startDate} - ${salesChartData.endDate}`
                  : 'Data penjualan berdasarkan periode terpilih'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesChartData.data && salesChartData.data.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple chart representation */}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                    {salesChartData.data.slice(0, 8).map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="text-xs text-gray-500 mb-1">
                          {item.period || item.date}
                        </div>
                        <div className="text-sm font-semibold text-blue-600">
                          {formatCurrency(item.revenue || item.sales || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.transactionCount || item.transactions || 0} transaksi
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {salesChartData.totalRevenue ? formatCurrency(salesChartData.totalRevenue) : '-'}
                      </div>
                      <div className="text-xs text-gray-500">Total Revenue</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {salesChartData.totalTransactions || '-'}
                      </div>
                      <div className="text-xs text-gray-500">Total Transaksi</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {salesChartData.averageOrderValue ? formatCurrency(salesChartData.averageOrderValue) : '-'}
                      </div>
                      <div className="text-xs text-gray-500">Rata-rata Order</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">
                        {salesChartData.growthPercentage ? `${salesChartData.growthPercentage}%` : '-'}
                      </div>
                      <div className="text-xs text-gray-500">Pertumbuhan</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-sm text-center text-muted-foreground">
                  Tidak ada data grafik penjualan untuk periode yang dipilih
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Alerts Section */}
      {inventoryAlerts && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Alert Inventory</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Low Stock Alerts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Stok Menipis ({inventoryAlerts.lowStockCount || 0})
                </CardTitle>
                <CardDescription>Produk yang membutuhkan restock</CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryAlerts.lowStock && inventoryAlerts.lowStock.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {inventoryAlerts.lowStock.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                        <div>
                          <p className="text-sm font-medium">{item.name || item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.sku || item.code}</p>
                          <p className="text-xs text-muted-foreground">Min: {item.minStock || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">{item.currentStock || 0}</p>
                          <p className="text-xs text-muted-foreground">{item.unit || 'pcs'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-center text-green-600">✓ Semua stok aman</p>
                )}
              </CardContent>
            </Card>

            {/* Out of Stock Alerts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-red-600" />
                  Stok Habis ({inventoryAlerts.outOfStockCount || 0})
                </CardTitle>
                <CardDescription>Produk yang perlu restock segera</CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryAlerts.outOfStock && inventoryAlerts.outOfStock.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {inventoryAlerts.outOfStock.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                        <div>
                          <p className="text-sm font-medium">{item.name || item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.sku || item.code}</p>
                          <p className="text-xs text-red-600">Habis sejak: {item.outOfStockSince ? formatDate(item.outOfStockSince) : '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">0</p>
                          <p className="text-xs text-muted-foreground">{item.unit || 'pcs'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-center text-green-600">✓ Tidak ada stok habis</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bottom Section - 3 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Products */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Produk Terlaris
            </CardTitle>
            <CardDescription>5 produk dengan penjualan tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="py-4 text-sm text-center text-muted-foreground">Belum ada data penjualan</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name || product.product_name || 'Unknown Product'}</p>
                        <p className="text-xs text-muted-foreground">{product.totalSold || product.quantity || 0} unit terjual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(product.totalRevenue || product.revenue || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Transaksi Terbaru
            </CardTitle>
            <CardDescription>5 transaksi terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="py-4 text-sm text-center text-muted-foreground">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100">
                    <div>
                      <p className="text-sm font-medium">{transaction.invoice || transaction.invoice_number || `INV-${transaction.id || index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">{transaction.customerName || transaction.customer_name || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.date || transaction.transaction_date || transaction.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(transaction.total || transaction.amount || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Stok Menipis
            </CardTitle>
            <CardDescription>Produk yang perlu di-restock</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm font-medium text-green-600">✓ Semua stok aman</p>
                <p className="text-xs text-muted-foreground">Tidak ada produk yang stoknya menipis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <div>
                      <p className="text-sm font-medium">{item.name || item.product_name || 'Unknown Product'}</p>
                      <p className="text-xs text-muted-foreground">{item.sku || item.code || '-'}</p>
                      <p className="text-xs text-muted-foreground">{item.branch || item.branch_name || 'Main Branch'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{item.currentStock || item.quantity || 0}</p>
                      <p className="text-xs text-muted-foreground">{item.unit || 'unit'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;