'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Building2, Plus, Edit, Trash2, Power, Loader2, Search, Star, 
  TrendingUp, TrendingDown, Package, MapPin, Phone, Mail, FileText,
  Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  
  // Form states
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: '',
    delivery_terms: '',
    notes: '',
    is_active: true
  });

  const [mappingData, setMappingData] = useState({
    product_ids: [],
    lead_time_days: '',
    unit_price: '',
    minimum_order: '',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [suppliersRes, productsRes, performanceRes] = await Promise.all([
        axios.get('/api/suppliers', { headers }),
        axios.get('/api/products', { headers }),
        axios.get('/api/suppliers/performance', { headers }).catch(() => ({ data: [] }))
      ]);

      setSuppliers(suppliersRes.data || []);
      setProducts(productsRes.data || []);
      setSupplierPerformance(performanceRes.data || []);
    } catch (error) {
      toast.error('Gagal memuat data supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenDialog = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        payment_terms: supplier.payment_terms || '',
        delivery_terms: supplier.delivery_terms || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active !== undefined ? supplier.is_active : true
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        payment_terms: '',
        delivery_terms: '',
        notes: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      if (editingSupplier) {
        await axios.post(`/api/suppliers/${editingSupplier.id}/update`, formData, {
          headers: { Authorization: 'Bearer ' + token }
        });
        toast.success('Supplier berhasil diperbarui!');
      } else {
        await axios.post('/api/suppliers/create', formData, {
          headers: { Authorization: 'Bearer ' + token }
        });
        toast.success('Supplier berhasil ditambahkan!');
      }

      fetchSupplierData();
      setDialogOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (supplier) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/suppliers/${supplier.id}/toggle`, {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success(`Supplier ${supplier.is_active ? 'dinonaktifkan' : 'diaktifkan'}!`);
      fetchSupplierData();
    } catch (error) {
      toast.error('Gagal mengubah status supplier');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/suppliers/${supplierToDelete.id}/delete`, {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success('Supplier berhasil dihapus!');
      fetchSupplierData();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Gagal menghapus supplier');
    }
  };

  const handleProductMapping = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/suppliers/${selectedSupplier.id}/map-products`, mappingData, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success('Product mapping berhasil disimpan!');
      fetchSupplierData();
      setMappingDialogOpen(false);
      setMappingData({
        product_ids: [],
        lead_time_days: '',
        unit_price: '',
        minimum_order: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Gagal menyimpan product mapping');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPerformanceRating = (supplierId) => {
    const performance = supplierPerformance.find(p => p.supplier_id === supplierId);
    if (!performance) return { rating: 0, stats: null };
    
    const avgDeliveryTime = performance.avg_delivery_time || 0;
    const onTimeDelivery = performance.on_time_delivery_rate || 0;
    const qualityScore = performance.quality_score || 0;
    
    // Calculate overall rating (1-5 stars)
    const rating = Math.round((onTimeDelivery + qualityScore) / 20);
    
    return {
      rating: Math.max(1, Math.min(5, rating)),
      stats: {
        avgDeliveryTime,
        onTimeDelivery,
        qualityScore,
        totalOrders: performance.total_orders || 0
      }
    };
  };

  const renderStarRating = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data supplier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kelola Supplier</h3>
          <p className="text-sm text-muted-foreground">Manajemen data supplier dan performance tracking</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Supplier
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Daftar Supplier</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari supplier (nama, kontak, email)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredSuppliers.map((supplier) => {
              const performance = getPerformanceRating(supplier.id);
              
              return (
                <Card key={supplier.id} className={`${!supplier.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Supplier Info */}
                      <div className="lg:col-span-6">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-8 h-8 text-blue-500 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{supplier.name}</h4>
                              {!supplier.is_active && (
                                <Badge variant="destructive">Nonaktif</Badge>
                              )}
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              {supplier.contact_person && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span>{supplier.contact_person}</span>
                                </div>
                              )}
                              {supplier.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>{supplier.phone}</span>
                                </div>
                              )}
                              {supplier.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span>{supplier.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance section removed */}

                      {/* Terms */}
                      <div className="lg:col-span-5">
                        <div className="text-sm space-y-1">
                          {supplier.payment_terms && (
                            <div>
                              <span className="font-medium">Payment Terms:</span> {supplier.payment_terms}
                            </div>
                          )}
                          {supplier.delivery_terms && (
                            <div>
                              <span className="font-medium">Delivery Terms:</span> {supplier.delivery_terms}
                            </div>
                          )}
                          {supplier.address && (
                            <div>
                              <span className="font-medium">Address:</span> {supplier.address}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-1">
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(supplier)}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(supplier)}
                            className={`text-xs ${supplier.is_active ? 'hover:bg-orange-50' : 'hover:bg-green-50'}`}
                          >
                            <Power className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSupplierToDelete(supplier);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-xs hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredSuppliers.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada supplier ditemukan
                </h3>
                <p className="text-muted-foreground">
                  Tambah supplier baru atau ubah filter pencarian
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance and Product Mapping tabs removed as requested */}
      </Tabs>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'Perbarui informasi supplier' : 'Tambahkan supplier baru ke sistem'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Supplier <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="PT. Supplier Utama"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="Nama kontak person"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="021-1234567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="supplier@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Alamat lengkap supplier"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => handleChange('payment_terms', e.target.value)}
                  placeholder="Net 30 days, COD, dll"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delivery_terms">Delivery Terms</Label>
                <Input
                  id="delivery_terms"
                  value={formData.delivery_terms}
                  onChange={(e) => handleChange('delivery_terms', e.target.value)}
                  placeholder="FOB, CIF, dll"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Catatan tambahan tentang supplier"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {editingSupplier ? 'Perbarui' : 'Tambah'} Supplier
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Mapping Dialog removed */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus supplier "{supplierToDelete?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierManagement;