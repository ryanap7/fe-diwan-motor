'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Building2, Plus, Edit, Trash2, Power, Loader2, Search, 
  MapPin, Phone, Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { suppliersAPI, setDevToken } from '@/lib/api';

const SupplierManagement = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: '',
    deliveryTerms: '',
    notes: '',
    isActive: true
  });

  // Mapping data state removed

  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Set JWT token untuk API calls
    setDevToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDY3MTksImV4cCI6MTc2MTA1MTUxOX0.bkc5J4eRmToxZs9HyPDs7fAa0_6GnoLE1kKIBaTzkLM');
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      console.log('Fetching suppliers data...');
      
      const response = await suppliersAPI.getAll();
      
      console.log('=== SUPPLIERS DEBUG ===');
      console.log('Raw API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response.success:', response?.success);
      console.log('Response.data:', response?.data);
      console.log('Response.data type:', typeof response?.data);
      if (response?.data) {
        console.log('Response.data keys:', Object.keys(response.data));
      }
      
      // Handle API response structure berdasarkan format yang benar: data.suppliers
      let suppliers = [];
      if (response?.success && response.data?.suppliers) {
        suppliers = response.data.suppliers;
        console.log('✅ Found suppliers in response.data.suppliers:', suppliers.length);
      } else if (Array.isArray(response?.data)) {
        suppliers = response.data;
        console.log('✅ Using response.data as array:', suppliers.length);
      } else if (Array.isArray(response)) {
        suppliers = response;
        console.log('✅ Using response as array:', suppliers.length);
      } else {
        console.log('❌ No suppliers found in response');
      }
      
      console.log('Final processed suppliers:', suppliers);
      console.log('Suppliers count:', suppliers.length);
      console.log('========================');
      
      setSuppliers(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data supplier: " + (error.response?.data?.message || error.message),
        variant: "destructive",
      });
      setSuppliers([]);
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
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        paymentTerms: supplier.paymentTerms || '',
        deliveryTerms: supplier.deliveryTerms || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive !== undefined ? supplier.isActive : true
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: '',
        deliveryTerms: '',
        notes: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert form data to API structure
      const supplierData = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        paymentTerms: formData.paymentTerms,
        deliveryTerms: formData.deliveryTerms,
        notes: formData.notes,
        isActive: formData.isActive
      };
      
      if (editingSupplier) {
        const response = await suppliersAPI.update(editingSupplier.id, supplierData);
        if (response.success) {
          toast({
            title: "Sukses",
            description: "Supplier berhasil diperbarui!",
          });
        } else {
          throw new Error(response.error || 'Failed to update supplier');
        }
      } else {
        const response = await suppliersAPI.create(supplierData);
        if (response.success) {
          toast({
            title: "Sukses",
            description: "Supplier berhasil ditambahkan!",
          });
        } else {
          throw new Error(response.error || 'Failed to create supplier');
        }
      }

      fetchSupplierData();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan supplier: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (supplier) => {
    try {
      const newActiveStatus = !supplier.isActive;
      await suppliersAPI.updateStatus(supplier.id, newActiveStatus);
      
      const status = supplier.isActive ? 'dinonaktifkan' : 'diaktifkan';
      toast({
        title: "Sukses",
        description: `Supplier ${status}!`,
      });
      fetchSupplierData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status supplier: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await suppliersAPI.delete(supplierToDelete.id);
      if (response.success) {
        toast({
          title: "Sukses",
          description: "Supplier berhasil dihapus!",
        });
        fetchSupplierData();
        setDeleteDialogOpen(false);
      } else {
        throw new Error(response.error || 'Failed to delete supplier');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus supplier: " + error.message,
        variant: "destructive",
      });
    }
  };

  const filteredSuppliers = Array.isArray(suppliers) ? suppliers.filter(supplier =>
    (supplier.name && supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  console.log('=== SUPPLIER DEBUG ===');
  console.log('Loading state:', loading);
  console.log('Suppliers state:', suppliers);
  console.log('Suppliers length:', suppliers?.length);
  console.log('Filtered suppliers:', filteredSuppliers);
  console.log('Filtered length:', filteredSuppliers?.length);
  console.log('Search query:', searchQuery);
  console.log('Is suppliers array:', Array.isArray(suppliers));
  console.log('========================');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center animate-pulse">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data supplier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
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

          {/* Debug Info */}
          <div className="p-4 mb-4 border border-yellow-200 rounded bg-yellow-50">
            <h4 className="font-semibold text-yellow-800">Debug Information:</h4>
            <p className="text-sm text-yellow-700">
              Total Suppliers: {suppliers.length} | 
              Filtered: {filteredSuppliers.length} | 
              Loading: {loading ? 'Yes' : 'No'}
            </p>
          </div>

          {/* Supplier List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => {
                console.log('Rendering supplier:', supplier);
                return (
                  <Card key={supplier.id || supplier.name} className={`${supplier.isActive === false ? 'opacity-60 bg-gray-50' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        {/* Supplier Info */}
                        <div className="lg:col-span-6">
                          <div className="flex items-start gap-3">
                            <Building2 className="w-8 h-8 mt-1 text-blue-500" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-semibold">{supplier.name || 'Unknown Name'}</h4>
                                {supplier.isActive === false && (
                                  <Badge variant="destructive">Nonaktif</Badge>
                                )}
                              </div>
                            
                            <div className="space-y-1 text-sm">
                              {supplier.contactPerson && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{supplier.contactPerson}</span>
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
                        <div className="space-y-1 text-sm">
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
                            className={`text-xs ${supplier.isActive ? 'hover:bg-orange-50' : 'hover:bg-green-50'}`}
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
            })
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No suppliers to display</p>
              </div>
            )}
          </div>

          {filteredSuppliers.length === 0 && !loading && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Tidak ada supplier ditemukan
                </h3>
                <p className="text-muted-foreground">
                  Tambah supplier baru atau ubah filter pencarian
                </p>
                <div className="p-4 mt-4 text-xs text-left bg-gray-100 rounded">
                  <strong>Debug Info:</strong><br/>
                  Total suppliers: {suppliers?.length || 0}<br/>
                  Filtered: {filteredSuppliers?.length || 0}<br/>
                  Loading: {loading ? 'Yes' : 'No'}
                </div>
              </CardContent>
            </Card>
          )}

      </div>

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
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
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
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                  placeholder="Net 30 days, COD, dll"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryTerms">Delivery Terms</Label>
                <Input
                  id="deliveryTerms"
                  value={formData.deliveryTerms}
                  onChange={(e) => handleChange('deliveryTerms', e.target.value)}
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