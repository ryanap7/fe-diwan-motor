'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, Store, Users, TrendingUp, Package, ShoppingCart, 
  DollarSign, AlertTriangle, TrendingDown, Calendar, Boxes, UserCheck
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
    
    // Customer stats
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    
    // Branch stats
    totalBranches: 0,
    activeBranches: 0,
    
    // Top products
    topProducts: [],
    recentTransactions: [],
    lowStockItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [
        branchesRes, 
        productsRes, 
        transactionsRes, 
        customersRes,
        inventoryRes
      ] = await Promise.all([
        axios.get('/api/branches', { headers }),
        axios.get('/api/products', { headers }),
        axios.get('/api/transactions', { headers }),
        axios.get('/api/customers', { headers }),
        axios.get('/api/stocks', { headers })
      ]);

      const branches = branchesRes.data || [];
      const products = productsRes.data || [];
      const transactions = transactionsRes.data || [];
      const customers = customersRes.data || [];
      const inventory = inventoryRes.data || [];

      // Calculate dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Revenue calculations
      const todayTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        tDate.setHours(0, 0, 0, 0);
        return tDate.getTime() === today.getTime() && t.status === 'completed';
      });
      
      const weekTransactions = transactions.filter(t => 
        new Date(t.transaction_date) >= weekAgo && t.status === 'completed'
      );
      
      const monthTransactions = transactions.filter(t => 
        new Date(t.transaction_date) >= monthStart && t.status === 'completed'
      );

      const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
      const weekRevenue = weekTransactions.reduce((sum, t) => sum + t.total, 0);
      const monthRevenue = monthTransactions.reduce((sum, t) => sum + t.total, 0);

      // Product stats
      const activeProducts = products.filter(p => p.is_active).length;
      
      // Low stock calculation (less than 10 units)
      const lowStockProducts = inventory.filter(inv => inv.quantity < 10).length;
      
      // Total stock value
      const totalStockValue = inventory.reduce((sum, inv) => {
        const product = products.find(p => p.id === inv.product_id);
        const price = product?.purchase_price || 0;
        return sum + (inv.quantity * price);
      }, 0);

      // Customer stats
      const newCustomersThisMonth = customers.filter(c => 
        new Date(c.created_at) >= monthStart
      ).length;

      // Top 5 products by sales
      const productSales = {};
      transactions.forEach(t => {
        if (t.status === 'completed') {
          t.items?.forEach(item => {
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = {
                product_name: item.product_name,
                quantity: 0,
                revenue: 0
              };
            }
            productSales[item.product_id].quantity += item.quantity;
            productSales[item.product_id].revenue += item.subtotal;
          });
        }
      });
      
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Recent transactions (last 5)
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
        .slice(0, 5);

      // Low stock items (lowest 5)
      const lowStockItems = inventory
        .filter(inv => inv.quantity < 10)
        .map(inv => {
          const product = products.find(p => p.id === inv.product_id);
          return {
            ...inv,
            product_name: product?.name || 'Unknown',
            sku: product?.sku || '-'
          };
        })
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);

      setStats({
        todayRevenue,
        weekRevenue,
        monthRevenue,
        totalTransactions: transactions.filter(t => t.status === 'completed').length,
        todayTransactions: todayTransactions.length,
        
        totalProducts: products.length,
        activeProducts,
        lowStockProducts,
        totalStockValue,
        
        totalCustomers: customers.length,
        newCustomersThisMonth,
        
        totalBranches: branches.length,
        activeBranches: branches.filter(b => b.is_active).length,
        
        topProducts,
        recentTransactions,
        lowStockItems
      });
    } catch (error) {
      console.error('Gagal mengambil data dashboard:', error);
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
    },
    {
      title: 'Total Customer',
      value: stats.totalCustomers,
      description: `+${stats.newCustomersThisMonth} bulan ini`,
      icon: UserCheck,
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
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
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-3xl font-bold">Dashboard POS & Inventory</CardTitle>
          <CardDescription className="text-white/90 text-base mt-2">
            Ringkasan bisnis toko motor Anda - Pendapatan, Stok, dan Performa Penjualan
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Revenue Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Penjualan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStatCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                <CardHeader className="pb-3 relative">
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
                  <div className="text-2xl font-bold text-gray-900 mb-1">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Inventory & Customer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondaryStatCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group ${stat.alert ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                <CardHeader className="pb-3 relative">
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
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Section - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Produk Terlaris
            </CardTitle>
            <CardDescription>5 produk dengan penjualan tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data penjualan</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} unit terjual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">{formatCurrency(product.revenue)}</p>
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
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Transaksi Terbaru
            </CardTitle>
            <CardDescription>5 transaksi terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{transaction.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{transaction.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.transaction_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">{formatCurrency(transaction.total)}</p>
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
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Stok Menipis
            </CardTitle>
            <CardDescription>Produk yang perlu di-restock</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-green-600 font-medium">✓ Semua stok aman</p>
                <p className="text-xs text-muted-foreground">Tidak ada produk yang stoknya menipis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                      <p className="text-xs text-muted-foreground">{item.branch_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-orange-600">{item.quantity}</p>
                      <p className="text-xs text-muted-foreground">unit</p>
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