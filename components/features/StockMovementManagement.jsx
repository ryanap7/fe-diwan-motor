'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, TrendingDown, ArrowRightLeft, Search, Filter, Download, 
  Calendar, Package, MapPin, User, FileText, BarChart3 
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const StockMovementManagement = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('movements');
  
  // Filter states
  const [filters, setFilters] = useState({
    product_id: 'all',
    branch_id: 'all',
    movement_type: 'all',
    start_date: '',
    end_date: '',
    search_query: ''
  });

  const [mutationReport, setMutationReport] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    fetchMovementData();
  }, []);

  useEffect(() => {
    if (filters.product_id || filters.branch_id || filters.movement_type || filters.start_date || filters.end_date) {
      fetchMovements();
    }
  }, [filters]);

  const fetchMovementData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [movementsRes, productsRes, branchesRes] = await Promise.all([
        axios.get('/api/inventory/movements', { headers }),
        axios.get('/api/products', { headers }),
        axios.get('/api/branches', { headers })
      ]);

      setMovements(movementsRes.data || []);
      setProducts(productsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      toast.error('Gagal memuat data pergerakan stok');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.product_id && filters.product_id !== 'all') params.append('product_id', filters.product_id);
      if (filters.branch_id && filters.branch_id !== 'all') params.append('branch_id', filters.branch_id);
      if (filters.movement_type && filters.movement_type !== 'all') params.append('type', filters.movement_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await axios.get(`/api/inventory/movements?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMovements(response.data || []);
    } catch (error) {
      toast.error('Gagal memuat data pergerakan stok');
    }
  };

  const fetchMutationReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.branch_id) params.append('branch_id', filters.branch_id);

      const response = await axios.get(`/api/inventory/mutation-report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMutationReport(response.data || []);
    } catch (error) {
      toast.error('Gagal memuat laporan mutasi stok');
    }
  };

  const getMovementIcon = (type) => {
    const iconConfig = {
      'TRANSFER': { icon: ArrowRightLeft, color: 'text-blue-500' },
      'ADJUSTMENT': { icon: FileText, color: 'text-orange-500' },
      'OPNAME': { icon: BarChart3, color: 'text-purple-500' },
      'RECEIVE': { icon: TrendingUp, color: 'text-green-500' },
      'SALE': { icon: TrendingDown, color: 'text-red-500' }
    };
    
    const config = iconConfig[type] || { icon: Package, color: 'text-gray-500' };
    const Icon = config.icon;
    
    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  const getMovementBadge = (type) => {
    const badgeConfig = {
      'TRANSFER': { label: 'Transfer', variant: 'default' },
      'ADJUSTMENT': { label: 'Penyesuaian', variant: 'secondary' },
      'OPNAME': { label: 'Stock Opname', variant: 'destructive' },
      'RECEIVE': { label: 'Penerimaan', variant: 'default' },
      'SALE': { label: 'Penjualan', variant: 'destructive' }
    };
    
    const config = badgeConfig[type] || { label: type, variant: 'outline' };
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getMovementIcon(type)}
        {config.label}
      </Badge>
    );
  };

  const resetFilters = () => {
    setFilters({
      product_id: 'all',
      branch_id: 'all',
      movement_type: 'all',
      start_date: '',
      end_date: '',
      search_query: ''
    });
    fetchMovementData();
  };

  const exportMovements = () => {
    const csvContent = [
      ['Tanggal', 'Tipe', 'Produk', 'Cabang', 'Quantity', 'User', 'Keterangan'].join(','),
      ...movements.map(movement => [
        new Date(movement.timestamp).toLocaleDateString('id-ID'),
        movement.type,
        products.find(p => p.id === movement.product_id)?.name || movement.product_id,
        branches.find(b => b.id === movement.branch_id)?.name || movement.branch_id,
        movement.quantity || '-',
        movement.username,
        movement.notes || '-'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_movements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Data berhasil diekspor');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Memuat data pergerakan stok...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Stock Movement & Reports</h3>
          <p className="text-sm text-muted-foreground">Log dan laporan pergerakan stok</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportMovements}
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements">Log Pergerakan</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Pergerakan Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Produk</Label>
                  <Select 
                    value={filters.product_id} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, product_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Produk</SelectItem>
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
                    value={filters.branch_id} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, branch_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Cabang</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipe Pergerakan</Label>
                  <Select 
                    value={filters.movement_type} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, movement_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="ADJUSTMENT">Penyesuaian</SelectItem>
                      <SelectItem value="OPNAME">Stock Opname</SelectItem>
                      <SelectItem value="RECEIVE">Penerimaan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dari Tanggal</Label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full"
                  >
                    Reset Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movement Log Table */}
          <Card>
            <CardHeader>
              <CardTitle>Log Pergerakan Stok</CardTitle>
              <CardDescription>
                Total {movements.length} pergerakan stok
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const product = products.find(p => p.id === movement.product_id);
                    const branch = branches.find(b => b.id === (movement.branch_id || movement.from_branch_id));
                    
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(movement.timestamp).toLocaleDateString('id-ID')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(movement.timestamp).toLocaleTimeString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getMovementBadge(movement.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{product?.name || 'Unknown Product'}</p>
                              <p className="text-xs text-muted-foreground">{product?.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{branch?.name || 'Unknown Branch'}</span>
                          </div>
                          {movement.to_branch_id && (
                            <div className="text-xs text-muted-foreground">
                              → {branches.find(b => b.id === movement.to_branch_id)?.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {movement.quantity > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className="font-medium">
                              {movement.quantity ? `${movement.quantity} unit` : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{movement.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {movement.notes || movement.reason || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {movements.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">Tidak ada pergerakan stok ditemukan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mutation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Laporan Mutasi Stok
              </CardTitle>
              <CardDescription>
                Ringkasan pergerakan stok berdasarkan periode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Dari Tanggal</Label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={fetchMutationReport} className="w-full">
                    Generate Report
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Stok Awal</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Keluar</TableHead>
                    <TableHead>Penyesuaian</TableHead>
                    <TableHead>Stok Akhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutationReport.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.opening_stock || 0}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        +{item.stock_in || 0}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        -{item.stock_out || 0}
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium">
                        {item.adjustments || 0}
                      </TableCell>
                      <TableCell className="font-bold">
                        {item.closing_stock || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {mutationReport.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">
                    Pilih periode dan klik "Generate Report" untuk melihat laporan mutasi
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                History Pergerakan Per Item
              </CardTitle>
              <CardDescription>
                Lacak riwayat pergerakan produk tertentu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Pilih Produk</Label>
                  <Select 
                    value={selectedProduct} 
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk untuk melihat history" />
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
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={() => {
                      if (selectedProduct) {
                        setFilters(prev => ({ ...prev, product_id: selectedProduct }));
                        setActiveTab('movements');
                      } else {
                        toast.error('Pilih produk terlebih dahulu');
                      }
                    }}
                    className="w-full"
                    disabled={!selectedProduct}
                  >
                    Lihat History
                  </Button>
                </div>
              </div>

              {selectedProduct && (
                <div className="p-4 bg-gray-50 rounded border">
                  <h4 className="font-semibold mb-2">
                    History: {products.find(p => p.id === selectedProduct)?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Klik "Lihat History" untuk melihat semua pergerakan produk ini di tab "Log Pergerakan"
                  </p>
                </div>
              )}

              {!selectedProduct && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">
                    Pilih produk untuk melihat history pergerakannya
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockMovementManagement;