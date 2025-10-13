'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Plus, Edit, Trash2, Power, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { categoriesAPI } from '@/lib/api';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('CategoryManagement - Starting to fetch data...');
      const response = await categoriesAPI.getAll();
      
      // Safely extract data from API response with multiple format support
      const extractArrayData = (response) => {
        // Handle direct array
        if (Array.isArray(response)) return response;
        
        // Handle API3 structure: { data: { categories: [...] } }
        if (response?.data?.categories && Array.isArray(response.data.categories)) {
          return response.data.categories;
        }
        
        // Handle legacy structure: { data: [...] }
        if (response?.data && Array.isArray(response.data)) return response.data;
        
        // Handle success wrapper: { success: true, data: [...] }
        if (response?.success && Array.isArray(response.data)) return response.data;
        
        console.warn('Unexpected API response structure:', response);
        return [];
      };
      
      const categoryData = extractArrayData(response);
      console.log('CategoryManagement - Raw API Response:', response);
      console.log('CategoryManagement - Extracted Data:', categoryData);
      
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set empty state on error
      setCategories([]);
      
      toast.error('Gagal memuat kategori: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parent_id: category.parentId || category.parent_id || '',
        is_active: category.isActive ?? category.is_active ?? true
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parent_id: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert form data to API3 format
      const categoryData = {
        name: formData.name,
        parentId: formData.parent_id || null,
        description: formData.description,
        isActive: formData.is_active
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, categoryData);
        toast.success('Kategori berhasil diperbarui!');
      } else {
        await categoriesAPI.create(categoryData);
        toast.success('Kategori berhasil dibuat!');
      }

      fetchCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error.response?.data?.message || error.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const currentStatus = category.isActive ?? category.is_active;
      const newStatus = !currentStatus;
      await categoriesAPI.updateStatus(category.id, { isActive: newStatus });
      
      const message = newStatus ? 'diaktifkan' : 'dinonaktifkan';
      toast.success(`Kategori berhasil ${message}!`);
      fetchCategories();
    } catch (error) {
      console.error('Failed to toggle category status:', error);
      toast.error('Gagal mengubah status kategori: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      // Ask user if they want to cascade delete subcategories
      const hasSubcategories = categories.some(cat => 
        (cat.parentId || cat.parent_id) === categoryToDelete.id
      );
      const cascade = hasSubcategories ? 
        window.confirm('Kategori ini memiliki subkategori. Hapus juga semua subkategori?') : false;
      
      await categoriesAPI.delete(categoryToDelete.id, cascade);
      toast.success('Kategori berhasil dihapus!');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Gagal menghapus kategori: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getParentCategories = () => {
    return categories.filter(cat => !(cat.parentId || cat.parent_id));
  };

  const getChildCategories = (parentId) => {
    return categories.filter(cat => (cat.parentId || cat.parent_id) === parentId);
  };

  const renderCategoryTree = () => {
    const parentCategories = getParentCategories();

    if (parentCategories.length === 0) {
      return (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada kategori</h3>
            <p className="text-muted-foreground mb-6">Mulai dengan menambahkan kategori pertama Anda</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori Pertama
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {parentCategories.map((parent) => {
          const children = getChildCategories(parent.id);
          const childCount = children.length;
          
          return (
            <Card key={parent.id} className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{parent.name}</h3>
                          <Badge variant={(parent.isActive ?? parent.is_active) ? 'default' : 'secondary'} className={(parent.isActive ?? parent.is_active) ? 'bg-green-500' : ''}>
                            {(parent.isActive ?? parent.is_active) ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          {childCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {childCount} Sub-kategori
                            </Badge>
                          )}
                        </div>
                        {parent.description && (
                          <p className="text-sm text-muted-foreground mt-1">{parent.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(parent)}
                        className="hover:bg-blue-50"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Ubah
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(parent)}
                        className={(parent.isActive ?? parent.is_active) ? 'hover:bg-orange-50' : 'hover:bg-green-50'}
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {(parent.isActive ?? parent.is_active) ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCategoryToDelete(parent);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {childCount > 0 && (
                  <div className="p-4 space-y-2">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{child.name}</span>
                              <Badge variant={child.is_active ? 'default' : 'secondary'} className={child.is_active ? 'text-xs bg-green-500' : 'text-xs'}>
                                {child.is_active ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                            </div>
                            {child.description && (
                              <p className="text-xs text-muted-foreground mt-1">{child.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(child)}
                            className="h-8 px-2 hover:bg-blue-50"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(child)}
                            className="h-8 px-2 hover:bg-orange-50"
                          >
                            <Power className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCategoryToDelete(child);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-8 px-2 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
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
          <h3 className="text-lg font-semibold text-gray-900">Kelola Kategori Produk</h3>
          <p className="text-sm text-muted-foreground">Total: {categories.length} kategori</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {renderCategoryTree()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Perbarui informasi kategori' : 'Buat kategori produk baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kategori <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Masukkan nama kategori"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Kategori Induk (Opsional)</Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) => handleChange('parent_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori induk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada (Kategori Utama)</SelectItem>
                  {getParentCategories().filter(cat => cat.id !== editingCategory?.id).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Kosongkan jika ini kategori utama
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Deskripsi kategori (opsional)"
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
                  editingCategory ? 'Perbarui Kategori' : 'Buat Kategori'
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
              Ini akan menghapus kategori <strong>{categoryToDelete?.name}</strong> secara permanen.
              {categoryToDelete && getChildCategories(categoryToDelete.id).length > 0 && (
                <span className="block mt-2 text-orange-600 font-semibold">
                  ⚠️ Kategori ini memiliki {getChildCategories(categoryToDelete.id).length} sub-kategori. Sub-kategori akan menjadi kategori utama.
                </span>
              )}
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Kategori
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoryManagement;
