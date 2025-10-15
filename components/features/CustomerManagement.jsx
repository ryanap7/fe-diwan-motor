'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Users, Plus, Edit, Trash2, Power, Loader2, Search, 
  Phone, Mail, MapPin, Calendar, TrendingUp, Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { customersAPI } from '@/lib/api';

const CustomerManagement = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Form states
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    is_active: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Verifikasi token tersedia sebelum fetch data
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Please login first.');
      return;
    }
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      
      // Handle API response - correct structure based on API testing
      console.log('Customers API Response:', response);
      
      const customers = Array.isArray(response?.data?.customers) ? response.data.customers : 
                       Array.isArray(response?.data?.data) ? response.data.data : 
                       Array.isArray(response?.data) ? response.data : [];
      
      console.log('Extracted Customers:', customers.length, customers);
      setCustomers(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data customer: ' + (error.response?.data?.message || error.message),
        variant: 'destructive'
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (customerId) => {
    try {
      // Customer history belum ada di API dokumentasi, gunakan fallback
      // const response = await customersAPI.getById(customerId);
      // setCustomerHistory(response.data.history || []);
      setCustomerHistory([]); // Temporary fallback
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat pembelian',
        variant: 'destructive'
      });
      setCustomerHistory([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
        is_active: customer.isActive !== undefined ? customer.isActive : true
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
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
      // Convert form data to API structure
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        notes: formData.notes,
        isActive: formData.is_active
      };
      
      if (editingCustomer) {
        const response = await customersAPI.update(editingCustomer.id, customerData);
        if (response.success) {
          toast({
            title: 'Berhasil',
            description: 'Customer berhasil diperbarui!'
          });
        } else {
          throw new Error(response.error || 'Failed to update customer');
        }
      } else {
        const response = await customersAPI.create(customerData);
        if (response.success) {
          toast({
            title: 'Berhasil',
            description: 'Customer berhasil ditambahkan!'
          });
        } else {
          throw new Error(response.error || 'Failed to create customer');
        }
      }

      fetchCustomerData();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan customer: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (customer) => {
    try {
      const response = await customersAPI.toggleActive(customer.id);
      if (response.success) {
        const status = customer.isActive ? 'dinonaktifkan' : 'diaktifkan';
        toast({
          title: 'Berhasil',
          description: `Customer ${status}!`
        });
        fetchCustomerData();
      } else {
        throw new Error(response.error || 'Failed to toggle customer status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengubah status customer: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await customersAPI.delete(customerToDelete.id);
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Customer berhasil dihapus!'
        });
        fetchCustomerData();
        setDeleteDialogOpen(false);
      } else {
        throw new Error(response.error || 'Failed to delete customer');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus customer: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchSearch = searchQuery === '' || 
      (customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center animate-pulse">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kelola Customer</h3>
          <p className="text-sm text-muted-foreground">Manajemen data pelanggan</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
            <Input
              placeholder="Cari customer (nama, telepon, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className={`${!customer.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Customer Info */}
                <div className="lg:col-span-6">
                  <div className="flex items-start gap-3">
                    <Users className="w-8 h-8 mt-1 text-blue-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{customer.name}</h4>
                        {!customer.isActive && (
                          <Badge variant="destructive">Nonaktif</Badge>
                        )}
                      </div>
                          
                          <div className="space-y-1 text-sm">
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{customer.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Stats */}
                    <div className="lg:col-span-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            Bergabung: {new Date(customer.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        {customer.last_purchase && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              Pembelian terakhir: {new Date(customer.last_purchase).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            Total pembelian: {customer.total_purchases || 0}x
                          </span>
                        </div>
                      </div>
                    </div>

                {/* Actions */}
                <div className="lg:col-span-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(customer)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        fetchCustomerHistory(customer.id);
                        setHistoryDialogOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Package className="w-3 h-3 mr-1" />
                      History
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(customer)}
                      className={customer.isActive ? 'hover:bg-orange-50' : 'hover:bg-green-50'}
                    >
                      <Power className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCustomerToDelete(customer);
                        setDeleteDialogOpen(true);
                      }}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Tidak ada customer ditemukan
            </h3>
            <p className="text-muted-foreground">
              Tambah customer baru atau ubah filter pencarian
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Tambah Customer Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Perbarui informasi customer' : 'Tambahkan customer baru ke sistem'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Customer <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nama lengkap customer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="081234567890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Alamat lengkap customer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Catatan tambahan tentang customer"
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
                    {editingCustomer ? 'Perbarui' : 'Tambah'} Customer
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Purchase History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Riwayat Pembelian - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              History transaksi dan pembelian customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {customerHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerHistory.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>{transaction.invoice_number}</TableCell>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>Rp {transaction.total?.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">Belum ada riwayat pembelian</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus customer "{customerToDelete?.name}"? 
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

export default CustomerManagement;