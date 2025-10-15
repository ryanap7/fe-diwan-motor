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
import { ShoppingCart, Plus, Eye, CheckCircle, Clock, AlertTriangle, Truck, Package2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suppliersAPI, productsAPI, branchesAPI } from '@/lib/api';

const PurchaseOrderManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [createPODialogOpen, setCreatePODialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [viewPODialogOpen, setViewPODialogOpen] = useState(false);
  
  // Selected data
  const [selectedPO, setSelectedPO] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  
  // Form states
  const [poFormData, setPOFormData] = useState({
    supplier_id: '',
    branch_id: '',
    expected_date: '',
    notes: '',
    items: []
  });

  const [receiveFormData, setReceiveFormData] = useState({
    items: [] // { product_id, ordered_qty, received_qty }
  });

  useEffect(() => {
    // Verifikasi token tersedia sebelum fetch data
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Please login first.');
      return;
    }
    
    fetchPurchaseOrderData();
    
    // Check for pre-selected product from Stock Management
    const preSelectedProduct = localStorage.getItem('preSelectedProduct');
    if (preSelectedProduct) {
      // Find the product and auto-suggest PO
      const product = products.find(p => p.id === preSelectedProduct);
      if (product) {
        const totalStock = Object.values(product.stock_per_branch || {})
          .reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
        
        setPOFormData(prev => ({
          ...prev,
          items: [{
            product_id: product.id,
            product_name: product.name,
            current_stock: totalStock,
            min_stock: product.min_stock_level || 10,
            suggested_qty: Math.max(50, (product.min_stock_level || 10) * 2)
          }]
        }));
        setCreatePODialogOpen(true);
        
        // Clear the pre-selected product
        localStorage.removeItem('preSelectedProduct');
      }
    }
  }, [products]);

  const fetchPurchaseOrderData = async () => {
    try {
      // Fetch data dari API yang tersedia
      const [suppliersRes, productsRes, branchesRes] = await Promise.all([
        suppliersAPI.getSuppliers(),
        productsAPI.getProducts(),
        branchesAPI.getBranches()
      ]);

      // Set data suppliers
      if (suppliersRes?.success && suppliersRes.data?.suppliers) {
        setSuppliers(suppliersRes.data.suppliers);
      }

      // Set data products
      if (productsRes?.success && productsRes.data?.products) {
        setProducts(productsRes.data.products);
        
        // Calculate low stock products
        const lowStock = productsRes.data.products.filter(product => {
          const currentStock = parseInt(product.stock) || 0;
          const minStock = parseInt(product.min_stock_level) || 10;
          return currentStock < minStock;
        });
        setLowStockProducts(lowStock);
      }

      // Set data branches
      if (branchesRes?.success && branchesRes.data?.branches) {
        setBranches(branchesRes.data.branches);
      }

      // Karena API purchase orders belum tersedia, gunakan data dummy
      const dummyPOs = [
        {
          id: 'PO001',
          po_number: 'PO-2024-001',
          supplier: { name: 'PT Sumber Motor' },
          status: 'pending',
          total_amount: 15000000,
          expected_date: '2024-01-20',
          created_at: '2024-01-15'
        },
        {
          id: 'PO002', 
          po_number: 'PO-2024-002',
          supplier: { name: 'CV Sparepart Jaya' },
          status: 'received',
          total_amount: 8500000,
          expected_date: '2024-01-18',
          created_at: '2024-01-12'
        }
      ];
      setPurchaseOrders(dummyPOs);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data. Menggunakan data contoh.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate auto PO suggestion
  const generatePOSuggestion = () => {
    const suggestions = lowStockProducts.map(product => ({
      product_id: product.id,
      product_name: product.name,
      current_stock: Object.values(product.stock_per_branch || {})
        .reduce((sum, stock) => sum + (parseInt(stock) || 0), 0),
      min_stock: product.min_stock_level || 10,
      suggested_qty: Math.max(50, (product.min_stock_level || 10) * 2)
    }));

    setPOFormData(prev => ({
      ...prev,
      items: suggestions
    }));
    setCreatePODialogOpen(true);
  };

  // Create purchase order
  const handleCreatePO = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/purchase-orders/create', poFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Purchase Order berhasil dibuat!');
      fetchPurchaseOrderData();
      setCreatePODialogOpen(false);
      setPOFormData({
        supplier_id: '',
        branch_id: '',
        expected_date: '',
        notes: '',
        items: []
      });
    } catch (error) {
      toast.error('Gagal membuat purchase order');
    }
  };

  // Receive goods
  const handleReceiveGoods = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/purchase-orders/${selectedPO.id}/receive`, receiveFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Penerimaan barang berhasil dicatat!');
      fetchPurchaseOrderData();
      setReceiveDialogOpen(false);
      setReceiveFormData({ items: [] });
    } catch (error) {
      toast.error('Gagal mencatat penerimaan barang');
    }
  };

  // Update PO status
  const handleUpdatePOStatus = async (poId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/purchase-orders/${poId}/update-status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Status PO berhasil diubah menjadi ${newStatus}!`);
      fetchPurchaseOrderData();
    } catch (error) {
      toast.error('Gagal mengubah status PO');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Menunggu', variant: 'secondary', icon: Clock },
      'approved': { label: 'Disetujui', variant: 'default', icon: CheckCircle },
      'ordered': { label: 'Dipesan', variant: 'default', icon: ShoppingCart },
      'partial': { label: 'Sebagian Diterima', variant: 'destructive', icon: Package2 },
      'completed': { label: 'Selesai', variant: 'default', icon: CheckCircle },
      'cancelled': { label: 'Dibatalkan', variant: 'destructive', icon: AlertTriangle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data purchase order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Purchase Order & Restock</h3>
          <p className="text-sm text-muted-foreground">Kelola pengadaan dan restock produk</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generatePOSuggestion}
            variant="outline"
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Auto PO Suggestion ({lowStockProducts.length})
          </Button>
          <Button
            onClick={() => setCreatePODialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat PO Baru
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding PO</TabsTrigger>
          <TabsTrigger value="low-stock">Stok Menipis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total PO</p>
                    <p className="text-2xl font-bold">{(purchaseOrders || []).length}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold">
                      {(purchaseOrders || []).filter(po => ['pending', 'approved', 'ordered', 'partial'].includes(po.status)).length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stok Menipis</p>
                    <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selesai Bulan Ini</p>
                    <p className="text-2xl font-bold">
                      {(purchaseOrders || []).filter(po => po.status === 'completed' && 
                        new Date(po.created_at).getMonth() === new Date().getMonth()).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Purchase Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Terbaru</CardTitle>
              <CardDescription>Daftar purchase order yang baru dibuat</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. PO</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Item</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(purchaseOrders || []).slice(0, 5).map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{suppliers.find(s => s.id === po.supplier_id)?.name || '-'}</TableCell>
                      <TableCell>{branches.find(b => b.id === po.branch_id)?.name || '-'}</TableCell>
                      <TableCell>{new Date(po.created_at).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell>{po.items?.length || 0} item</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPO(po);
                              setViewPODialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Lihat
                          </Button>
                          
                          {po.status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleUpdatePOStatus(po.id, 'approved')}
                            >
                              Setujui
                            </Button>
                          )}
                          
                          {po.status === 'approved' && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleUpdatePOStatus(po.id, 'ordered')}
                            >
                              Order
                            </Button>
                          )}
                          
                          {(po.status === 'ordered' || po.status === 'partial') && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedPO(po);
                                setReceiveFormData({ items: po.items || [] });
                                setReceiveDialogOpen(true);
                              }}
                            >
                              <Truck className="w-3 h-3 mr-1" />
                              Terima
                            </Button>
                          )}
                          
                          {po.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdatePOStatus(po.id, 'cancelled')}
                            >
                              Batal
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {(purchaseOrders || []).length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">Belum ada purchase order</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Outstanding Purchase Orders
              </CardTitle>
              <CardDescription>
                PO yang masih menunggu atau dalam proses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. PO</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders
                    .filter(po => ['pending', 'approved', 'ordered', 'partial'].includes(po.status))
                    .map((po) => {
                      const receivedItems = po.items?.filter(item => item.received_qty > 0).length || 0;
                      const totalItems = po.items?.length || 0;
                      const progress = totalItems > 0 ? (receivedItems / totalItems) * 100 : 0;
                      
                      return (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.po_number}</TableCell>
                          <TableCell>{suppliers.find(s => s.id === po.supplier_id)?.name || '-'}</TableCell>
                          <TableCell>
                            {po.expected_date ? new Date(po.expected_date).toLocaleDateString('id-ID') : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(po.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{Math.round(progress)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPO(po);
                                  setViewPODialogOpen(true);
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Lihat
                              </Button>
                              {(po.status === 'approved' || po.status === 'ordered' || po.status === 'partial') && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedPO(po);
                                    setReceiveFormData({ items: po.items || [] });
                                    setReceiveDialogOpen(true);
                                  }}
                                >
                                  <Truck className="w-3 h-3 mr-1" />
                                  Terima
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Produk Stok Menipis
              </CardTitle>
              <CardDescription>
                Produk yang perlu segera direstock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.map((product) => {
                  const totalStock = Object.values(product.stock_per_branch || {})
                    .reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
                  
                  return (
                    <div key={product.id} className="p-4 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          {product.images && product.images[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                            <div className="flex gap-4 mt-2">
                              <span className="text-sm">
                                <strong>Stok Saat Ini:</strong> {totalStock} unit
                              </span>
                              <span className="text-sm">
                                <strong>Min. Stock:</strong> {product.min_stock_level || 10} unit
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => {
                            setPOFormData(prev => ({
                              ...prev,
                              items: [{
                                product_id: product.id,
                                product_name: product.name,
                                current_stock: totalStock,
                                min_stock: product.min_stock_level || 10,
                                suggested_qty: Math.max(50, (product.min_stock_level || 10) * 2)
                              }]
                            }));
                            setCreatePODialogOpen(true);
                          }}
                        >
                          Buat PO
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {lowStockProducts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">Semua produk memiliki stok yang cukup</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create PO Dialog */}
      <Dialog open={createPODialogOpen} onOpenChange={setCreatePODialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Buat Purchase Order Baru</DialogTitle>
            <DialogDescription>
              Buat purchase order untuk restock produk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select 
                  value={poFormData.supplier_id} 
                  onValueChange={(value) => setPOFormData(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cabang Tujuan</Label>
                <Select 
                  value={poFormData.branch_id} 
                  onValueChange={(value) => setPOFormData(prev => ({ ...prev, branch_id: value }))}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Diharapkan</Label>
                <Input
                  type="date"
                  value={poFormData.expected_date}
                  onChange={(e) => setPOFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                placeholder="Catatan tambahan..."
                value={poFormData.notes}
                onChange={(e) => setPOFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items Purchase Order</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Add item row
                    setPOFormData(prev => ({
                      ...prev,
                      items: [
                        ...prev.items,
                        {
                          product_id: '',
                          product_name: '',
                          sku: '',
                          quantity: 10,
                          price: 0
                        }
                      ]
                    }));
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Item
                </Button>
              </div>
              <div className="border rounded p-4 max-h-96 overflow-y-auto">
                {poFormData.items.length > 0 ? (
                  <div className="space-y-3">
                    {poFormData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded border">
                        <div className="col-span-5 space-y-1">
                          <Label className="text-xs">Produk</Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => {
                              const product = products.find(p => p.id === value);
                              const updatedItems = [...poFormData.items];
                              updatedItems[index] = {
                                ...updatedItems[index],
                                product_id: value,
                                product_name: product?.name || '',
                                sku: product?.sku || '',
                                price: product?.purchase_price || 0
                              };
                              setPOFormData(prev => ({ ...prev, items: updatedItems }));
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Pilih produk" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updatedItems = [...poFormData.items];
                              updatedItems[index].quantity = parseInt(e.target.value) || 0;
                              setPOFormData(prev => ({ ...prev, items: updatedItems }));
                            }}
                            className="h-9"
                          />
                        </div>
                        
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Harga</Label>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const updatedItems = [...poFormData.items];
                              updatedItems[index].price = parseInt(e.target.value) || 0;
                              setPOFormData(prev => ({ ...prev, items: updatedItems }));
                            }}
                            className="h-9"
                          />
                        </div>
                        
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Subtotal</Label>
                          <Input
                            type="text"
                            value={new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0
                            }).format(item.quantity * item.price)}
                            disabled
                            className="h-9 bg-gray-100"
                          />
                        </div>
                        
                        <div className="col-span-1 flex items-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const updatedItems = poFormData.items.filter((_, i) => i !== index);
                              setPOFormData(prev => ({ ...prev, items: updatedItems }));
                            }}
                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total Summary */}
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-900">Total PO:</span>
                        <span className="text-xl font-bold text-blue-900">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(
                            poFormData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        Total {poFormData.items.length} item - {poFormData.items.reduce((sum, item) => sum + item.quantity, 0)} unit
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-muted-foreground">Belum ada item yang dipilih</p>
                    <p className="text-sm text-muted-foreground mt-1">Klik "Tambah Item" untuk menambah produk</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setCreatePODialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreatePO} className="bg-blue-600 hover:bg-blue-700">
                Buat Purchase Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Goods Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Terima Barang - {selectedPO?.po_number}</DialogTitle>
            <DialogDescription>
              Catat penerimaan barang dari supplier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Dipesan</TableHead>
                  <TableHead>Sudah Diterima</TableHead>
                  <TableHead>Terima Sekarang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiveFormData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.quantity_ordered || item.ordered_qty || 0}</TableCell>
                    <TableCell>{item.quantity_received || item.received_qty || 0}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.receive_now || ''}
                        onChange={(e) => {
                          const updatedItems = [...receiveFormData.items];
                          updatedItems[index].receive_now = parseInt(e.target.value) || 0;
                          setReceiveFormData({ items: updatedItems });
                        }}
                        className="w-20"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleReceiveGoods} className="bg-green-600 hover:bg-green-700">
                <Truck className="w-4 h-4 mr-2" />
                Catat Penerimaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={viewPODialogOpen} onOpenChange={setViewPODialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Purchase Order - {selectedPO?.po_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedPO && (
              <>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{suppliers.find(s => s.id === selectedPO.supplier_id)?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cabang</p>
                    <p className="font-medium">{branches.find(b => b.id === selectedPO.branch_id)?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedPO.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
                    <p className="font-medium">{new Date(selectedPO.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Dipesan</TableHead>
                        <TableHead>Diterima</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity_ordered || item.ordered_qty || 0}</TableCell>
                          <TableCell>{item.quantity_received || item.received_qty || 0}</TableCell>
                          <TableCell>
                            {(item.received_qty || 0) >= item.ordered_qty ? (
                              <Badge variant="default">Lengkap</Badge>
                            ) : (item.received_qty || 0) > 0 ? (
                              <Badge variant="destructive">Sebagian</Badge>
                            ) : (
                              <Badge variant="secondary">Belum</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrderManagement;