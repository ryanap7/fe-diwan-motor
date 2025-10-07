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
  Users, Plus, Edit, Trash2, Power, Loader2, Search, 
  Crown, ShoppingBag, Store, Phone, Mail, MapPin, 
  Calendar, TrendingUp, Package
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  
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
    category: 'retail', // retail, wholesale, vip
    notes: '',
    is_active: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const customersRes = await axios.get('/api/customers', { headers });
      setCustomers(customersRes.data || []);
    } catch (error) {
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/customers/${customerId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomerHistory(response.data || []);
    } catch (error) {
      toast.error('Gagal memuat riwayat pembelian');
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
        category: customer.category || 'retail',
        notes: customer.notes || '',
        is_active: customer.is_active !== undefined ? customer.is_active : true
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        category: 'retail',
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
      
      if (editingCustomer) {
        await axios.post(`/api/customers/${editingCustomer.id}/update`, formData, {
          headers: { Authorization: 'Bearer ' + token }
        });
        toast.success('Customer berhasil diperbarui!');
      } else {
        await axios.post('/api/customers/create', formData, {
          headers: { Authorization: 'Bearer ' + token }
        });
        toast.success('Customer berhasil ditambahkan!');
      }

      fetchCustomerData();
      setDialogOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan customer');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (customer) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/customers/${customer.id}/toggle`, {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success(`Customer ${customer.is_active ? 'dinonaktifkan' : 'diaktifkan'}!`);
      fetchCustomerData();
    } catch (error) {
      toast.error('Gagal mengubah status customer');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/customers/${customerToDelete.id}/delete`, {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      toast.success('Customer berhasil dihapus!');
      fetchCustomerData();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Gagal menghapus customer');
    }
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      retail: { label: 'Retail', variant: 'default', icon: ShoppingBag, color: 'bg-blue-100 text-blue-800' },
      wholesale: { label: 'Wholesale', variant: 'secondary', icon: Store, color: 'bg-green-100 text-green-800' },
      vip: { label: 'VIP', variant: 'destructive', icon: Crown, color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = categoryConfig[category] || categoryConfig.retail;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchSearch = searchQuery === '' || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchCategory = filterCategory === 'all' || customer.category === filterCategory;
    
    return matchSearch && matchCategory;
  });

  // Get customer statistics
  const customerStats = {
    total: customers.length,
    retail: customers.filter(c => c.category === 'retail').length,
    wholesale: customers.filter(c => c.category === 'wholesale').length,
    vip: customers.filter(c => c.category === 'vip').length,
    active: customers.filter(c => c.is_active).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kelola Customer</h3>
          <p className="text-sm text-muted-foreground">Manajemen data pelanggan dan segmentasi</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Customer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Daftar Customer</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentasi</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari customer (nama, telepon, email)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customer Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className={`${!customer.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Customer Info */}
                    <div className="lg:col-span-6">
                      <div className="flex items-start gap-3">
                        <Users className="w-8 h-8 text-blue-500 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{customer.name}</h4>
                            {getCategoryBadge(customer.category)}
                            {!customer.is_active && (
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
                          className={customer.is_active ? 'hover:bg-orange-50' : 'hover:bg-green-50'}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada customer ditemukan
                </h3>
                <p className="text-muted-foreground">
                  Tambah customer baru atau ubah filter pencarian
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="segmentation">
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Customer</p>
                      <p className="text-2xl font-bold">{customerStats.total}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Retail</p>
                      <p className="text-2xl font-bold text-blue-600">{customerStats.retail}</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Wholesale</p>
                      <p className="text-2xl font-bold text-green-600">{customerStats.wholesale}</p>
                    </div>
                    <Store className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">VIP</p>
                      <p className="text-2xl font-bold text-purple-600">{customerStats.vip}</p>
                    </div>
                    <Crown className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Segmentation Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Segmentation</CardTitle>
                <CardDescription>
                  Pembagian customer berdasarkan kategori dan perilaku pembelian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {['retail', 'wholesale', 'vip'].map(category => {
                    const categoryCustomers = customers.filter(c => c.category === category);
                    const percentage = customers.length > 0 ? ((categoryCustomers.length / customers.length) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryBadge(category)}
                            <span className="font-medium">{categoryCustomers.length} customer</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              category === 'retail' ? 'bg-blue-600' : 
                              category === 'wholesale' ? 'bg-green-600' : 'bg-purple-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          
          <div className="space-y-4 mt-4">
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
              <div className="text-center py-8">
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