'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'Semua Izin', description: 'Akses penuh sistem' },
  { id: 'manage_branch', label: 'Kelola Cabang', description: 'Mengelola operasi cabang' },
  { id: 'manage_inventory', label: 'Kelola Inventori', description: 'Menambah, mengedit, menghapus inventori' },
  { id: 'manage_products', label: 'Kelola Produk', description: 'Menambah, mengedit, menghapus produk' },
  { id: 'manage_suppliers', label: 'Kelola Supplier', description: 'Menambah, mengedit, menghapus supplier' },
  { id: 'manage_customers', label: 'Kelola Pelanggan', description: 'Menambah, mengedit, menghapus pelanggan' },
  { id: 'process_sales', label: 'Proses Penjualan', description: 'Membuat transaksi penjualan' },
  { id: 'view_reports', label: 'Lihat Laporan', description: 'Akses laporan dan analitik' },
  { id: 'view_products', label: 'Lihat Produk', description: 'Melihat katalog produk' },
];

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data || []);
    } catch (error) {
      toast.error('Gagal memuat peran');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Peran Pengguna Sistem</h3>
          <p className="text-sm text-muted-foreground">Total: {roles.length} peran yang telah ditentukan</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Info:</strong> Peran sistem telah ditentukan dan tidak dapat diubah
          </p>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card
            key={role.id}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="pb-3 relative">
              <div className="flex items-start justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                {role.is_system && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Sistem
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{role.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {role.description || 'Tidak ada deskripsi'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Izin:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.length > 0 ? (
                    role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs bg-purple-50 border-purple-200">
                        {AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Tidak ada izin</span>
                  )}
                  {role.permissions?.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      +{role.permissions.length - 3} lagi
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4">
                {role.is_system ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-gray-600">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Peran Sistem - Hanya Baca
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Ubah
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs removed - roles are now fixed and read-only */}
    </div>
  );
};

export default RoleManagement;
