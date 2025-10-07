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
        axios.get('/api/inventory', { headers })
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

  const statCards = [
    {
      title: 'Total Cabang',
      value: stats.totalBranches,
      description: `${stats.activeBranches} aktif`,
      icon: Store,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Cabang Aktif',
      value: stats.activeBranches,
      description: 'Saat ini beroperasi',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Peran Pengguna',
      value: stats.totalRoles,
      description: 'Peran terdefinisi',
      icon: Users,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Perusahaan',
      value: stats.companyName.length > 15 ? stats.companyName.substring(0, 15) + '...' : stats.companyName,
      description: 'Profil bisnis',
      icon: Building2,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-3xl font-bold">Selamat Datang di Modul Konfigurasi</CardTitle>
          <CardDescription className="text-white/90 text-base mt-2">
            Kelola cabang toko motor, profil perusahaan, dan peran pengguna dari satu tempat
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
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
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Panduan Cepat</CardTitle>
          <CardDescription>Ikuti langkah-langkah berikut untuk mengatur sistem Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Konfigurasi Profil Perusahaan</h4>
                <p className="text-sm text-muted-foreground">
                  Atur informasi bisnis termasuk nama, alamat, dan detail kontak
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:border-green-300 transition-colors duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Tambahkan Cabang Anda</h4>
                <p className="text-sm text-muted-foreground">
                  Buat dan kelola berbagai lokasi cabang dengan informasi lengkap
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors duration-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Tentukan Peran Pengguna</h4>
                <p className="text-sm text-muted-foreground">
                  Atur peran khusus dengan izin spesifik untuk anggota tim Anda
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;