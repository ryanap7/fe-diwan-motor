'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ArrowLeftRight, Edit3, ClipboardList, Barcode, Calendar, Plus, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [opnameDialogOpen, setOpnameDialogOpen] = useState(false);

  // Selected data
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Form states
  const [transferData, setTransferData] = useState({
    product_id: '',
    from_branch_id: '',
    to_branch_id: '',
    quantity: '',
    notes: ''
  });

  const [adjustmentData, setAdjustmentData] = useState({
    product_id: '',
    branch_id: '',
    adjustment_type: 'add', // add, subtract, set
    quantity: '',
    reason: '',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [productsRes, branchesRes] = await Promise.all([
        axios.get('/api/products', { headers }),
        axios.get('/api/branches', { headers })
      ]);

      setProducts(productsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      toast.error('Gagal memuat data inventory');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total stock across all branches for a product
  const getTotalStock = (product) => {
    if (!product.stock_per_branch) return 0;
    return Object.values(product.stock_per_branch).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
  };

  // Get stock for specific branch
  const getBranchStock = (product, branchId) => {
    return product.stock_per_branch?.[branchId] || 0;
  };

  // Filter products based on search and branch
  const filteredProducts = products.filter(product => {
    const matchSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchBranch = selectedBranch === 'all' ||
      (product.stock_per_branch && Object.keys(product.stock_per_branch).includes(selectedBranch));

    return matchSearch && matchBranch;
  });

  // Handle stock transfer
  const handleStockTransfer = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/inventory/transfer', transferData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Transfer stok berhasil!');
      fetchInventoryData();
      setTransferDialogOpen(false);
      setTransferData({
        product_id: '',
        from_branch_id: '',
        to_branch_id: '',
        quantity: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Gagal melakukan transfer stok');
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/inventory/adjustment', adjustmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Penyesuaian stok berhasil!');
      fetchInventoryData();
      setAdjustmentDialogOpen(false);
      setAdjustmentData({
        product_id: '',
        branch_id: '',
        adjustment_type: 'add',
        quantity: '',
        reason: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Gagal melakukan penyesuaian stok');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kelola Inventory</h3>
          <p className="text-sm text-muted-foreground">Manajemen stok produk per cabang</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setTransferDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Transfer Stok
          </Button>
          <Button
            onClick={() => setAdjustmentDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Penyesuaian Stok
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview Stok</TabsTrigger>
          <TabsTrigger value="lowstock">Stok Menipis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
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
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setOpnameDialogOpen(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Stock Opname
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Overview */}
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => {
              const totalStock = getTotalStock(product);
              const isLowStock = totalStock < 10; // Configurable threshold

              return (
                <Card key={product.id} className={`${isLowStock ? 'border-orange-200 bg-orange-50' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Product Info */}
                      <div className="lg:col-span-4">
                        <div className="flex items-start gap-3">
                          {product.images && product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {product.sku}
                              </Badge>
                              {isLowStock && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Stok Menipis
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Total Stok: <span className="font-semibold">{totalStock} unit</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stock per Branch */}
                      <div className="lg:col-span-6">
                        <div className="grid grid-cols-2 gap-2">
                          {branches.map((branch) => {
                            const branchStock = getBranchStock(product, branch.id);
                            return (
                              <div key={branch.id} className="p-2 bg-white rounded border">
                                <p className="text-xs font-medium text-gray-600">{branch.name}</p>
                                <p className="text-sm font-semibold">
                                  {branchStock} unit
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-2">
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setTransferData(prev => ({ ...prev, product_id: product.id }));
                              setTransferDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            <ArrowLeftRight className="w-3 h-3 mr-1" />
                            Transfer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setAdjustmentData(prev => ({ ...prev, product_id: product.id }));
                              setAdjustmentDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Adjust
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada produk ditemukan
                </h3>
                <p className="text-muted-foreground">
                  Coba ubah filter pencarian atau tambah produk baru
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Produk Dengan Stok Menipis
              </CardTitle>
              <CardDescription>
                Produk yang perlu segera direstok
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts
                  .filter(product => getTotalStock(product) < 10)
                  .map((product) => (
                    <div key={product.id} className="p-4 border rounded-lg bg-orange-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                          <p className="text-sm font-medium text-orange-600">
                            Sisa: {getTotalStock(product)} unit
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => {
                            // Store product info for PO creation
                            localStorage.setItem('preSelectedProduct', product.id);

                            // Navigate to Purchase Orders using Next.js router
                            router.push('/purchase-orders');

                            // Show success message
                            toast.success(`Navigating to create PO for ${product.name}`);
                          }}
                        >
                          Buat Purchase Order
                        </Button>
                      </div>
                    </div>
                  ))}

                {filteredProducts.filter(product => getTotalStock(product) < 10).length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">Semua produk memiliki stok yang cukup</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking tab removed as requested */}
      </Tabs>

      {/* Stock Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Stok Antar Cabang</DialogTitle>
            <DialogDescription>
              Pindahkan stok produk dari satu cabang ke cabang lain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                value={transferData.product_id}
                onValueChange={(value) => setTransferData(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dari Cabang</Label>
                <Select
                  value={transferData.from_branch_id}
                  onValueChange={(value) => setTransferData(prev => ({ ...prev, from_branch_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ke Cabang</Label>
                <Select
                  value={transferData.to_branch_id}
                  onValueChange={(value) => setTransferData(prev => ({ ...prev, to_branch_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                value={transferData.quantity}
                onChange={(e) => setTransferData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                placeholder="Catatan transfer..."
                value={transferData.notes}
                onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleStockTransfer} className="bg-blue-600 hover:bg-blue-700">
                Transfer Stok
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok Manual</DialogTitle>
            <DialogDescription>
              Koreksi stok produk secara manual
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                value={adjustmentData.product_id}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cabang</Label>
              <Select
                value={adjustmentData.branch_id}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, branch_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipe Penyesuaian</Label>
              <Select
                value={adjustmentData.adjustment_type}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, adjustment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Tambah Stok</SelectItem>
                  <SelectItem value="subtract">Kurangi Stok</SelectItem>
                  <SelectItem value="set">Set Stok Baru</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                value={adjustmentData.quantity}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan</Label>
              <Select
                value={adjustmentData.reason}
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Barang Rusak</SelectItem>
                  <SelectItem value="lost">Barang Hilang</SelectItem>
                  <SelectItem value="found">Barang Ditemukan</SelectItem>
                  <SelectItem value="correction">Koreksi Data</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                placeholder="Catatan tambahan..."
                value={adjustmentData.notes}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleStockAdjustment} className="bg-green-600 hover:bg-green-700">
                Simpan Penyesuaian
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;