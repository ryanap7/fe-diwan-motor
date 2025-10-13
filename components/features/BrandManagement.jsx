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
import { toast } from 'sonner';
import { brandsAPI } from '@/lib/api';

const BrandManagement = () => {
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
          toast.error('Server configuration error: Brands endpoint returning wrong data type. Please contact administrator.');
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
      
      setBrands(brandData);
    } catch (error) {
      console.error('Failed to load brands:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set empty state on error
      setBrands([]);
      
      toast.error('Gagal memuat brand: ' + (error.response?.data?.message || error.message));
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
        toast.success('Brand berhasil diperbarui!');
      } else {
        await brandsAPI.create(brandData);
        toast.success('Brand berhasil dibuat!');
      }

      fetchBrands();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save brand:', error);
      toast.error(error.response?.data?.message || error.message || 'Gagal menyimpan brand');
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
      toast.success(`Brand berhasil ${message}!`);
      fetchBrands();
    } catch (error) {
      console.error('Failed to toggle brand status:', error);
      toast.error('Gagal mengubah status brand: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    try {
      await brandsAPI.delete(brandToDelete.id);
      toast.success('Brand berhasil dihapus!');
      fetchBrands();
    } catch (error) {
      console.error('Failed to delete brand:', error);
      toast.error('Gagal menghapus brand: ' + (error.response?.data?.message || error.message));
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kelola Brand/Merk</h3>
          <p className="text-sm text-muted-foreground">Total: {brands.length} brand</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada brand</h3>
            <p className="text-muted-foreground mb-6">Mulai dengan menambahkan brand pertama Anda</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Brand Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={(brand.isActive ?? brand.is_active) ? 'default' : 'secondary'} className={(brand.isActive ?? brand.is_active) ? 'bg-green-500' : ''}>
                    {(brand.isActive ?? brand.is_active) ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{brand.name}</h3>
                {brand.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{brand.description}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(brand)}
                    className="flex-1 hover:bg-blue-50"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Ubah
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(brand)}
                    className={(brand.isActive ?? brand.is_active) ? 'flex-1 hover:bg-orange-50' : 'flex-1 hover:bg-green-50'}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {(brand.isActive ?? brand.is_active) ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBrandToDelete(brand);
                      setDeleteDialogOpen(true);
                    }}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingBrand ? 'Ubah Brand' : 'Tambah Brand Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingBrand ? 'Perbarui informasi brand' : 'Buat brand produk baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
