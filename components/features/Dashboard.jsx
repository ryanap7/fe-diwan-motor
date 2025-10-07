'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Store, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBranches: 0,
    activeBranches: 0,
    totalRoles: 0,
    companyName: 'Belum Diatur'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [branchesRes, rolesRes, companyRes] = await Promise.all([
        axios.get('/api/branches', { headers }),
        axios.get('/api/roles', { headers }),
        axios.get('/api/company', { headers })
      ]);

      const branches = branchesRes.data || [];
      const activeBranches = branches.filter(b => b.is_active).length;

      setStats({
        totalBranches: branches.length,
        activeBranches,
        totalRoles: (rolesRes.data || []).length,
        companyName: companyRes.data?.name || 'Belum Diatur'
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