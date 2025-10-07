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
import { Package, Plus, Edit, Trash2, Power, Loader2, Search, Image as ImageIcon, Tag } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const UOM_OPTIONS = ['Pcs', 'Unit', 'Box', 'Lusin', 'Karton', 'Kg', 'Liter', 'Meter', 'Set'];

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category_id: '',
    brand_id: '',
    compatible_models: '',
    uom: 'Pcs',
    purchase_price: '',
    retail_price: '',
    wholesale_price: '',
    member_price: '',
    barcode: '',
    images: ['', '', ''],
    specifications: '',
    storage_location: '',
    tags: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: 'Bearer ' + token };

      const [productsRes, categoriesRes, brandsRes, branchesRes] = await Promise.all([
        axios.get('/api/products', { headers }),
        axios.get('/api/categories', { headers }),
        axios.get('/api/brands', { headers }),
        axios.get('/api/branches', { headers })
      ]);

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        compatible_models: product.compatible_models || '',
        uom: product.uom || 'Pcs',
        purchase_price: product.purchase_price || '',
        retail_price: product.price_levels?.retail || '',
        wholesale_price: product.price_levels?.wholesale || '',
        member_price: product.price_levels?.member || '',
        barcode: product.barcode || '',
        images: product.images || ['', '', ''],
        specifications: product.technical_specs || '',
        storage_location: product.storage_location || '',
        tags: product.tags ? product.tags.join(', ') : '',
        is_active: product.is_active
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        category_id: '',
        brand_id: '',
        compatible_models: '',
        uom: 'Pcs',
        purchase_price: '',
        retail_price: '',
        wholesale_price: '',
        member_price: '',
        barcode: '',
        images: ['', '', ''],
        specifications: '',
        storage_location: '',
        tags: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const calculateMargin = (purchase, selling) => {
    if (!purchase || !selling) return 0;
    const margin = ((selling - purchase) / selling) * 100;
    return margin.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: 'Bearer ' + token };

      const dataToSend = {
        sku: formData.sku,
        name: formData.name,
        category_id: formData.category_id,
        brand_id: formData.brand_id,
        compatible_models: formData.compatible_models,
        uom: formData.uom,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        price_levels: {
          retail: parseFloat(formData.retail_price) || 0,
          wholesale: parseFloat(formData.wholesale_price) || 0,
          member: parseFloat(formData.member_price) || 0
        },
        barcode: formData.barcode,
        images: formData.images.filter(img => img.trim() !== ''),
        technical_specs: formData.specifications,
        storage_location: formData.storage_location,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t !== '') : [],
        is_active: formData.is_active
      };

      if (editingProduct) {
        await axios.post('/api/products/' + editingProduct.id + '/update', dataToSend, { headers });
        toast.success('Produk berhasil diperbarui!');
      } else {
        await axios.post('/api/products/create', dataToSend, { headers });
        toast.success('Produk berhasil dibuat!');
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/products/' + product.id + '/toggle', {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const message = product.is_active ? 'dinonaktifkan' : 'diaktifkan';
      toast.success('Produk ' + message + '!');
      fetchData();
    } catch (error) {
      toast.error('Gagal mengubah status produk');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/products/' + productToDelete.id + '/delete', {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success('Produk berhasil dihapus!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal menghapus produk');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : '-';
  };

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : '-';
  };

  const filteredProducts = products.filter(product => {
    const matchSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchCategory = filterCategory === 'all' || product.category_id === filterCategory;
    const matchBrand = filterBrand === 'all' || product.brand_id === filterBrand;

    return matchSearch && matchCategory && matchBrand;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-32 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-semibold text-gray-900">Kelola Produk</h3>
          <p className="text-sm text-muted-foreground">Total: {filteredProducts.length} produk</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari produk (nama/SKU)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Brand</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {products.length === 0 ? 'Belum ada produk' : 'Tidak ada produk yang cocok'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {products.length === 0 ? 'Mulai dengan menambahkan produk pertama Anda' : 'Coba ubah filter atau kata kunci pencarian'}
            </p>
            {products.length === 0 && (
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const margin = calculateMargin(product.purchase_price, product.price_levels?.retail);
            const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
            
            return (
              <Card
                key={product.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {mainImage && (
                  <div className="h-40 bg-gray-100 relative overflow-hidden">
                    <img 
                      src={mainImage} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs mb-2">
                        {product.sku}
                      </Badge>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{getCategoryName(product.category_id)}</span>
                        <span>•</span>
                        <span>{getBrandName(product.brand_id)}</span>
                      </div>
                    </div>
                    <Badge variant={product.is_active ? 'default' : 'secondary'} className={product.is_active ? 'bg-green-500' : ''}>
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3 border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Retail:</span>
                      <span className="font-semibold">Rp {product.price_levels?.retail?.toLocaleString('id-ID') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Grosir:</span>
                      <span>Rp {product.price_levels?.wholesale?.toLocaleString('id-ID') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Member:</span>
                      <span>Rp {product.price_levels?.member?.toLocaleString('id-ID') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className={parseFloat(margin) > 20 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                        {margin}%
                      </span>
                    </div>
                  </div>

                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {product.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(product)}
                      className="flex-1 hover:bg-blue-50"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Ubah
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                      className={product.is_active ? 'hover:bg-orange-50' : 'hover:bg-green-50'}
                    >
                      <Power className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProductToDelete(product);
                        setDeleteDialogOpen(true);
                      }}
                      className="hover:bg-red-50 hover:text-red-600"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingProduct ? 'Ubah Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Perbarui informasi produk' : 'Buat produk baru dengan detail lengkap'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU/Part Number <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="contoh: BR-MTR-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  placeholder="Barcode produk"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Produk <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="contoh: Ban Motor Tubeless 120/70-17"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kategori <span className="text-red-500">*</span></Label>
                <Select value={formData.category_id} onValueChange={(value) => handleChange('category_id', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand <span className="text-red-500">*</span></Label>
                <Select value={formData.brand_id} onValueChange={(value) => handleChange('brand_id', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>UOM</Label>
                <Select value={formData.uom} onValueChange={(value) => handleChange('uom', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UOM_OPTIONS.map((uom) => (
                      <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Model Kendaraan Compatible</Label>
              <Input
                value={formData.compatible_models}
                onChange={(e) => handleChange('compatible_models', e.target.value)}
                placeholder="contoh: Yamaha R15, Honda CBR150R, Suzuki GSX-R150"
              />
              <p className="text-xs text-muted-foreground">Pisahkan dengan koma untuk multiple model</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Harga Beli <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange('purchase_price', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Retail <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.retail_price}
                  onChange={(e) => handleChange('retail_price', e.target.value)}
                  placeholder="0"
                  required
                />
                {formData.purchase_price && formData.retail_price && (
                  <p className="text-xs text-green-600">
                    Margin: {calculateMargin(formData.purchase_price, formData.retail_price)}%
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Harga Grosir</Label>
                <Input
                  type="number"
                  value={formData.wholesale_price}
                  onChange={(e) => handleChange('wholesale_price', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Member</Label>
                <Input
                  type="number"
                  value={formData.member_price}
                  onChange={(e) => handleChange('member_price', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                URL Gambar Produk (Maksimal 3)
              </Label>
              {[0, 1, 2].map((index) => (
                <Input
                  key={index}
                  value={formData.images[index]}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder={'URL Gambar ' + (index + 1)}
                  type="url"
                />
              ))}
              <p className="text-xs text-muted-foreground">Paste URL gambar dari internet</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Spesifikasi Teknis</Label>
                <Textarea
                  value={formData.specifications}
                  onChange={(e) => handleChange('specifications', e.target.value)}
                  placeholder="Detail spesifikasi produk..."
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Lokasi Penyimpanan</Label>
                <Input
                  value={formData.storage_location}
                  onChange={(e) => handleChange('storage_location', e.target.value)}
                  placeholder="contoh: Rak A-3, Gudang Utama"
                />
                <Label className="flex items-center gap-2 mt-4">
                  <Tag className="w-4 h-4" />
                  Tags/Label
                </Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="contoh: promo, best seller, new arrival"
                />
                <p className="text-xs text-muted-foreground">Pisahkan dengan koma</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                  editingProduct ? 'Perbarui Produk' : 'Buat Produk'
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
              Ini akan menghapus produk <strong>{productToDelete?.name}</strong> secara permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductManagement;
