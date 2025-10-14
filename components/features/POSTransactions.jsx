'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ShoppingCart, Search, Filter, RefreshCw, Calendar, ChevronLeft, ChevronRight,
  FileText, Printer, Eye, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { branchesAPI, transactionsAPI, setDevToken } from '@/lib/api';

const POSTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [filters, setFilters] = useState({
    branch_id: 'all',
    search: '',
    status: 'all',
    payment_method: 'all',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    // Check if user is logged in and has valid token
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }
    
    // Set token untuk API interceptor (if using setDevToken for development)
    if (typeof setDevToken === 'function') {
      setDevToken(token);
    }
    
    console.log('Transactions - Using accessToken from login:', token.substring(0, 50) + '...');
    
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [transactions, filters]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('=== STATE CHANGE DEBUG ===');
    console.log('Transactions state:', transactions.length, transactions);
    console.log('Filtered transactions state:', filteredTransactions.length, filteredTransactions);
    console.log('Loading state:', loading);
    console.log('========================');
  }, [transactions, filteredTransactions, loading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('=== FETCHING TRANSACTIONS DATA ===');
      
      const [transactionsRes, branchesRes] = await Promise.all([
        transactionsAPI.getAll(),
        branchesAPI.getAll() // Fixed: use getAll() instead of getBranches()
      ]);

      console.log('Transactions Response:', transactionsRes);
      console.log('Branches Response:', branchesRes);

      // Handle transactions API response with multiple possible structures
      let transactions = [];
      if (transactionsRes?.success && transactionsRes.data?.transactions) {
        transactions = transactionsRes.data.transactions;
      } else if (transactionsRes?.data && Array.isArray(transactionsRes.data)) {
        transactions = transactionsRes.data;
      } else if (Array.isArray(transactionsRes)) {
        transactions = transactionsRes;
      } else {
        console.log('No transactions data found in response structure');
      }
      
      // Handle branches API response with multiple possible structures
      let branches = [];
      if (branchesRes?.success && branchesRes.data?.branches) {
        branches = branchesRes.data.branches;
      } else if (branchesRes?.data && Array.isArray(branchesRes.data)) {
        branches = branchesRes.data;
      } else if (Array.isArray(branchesRes)) {
        branches = branchesRes;
      } else {
        console.log('No branches data found in response structure');
      }

      console.log('Processed transactions count:', transactions.length);
      console.log('Sample transaction:', transactions[0]);
      console.log('Processed branches count:', branches.length);
      console.log('=================================');

      setTransactions(transactions);
      setBranches(branches);
      
      if (transactions.length === 0) {
        console.warn('No transactions found - this might be expected if no transactions exist');
      }
      
    } catch (error) {
      console.error('Error fetching transactions data:', error);
      toast.error('Gagal memuat data transaksi: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionsWithFilters = async () => {
    try {
      setLoading(true);
      
      // Build API query parameters
      const params = {};
      if (filters.branch_id && filters.branch_id !== 'all') {
        params.branchId = filters.branch_id;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.payment_method && filters.payment_method !== 'all') {
        params.paymentMethod = filters.payment_method;
      }
      if (filters.start_date) {
        params.startDate = filters.start_date;
      }
      if (filters.end_date) {
        params.endDate = filters.end_date;
      }

      console.log('Fetching transactions with params:', params);
      
      const response = await transactionsAPI.getAll(params);
      
      if (response?.success && response.data?.transactions) {
        setTransactions(response.data.transactions);
        setFilteredTransactions(response.data.transactions);
      } else {
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching filtered transactions:', error);
      toast.error('Gagal memuat data transaksi');
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log('=== APPLYING FILTERS ===');
    console.log('Current filters:', filters);
    console.log('Available transactions:', transactions.length);
    
    // Always start with client-side filtering from the base transactions data
    let filtered = [...transactions];

    if (filters.branch_id && filters.branch_id !== 'all') {
      console.log('Filtering by branch:', filters.branch_id);
      filtered = filtered.filter(t => t.branchId === filters.branch_id || t.branch?.id === filters.branch_id);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      console.log('Filtering by search:', searchLower);
      filtered = filtered.filter(t => 
        t.invoiceNumber?.toLowerCase().includes(searchLower) ||
        t.customerName?.toLowerCase().includes(searchLower) ||
        t.customer?.fullName?.toLowerCase().includes(searchLower) ||
        t.customer?.name?.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status && filters.status !== 'all') {
      console.log('Filtering by status:', filters.status);
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.payment_method && filters.payment_method !== 'all') {
      console.log('Filtering by payment method:', filters.payment_method);
      filtered = filtered.filter(t => (t.paymentMethod || t.payment_method) === filters.payment_method);
    }

    if (filters.start_date) {
      console.log('Filtering by start date:', filters.start_date);
      filtered = filtered.filter(t => new Date(t.createdAt || t.transactionDate) >= new Date(filters.start_date));
    }

    if (filters.end_date) {
      console.log('Filtering by end date:', filters.end_date);
      const dateTo = new Date(filters.end_date);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.createdAt || t.transactionDate) <= dateTo);
    }

    console.log('Filtered transactions count:', filtered.length);
    console.log('========================');
    
    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      branch_id: 'all',
      search: '',
      status: 'all',
      payment_method: 'all',
      start_date: '',
      end_date: ''
    });
  };

  const getStatusBadge = (status) => {
    return <Badge className="text-white bg-green-500">Selesai</Badge>;
  };

  const getPaymentMethodLabel = (method) => {
    if (!method) return 'N/A';
    switch (method.toUpperCase()) {
      case 'CASH':
        return 'Tunai';
      case 'CARD':
        return 'Kartu';
      case 'DIGITAL':
        return 'Digital';
      case 'TRANSFER':
        return 'Transfer';
      default:
        return method;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Rp 0';
    
    // Convert string to number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  const handleViewDetail = async (transaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  const handlePrintReceipt = (transaction) => {
    // TODO: Implement print receipt
    toast.info('Fitur print receipt akan segera hadir');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // Calculate summary statistics
  const totalRevenue = filteredTransactions.reduce((sum, t) => {
    const amount = parseFloat(t.totalAmount || t.total || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transaksi POS</h3>
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            className="hover:bg-blue-50"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Debug Info Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 mb-4 text-sm bg-gray-100 rounded">
          <strong>Debug Info:</strong> 
          <span className="ml-2">Raw Transactions: {transactions.length}</span>
          <span className="ml-2">Filtered: {filteredTransactions.length}</span>
          <span className="ml-2">Loading: {loading ? 'Yes' : 'No'}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <Button
          onClick={fetchData}
          variant="outline"
          className="hidden hover:bg-blue-50" // Hide duplicate button
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Muat Ulang
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <Download className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata per Transaksi</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Filter</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Cari</Label>
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                <Input
                  placeholder="Invoice, customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cabang</Label>
              <Select
                value={filters.branch_id || 'all'}
                onValueChange={(value) => handleFilterChange('branch_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {Array.isArray(branches) && branches.length > 0 ? (
                    branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-branches" disabled>
                      Tidak ada cabang tersedia
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Dari</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Sampai</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
            >
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="pt-12 pb-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Tidak ada transaksi</h3>
              <p className="text-muted-foreground">
                {transactions.length === 0 ? 'Belum ada transaksi yang tercatat' : 'Tidak ada transaksi yang cocok dengan filter'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Invoice</TableHead>
                      <TableHead className="w-[160px]">Tanggal</TableHead>
                      <TableHead className="w-[140px]">Cabang</TableHead>
                      <TableHead className="w-[120px]">Kasir</TableHead>
                      <TableHead className="w-[180px]">Customer</TableHead>
                      <TableHead className="w-[140px] text-right">Total</TableHead>
                      <TableHead className="w-[100px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.length > 0 ? (
                      paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {transaction.invoiceNumber || transaction.invoice_number}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">{formatDate(transaction.transactionDate || transaction.transaction_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.branch?.name || transaction.branchName || transaction.branch_name || 'Unknown Branch'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.cashier?.fullName || transaction.cashier?.username || transaction.cashierName || transaction.cashier_name || 'Unknown Cashier'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <div className="font-medium">
                                {transaction.customer?.name || transaction.customerName || transaction.customer_name || 'Pengunjung'}
                              </div>
                              {(transaction.customer?.phone || transaction.customerPhone || transaction.customer_phone) && (
                                <div className="text-xs text-muted-foreground">
                                  {transaction.customer?.phone || transaction.customerPhone || transaction.customer_phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-right">
                            {formatCurrency(transaction.totalAmount || transaction.total)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetail(transaction)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePrintReceipt(transaction)}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan="7" className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="mb-3 text-3xl">📋</div>
                            <div className="mb-2 text-lg font-medium">Belum ada transaksi</div>
                            <div className="mb-4 text-sm text-muted-foreground">
                              {loading ? 'Memuat transaksi...' : 
                               transactions.length === 0 ? 'Belum ada transaksi yang tersedia' :
                               'Coba sesuaikan filter pencarian Anda'}
                            </div>
                            {!loading && transactions.length === 0 && (
                              <div className="max-w-md text-xs text-gray-400">
                                <strong>Catatan:</strong> Untuk membuat transaksi POS, pastikan:
                                <ul className="mt-2 space-y-1 text-left">
                                  <li>• User sudah di-assign ke cabang (branch)</li>
                                  <li>• Produk memiliki stok yang cukup</li>
                                  <li>• Gunakan menu POS untuk transaksi baru</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="px-6 py-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Baris per halaman:</Label>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Sebelumnya
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi - {selectedTransaction?.invoice_number}</DialogTitle>
            <DialogDescription>
              Informasi lengkap transaksi
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="mt-4 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tanggal Transaksi</Label>
                  <p className="font-medium">{formatDate(selectedTransaction.transactionDate || selectedTransaction.transaction_date)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Cabang</Label>
                  <p className="font-medium">{selectedTransaction.branch?.name || selectedTransaction.branchName || selectedTransaction.branch_name || 'Unknown Branch'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Kasir</Label>
                  <p className="font-medium">{selectedTransaction.cashier?.fullName || selectedTransaction.cashier?.username || selectedTransaction.cashierName || selectedTransaction.cashier_name || 'Unknown Cashier'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedTransaction.customer?.name || selectedTransaction.customerName || selectedTransaction.customer_name || 'Pengunjung'}</p>
                  {(selectedTransaction.customer?.phone || selectedTransaction.customerPhone || selectedTransaction.customer_phone) && (
                    <p className="text-sm text-muted-foreground">{selectedTransaction.customer?.phone || selectedTransaction.customerPhone || selectedTransaction.customer_phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Metode Pembayaran</Label>
                  <p className="font-medium">{getPaymentMethodLabel(selectedTransaction.paymentMethod || selectedTransaction.payment_method)}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <Label className="block mb-2 text-muted-foreground">Item Transaksi</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Diskon</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.productName || item.product?.name || item.product_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.productSku || item.product?.sku || item.sku}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice || item.price)}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.discount || item.discountAmount || 0)}</TableCell>
                        <TableCell className="font-semibold text-right">{formatCurrency(item.subtotal || item.subTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Payment Summary */}
              <div className="pt-4 border-t">
                <div className="max-w-sm ml-auto space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.subtotal || selectedTransaction.subTotal)}</span>
                  </div>
                  {(selectedTransaction.discount || selectedTransaction.discountAmount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Diskon:</span>
                      <span className="font-medium">- {formatCurrency(selectedTransaction.discount || selectedTransaction.discountAmount)}</span>
                    </div>
                  )}
                  {(selectedTransaction.tax || selectedTransaction.taxAmount) > 0 && (
                    <div className="flex justify-between">
                      <span>Pajak:</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.tax || selectedTransaction.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 text-lg font-bold border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedTransaction.totalAmount || selectedTransaction.total)}</span>
                  </div>
                  {(selectedTransaction.paymentMethod || selectedTransaction.payment_method) === 'CASH' && (
                    <>
                      <div className="flex justify-between">
                        <span>Bayar:</span>
                        <span className="font-medium">{formatCurrency(selectedTransaction.amountPaid || selectedTransaction.paymentAmount || selectedTransaction.payment_amount)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Kembali:</span>
                        <span className="font-medium">{formatCurrency(selectedTransaction.changeAmount || selectedTransaction.change_amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedTransaction.notes && (
                <div className="pt-4 border-t">
                  <Label className="text-muted-foreground">Catatan</Label>
                  <p className="mt-1">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSTransactions;
