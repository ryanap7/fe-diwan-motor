'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogBatal, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Store, Plus, Ubah, Trash2, Power, MapPin, Telepon, User, Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BranchManagement = () => {
  const [cabang, setCabanges] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingbranch, setUbahingCabang] = useState(null);
  const [branchToDelete, setCabangToDelete] = useState(null);
  const [branchForStaffTetapkanment, setCabangForStaffTetapkanment] = useState(null);
  const [staffTetapkanment, setStaffTetapkanment] = useState({
    manager_id: '',
    cashier_id: ''
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    manager_phone: '',
    operating_hours: '',
    stock_capacity: ''
  });
  const [saving, setMenyimpan... useState(false);

  useEffect(() => {
    fetchCabanges();
  }, []);

  const fetchCabanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [cabangRes, usersRes, rolesRes] = await Promise.all([
        axios.get('/api/cabang', { headers }),
        axios.get('/api/users', { headers }),
        axios.get('/api/roles', { headers })
      ]);
      
      setCabanges(cabangRes.data || []);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      toast.error('Gagal memuat cabang');
    } finally {
      setLoading(false);
    }
  };
  
  const getCabangUsers = (branchId) => {
    const branchUsers = users.filter(u => u.branch_id === branchId);
    const managerRole = roles.find(r => r.name === 'Manajer Cabang');
    const cashierRole = roles.find(r => r.name === 'Cashier');
    
    const manager = branchUsers.find(u => u.role_id === managerRole?.id);
    const cashier = branchUsers.find(u => u.role_id === cashierRole?.id);
    
    return { manager, cashier };
  };

  const handleOpenDialog = (branch = null) => {
    if (branch) {
      setUbahingCabang(branch);
      setFormData(branch);
    } else {
      setUbahingCabang(null);
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        manager_name: '',
        manager_phone: '',
        operating_hours: '',
        stock_capacity: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setUbahingCabang(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMenyimpan...ue);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingCabang) {
        await axios.post(`/api/cabang/${editingbranch.id}/update`, formData, { headers });
        toast.success('Cabang berhasil diperbarui!');
      } else {
        await axios.post('/api/cabang/create', formData, { headers });
        toast.success('Cabang berhasil dibuat!');
      }

      fetchCabanges();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan cabang');
    } finally {
      setMenyimpan...lse);
    }
  };

  const handleToggleAktif = async (branch) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/cabang/${branch.id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Cabang ${branch.is_active ? 'deactivated' : 'activated'} successfully!`);
      fetchCabanges();
    } catch (error) {
      toast.error('Failed to toggle branch status');
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/cabang/${branchToDelete.id}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Cabang berhasil dihapus!');
      fetchCabanges();
    } catch (error) {
      toast.error('Gagal menghapus cabang');
    } finally {
      setDeleteDialogOpen(false);
      setCabangToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenStaffDialog = (branch) => {
    const { manager, cashier } = getCabangUsers(branch.id);
    setCabangForStaffTetapkanment(branch);
    setStaffTetapkanment({
      manager_id: manager?.id || '',
      cashier_id: cashier?.id || ''
    });
    setStaffDialogOpen(true);
  };

  const handleCloseStaffDialog = () => {
    setStaffDialogOpen(false);
    setCabangForStaffTetapkanment(null);
  };

  const handleStaffTetapkanmentSubmit = async (e) => {
    e.preventDefault();
    setMenyimpan...ue);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Update users with new branch assignments
      await axios.post('/api/cabang/assign-staff', {
        branch_id: branchForStaffTetapkanment.id,
        manager_id: staffTetapkanment.manager_id || null,
        cashier_id: staffTetapkanment.cashier_id || null
      }, { headers });

      toast.success('Staff assigned successfully!');
      fetchCabanges();
      handleCloseStaffDialog();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign staff');
    } finally {
      setMenyimpan...lse);
    }
  };

  const getAvailableManagers = () => {
    const managerRole = roles.find(r => r.name === 'Manajer Cabang');
    if (!managerRole) return [];
    
    return users.filter(u => u.role_id === managerRole.id);
  };

  const getAvailableCashiers = () => {
    const cashierRole = roles.find(r => r.name === 'Cashier');
    if (!cashierRole) return [];
    
    return users.filter(u => u.role_id === cashierRole.id);
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
          <h3 className="text-lg font-semibold text-gray-900">Kelola Cabang</h3>
          <p className="text-sm text-muted-foreground">Total: {cabang.length} cabang</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Cabang Baru
        </Button>
      </div>

      {/* Cabanges Grid */}
      {cabang.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada cabang</h3>
            <p className="text-muted-foreground mb-6">Mulai dengan menambahkan lokasi cabang pertama Anda</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Cabang Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cabang.map((branch) => {
            const { manager, cashier } = getCabangUsers(branch.id);
            
            return (
              <Card
                key={branch.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="pb-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
                        >
                          {branch.code}
                        </Badge>
                        <Badge
                          variant={branch.is_active ? 'default' : 'secondary'}
                          className={branch.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {branch.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-1">{branch.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{branch.address || 'Tidak ada alamat'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Telepon className="w-4 h-4 flex-shrink-0" />
                    <span>{branch.phone || 'Tidak ada telepon'}</span>
                  </div>
                  
                  {/* Tetapkaned Staff Section */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-700">Tetapkaned Staff:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenStaffDialog(branch)}
                        className="h-6 px-2 text-xs hover:bg-blue-50"
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        Tetapkan
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span className="font-medium text-xs text-gray-600">Manajer:</span>
                        {manager ? (
                          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                            {manager.username}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum ditugaskan</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 flex-shrink-0 text-green-600" />
                        <span className="font-medium text-xs text-gray-600">Kasir:</span>
                        {cashier ? (
                          <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                            {cashier.username}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum ditugaskan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(branch)}
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                    >
                      <Ubah className="w-3 h-3 mr-1" />
                      Ubah
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAktif(branch)}
                      className={`flex-1 transition-colors duration-200 ${
                        branch.is_active
                          ? 'hover:bg-orange-50 hover:border-orange-300'
                          : 'hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      <Power className="w-3 h-3 mr-1" />
                      {branch.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCabangToDelete(branch);
                        setDeleteDialogOpen(true);
                      }}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Ubah Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingCabang ? 'Ubah Cabang' : 'Tambah Cabang Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingCabang ? 'Update branch information' : 'Fill in the details for the new branch'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Cabang <span className="text-red-500">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="contoh: BR001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Cabang <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="contoh: Toko Utama"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Masukkan alamat cabang"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager_name">Nama Manajer</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => handleChange('manager_name', e.target.value)}
                  placeholder="Masukkan nama manajer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_phone">Manager Telepon</Label>
                <Input
                  id="manager_phone"
                  value={formData.manager_phone}
                  onChange={(e) => handleChange('manager_phone', e.target.value)}
                  placeholder="Masukkan telepon manajer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operating_hours">Jam Operasional</Label>
                <Input
                  id="operating_hours"
                  value={formData.operating_hours}
                  onChange={(e) => handleChange('operating_hours', e.target.value)}
                  placeholder="contoh: 08:00 - 20:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_capacity">Kapasitas Stok</Label>
                <Input
                  id="stock_capacity"
                  value={formData.stock_capacity}
                  onChange={(e) => handleChange('stock_capacity', e.target.value)}
                  placeholder="contoh: 1000 item"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  editingCabang ? 'Perbarui Cabang' : 'Buat Cabang'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Staff Tetapkanment Dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Tetapkan Staf ke Cabang</DialogTitle>
            <DialogDescription>
              Tetapkan Manajer Cabang and Cashier to <strong>{branchForStaffTetapkanment?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStaffTetapkanmentSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Manajer Cabang</Label>
              <Select
                value={staffTetapkanment.manager_id || 'none'}
                onValueChange={(value) => setStaffTetapkanment(prev => ({ ...prev, manager_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih manajer cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada Manajer</SelectItem>
                  {getAvailableManagers().map((user) => {
                    const isTetapkaned = users.find(u => u.id === user.id && u.branch_id && u.branch_id !== branchForStaffTetapkanment?.id);
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.username}</span>
                          {isTetapkaned && <span className="text-xs text-orange-600">(Tetapkaned to other branch)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only users with "Manajer Cabang" yang ditampilkan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier">Cashier</Label>
              <Select
                value={staffTetapkanment.cashier_id || 'none'}
                onValueChange={(value) => setStaffTetapkanment(prev => ({ ...prev, cashier_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kasir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada Kasir</SelectItem>
                  {getAvailableCashiers().map((user) => {
                    const isTetapkaned = users.find(u => u.id === user.id && u.branch_id && u.branch_id !== branchForStaffTetapkanment?.id);
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.username}</span>
                          {isTetapkaned && <span className="text-xs text-orange-600">(Tetapkaned to other branch)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only users with "Cashier" yang ditampilkan
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>💡 Info:</strong> Tetapkaning a user who is already assigned to another branch will automatically unassign them from the previous branch.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseStaffDialog}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Tetapkan Staf'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus cabang secara permanen <strong>{branchToDelete?.name}</strong>.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogBatal>Batal</AlertDialogBatal>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Cabang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BranchManagement;