'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Edit, Trash2, Power, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { brandsAPI } from '@/lib/api';

const BrandManagement = () => {
  const { toast } = useToast();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  // Verifikasi token tersedia sebelum fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Please login first.');
      return;
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      console.log('BrandManagement - Starting to fetch data...');
      console.log('BrandManagement - Calling brandsAPI.getAll()...');
      const response = await brandsAPI.getAll();
      
      // Safely extract data from API response with multiple format support
      const extractArrayData = (response) => {
        // Handle direct array
        if (Array.isArray(response)) return response;
        
        // Handle API3 structure: { data: { brands: [...] } }
        if (response?.data?.brands && Array.isArray(response.data.brands)) {
          return response.data.brands;
        }
        
        // CRITICAL: Check if server returned branches data instead of brands
        if (response?.data?.branches && Array.isArray(response.data.branches)) {
          console.error('❌ SERVER ERROR: /brands endpoint returned branches data!');
          console.error('This indicates a server-side routing or controller issue');
          console.error('Expected: { data: { brands: [...] } }');
          console.error('Received: { data: { branches: [...] } }');
          
          // Show user-friendly error
          toast({
            title: 'Error',
            description: 'Server configuration error: Brands endpoint returning wrong data type. Please contact administrator.',
            variant: 'destructive'
          });
          return [];
        }
        
        // Handle legacy structure: { data: [...] }
        if (response?.data && Array.isArray(response.data)) return response.data;
        
        // Handle success wrapper: { success: true, data: [...] }
        if (response?.success && Array.isArray(response.data)) return response.data;
        
        console.warn('Unexpected API response structure:', response);
        return [];
      };
      
      const brandData = extractArrayData(response);
      console.log('BrandManagement - Raw API Response:', response);
      console.log('BrandManagement - Extracted Data:', brandData);
      // Sort brands A -> Z by name before setting state
      const safeName = (item) => (item?.name || item?.title || '').toString();
      const sortedBrands = Array.isArray(brandData)
        ? brandData.slice().sort((a, b) => safeName(a).localeCompare(safeName(b)))
        : [];

      setBrands(sortedBrands);
    } catch (error) {
      console.error('Failed to load brands:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set empty state on error
      setBrands([]);
      
      toast({
        title: 'Error',
        description: 'Gagal memuat brand: ' + (error.response?.data?.message || error.message),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        description: brand.description || '',
        is_active: brand.isActive ?? brand.is_active ?? true
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBrand(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert form data to API3 format
      const brandData = {
        name: formData.name,
        description: formData.description,
        isActive: formData.is_active
      };

      if (editingBrand) {
        await brandsAPI.update(editingBrand.id, brandData);
        toast({
          title: 'Berhasil',
          description: 'Brand berhasil diperbarui!'
        });
      } else {
        await brandsAPI.create(brandData);
        toast({
          title: 'Berhasil',
          description: 'Brand berhasil dibuat!'
        });
      }

      fetchBrands();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save brand:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Gagal menyimpan brand',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (brand) => {
    try {
      const currentStatus = brand.isActive ?? brand.is_active;
      const newStatus = !currentStatus;
      await brandsAPI.updateStatus(brand.id, { isActive: newStatus });
      
      const message = newStatus ? 'diaktifkan' : 'dinonaktifkan';
      toast({
        title: 'Berhasil',
        description: `Brand berhasil ${message}!`
      });
      fetchBrands();
    } catch (error) {
      console.error('Failed to toggle brand status:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status brand: ' + (error.response?.data?.message || error.message),
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    try {
      await brandsAPI.delete(brandToDelete.id);
      toast({
        title: 'Berhasil',
        description: 'Brand berhasil dihapus!'
      });
      fetchBrands();
    } catch (error) {
      console.error('Failed to delete brand:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus brand: ' + (error.response?.data?.message || error.message),
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-3">
              <div className="bg-gray-200 rounded h-14"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6 sm:px-6 lg:px-8">
      {/* Mobile-responsive header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Kelola Merk</h3>
          <p className="text-sm text-muted-foreground">Total: {brands.length} brand</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="w-full text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 sm:w-auto"
          size="sm"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Tambah Brand</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </div>

      {brands.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-gray-900">Belum ada brand</h3>
            <p className="mb-6 text-muted-foreground">Mulai dengan menambahkan brand pertama Anda</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Brand Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {brands.map((brand) => (
            <Card key={brand.id} className="border-0 rounded-md shadow-sm hover:shadow-md">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{brand.name}</h3>
                      {brand.description && (
                        <p className="text-[12px] text-muted-foreground truncate hidden lg:block">{brand.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(brand)}
                          className="p-1 w-9 h-9 rounded-md flex items-center justify-center"
                          title="Ubah"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(brand)}
                          className={`${(brand.isActive ?? brand.is_active) ? 'hover:bg-orange-50' : 'hover:bg-green-50'} p-1 w-9 h-9 rounded-md flex items-center justify-center`}
                          title={(brand.isActive ?? brand.is_active) ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <Power className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBrandToDelete(brand);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1 w-9 h-9 rounded-md flex items-center justify-center text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-3">
                    <Badge variant={(brand.isActive ?? brand.is_active) ? 'default' : 'secondary'} className={(brand.isActive ?? brand.is_active) ? 'bg-green-500 text-[12px] px-3 py-1 rounded-full' : 'text-[12px] px-3 py-1 rounded-full'}>
                      {(brand.isActive ?? brand.is_active) ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingBrand ? 'Ubah Brand' : 'Tambah Brand Baru'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingBrand ? 'Perbarui informasi brand' : 'Buat brand produk baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Brand <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Masukkan nama brand"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Deskripsi brand (opsional)"
                rows={3}
                className="resize-none"
              />
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
                className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  editingBrand ? 'Perbarui Brand' : 'Buat Brand'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus brand <strong>{brandToDelete?.name}</strong> secara permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrandManagement;
