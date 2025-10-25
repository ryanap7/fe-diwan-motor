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
import { branchesAPI, transactionsAPI } from '@/lib/api';

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Transaksi POS</h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            className="hover:bg-blue-50"
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Debug Info Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 mb-3 text-xs bg-gray-100 rounded sm:p-3 sm:mb-4 sm:text-sm">
          <strong>Debug Info:</strong> 
          <span className="ml-2">Raw Transactions: {transactions.length}</span>
          <span className="ml-2">Filtered: {filteredTransactions.length}</span>
          <span className="ml-2">Loading: {loading ? 'Yes' : 'No'}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground sm:text-sm">Total Transaksi</p>
                <p className="text-lg font-bold sm:text-2xl">{filteredTransactions.length}</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-blue-500 sm:w-8 sm:h-8" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground sm:text-sm">Total Pendapatan</p>
                <p className="text-sm font-bold text-green-600 sm:text-xl">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <Download className="w-6 h-6 text-green-500 sm:w-8 sm:h-8" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground sm:text-sm">Rata-rata per Transaksi</p>
                <p className="text-sm font-bold text-blue-600 sm:text-xl">
                  {formatCurrency(filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0)}
                </p>
              </div>
              <FileText className="w-6 h-6 text-blue-500 sm:w-8 sm:h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 sm:w-5 sm:h-5" />
            <CardTitle className="text-base sm:text-lg">Filter</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm">Cari</Label>
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                <Input
                  placeholder="Invoice, customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Cabang</Label>
              <Select
                value={filters.branch_id || 'all'}
                onValueChange={(value) => handleFilterChange('branch_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="h-9 text-sm">
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
              <Label className="text-sm">Tanggal Dari</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Tanggal Sampai</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-center mt-4 sm:justify-end">
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="text-sm"
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
            <div className="pt-8 pb-8 text-center sm:pt-12 sm:pb-12">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full sm:w-16 sm:h-16 sm:mb-4 bg-gradient-to-r from-blue-100 to-purple-100">
                <ShoppingCart className="w-6 h-6 text-blue-600 sm:w-8 sm:h-8" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">Tidak ada transaksi</h3>
              <p className="text-sm text-muted-foreground">
                {transactions.length === 0 ? 'Belum ada transaksi yang tercatat' : 'Tidak ada transaksi yang cocok dengan filter'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto md:block">
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

              {/* Mobile Card View */}
              <div className="md:hidden">
                <div className="p-3 space-y-3 sm:p-4 sm:space-y-4">
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((transaction) => (
                      <Card key={transaction.id} className="border border-gray-200 shadow-sm">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {transaction.invoiceNumber || transaction.invoice_number}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(transaction.transactionDate || transaction.transaction_date)}</span>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(transaction.totalAmount || transaction.total)}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Cabang:</span>
                              <span className="font-medium">
                                {transaction.branch?.name || transaction.branchName || transaction.branch_name || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Kasir:</span>
                              <span className="font-medium">
                                {transaction.cashier?.fullName || transaction.cashier?.username || transaction.cashierName || transaction.cashier_name || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Customer:</span>
                              <span className="font-medium">
                                {transaction.customer?.name || transaction.customerName || transaction.customer_name || 'Pengunjung'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetail(transaction)}
                              className="flex-1 text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintReceipt(transaction)}
                              className="flex-1 text-xs"
                            >
                              <Printer className="w-3 h-3 mr-1" />
                              Print
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <div className="mb-3 text-3xl">📋</div>
                      <div className="mb-2 text-base font-medium">Belum ada transaksi</div>
                      <div className="mb-4 text-sm text-muted-foreground text-center">
                        {loading ? 'Memuat transaksi...' : 
                         transactions.length === 0 ? 'Belum ada transaksi yang tersedia' :
                         'Coba sesuaikan filter pencarian Anda'}
                      </div>
                      {!loading && transactions.length === 0 && (
                        <div className="max-w-sm text-xs text-gray-400">
                          <strong>Catatan:</strong> Untuk membuat transaksi POS, pastikan:
                          <ul className="mt-2 space-y-1 text-left">
                            <li>• User sudah di-assign ke cabang (branch)</li>
                            <li>• Produk memiliki stok yang cukup</li>
                            <li>• Gunakan menu POS untuk transaksi baru</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="px-3 py-3 border-t sm:px-6 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Mobile: Info on top */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="text-xs text-muted-foreground sm:text-sm">
                      Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs sm:text-sm">Per halaman:</Label>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-16 h-7 sm:w-20 sm:h-8">
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

                  {/* Mobile: Navigation buttons */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="px-2 text-xs sm:px-3 sm:text-sm"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </Button>
                    
                    {/* Page Numbers - Responsive */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages <= 3 ? totalPages : 3, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage <= 2) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-7 h-7 p-0 text-xs sm:w-8 sm:h-8 sm:text-sm"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {/* Show ellipsis and last page on larger screens */}
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <div className="hidden sm:flex sm:items-center sm:gap-1">
                          <span className="px-2">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-2 text-xs sm:px-3 sm:text-sm"
                    >
                      <span className="hidden sm:inline">Selanjutnya</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Detail Transaksi - {selectedTransaction?.invoice_number}</DialogTitle>
            <DialogDescription className="text-sm">
              Informasi lengkap transaksi
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="mt-4 space-y-4 sm:space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs text-muted-foreground sm:text-sm">Tanggal Transaksi</Label>
                  <p className="text-sm font-medium sm:text-base">{formatDate(selectedTransaction.transactionDate || selectedTransaction.transaction_date)}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs text-muted-foreground sm:text-sm">Status</Label>
                  <div>{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs text-muted-foreground sm:text-sm">Cabang</Label>
                  <p className="text-sm font-medium sm:text-base">{selectedTransaction.branch?.name || selectedTransaction.branchName || selectedTransaction.branch_name || 'Unknown Branch'}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs text-muted-foreground sm:text-sm">Kasir</Label>
                  <p className="text-sm font-medium sm:text-base">{selectedTransaction.cashier?.fullName || selectedTransaction.cashier?.username || selectedTransaction.cashierName || selectedTransaction.cashier_name || 'Unknown Cashier'}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs text-muted-foreground sm:text-sm">Customer</Label>
                  <p className="text-sm font-medium sm:text-base">{selectedTransaction.customer?.name || selectedTransaction.customerName || selectedTransaction.customer_name || 'Pengunjung'}</p>
                  {(selectedTransaction.customer?.phone || selectedTransaction.customerPhone || selectedTransaction.customer_phone) && (
                    <p className="text-xs text-muted-foreground sm:text-sm">{selectedTransaction.customer?.phone || selectedTransaction.customerPhone || selectedTransaction.customer_phone}</p>
                  )}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs text-muted-foreground sm:text-sm">Metode Pembayaran</Label>
                  <p className="text-sm font-medium sm:text-base">{getPaymentMethodLabel(selectedTransaction.paymentMethod || selectedTransaction.payment_method)}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <Label className="block mb-2 text-xs text-muted-foreground sm:text-sm">Item Transaksi</Label>
                
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Produk</TableHead>
                        <TableHead className="text-xs sm:text-sm">SKU</TableHead>
                        <TableHead className="text-xs text-right sm:text-sm">Harga</TableHead>
                        <TableHead className="text-xs text-center sm:text-sm">Qty</TableHead>
                        <TableHead className="text-xs text-right sm:text-sm">Diskon</TableHead>
                        <TableHead className="text-xs text-right sm:text-sm">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransaction.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-sm font-medium">{item.productName || item.product?.name || item.product_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.productSku || item.product?.sku || item.sku}</TableCell>
                          <TableCell className="text-sm text-right">{formatCurrency(item.unitPrice || item.price)}</TableCell>
                          <TableCell className="text-sm text-center">{item.quantity}</TableCell>
                          <TableCell className="text-sm text-right">{formatCurrency(item.discount || item.discountAmount || 0)}</TableCell>
                          <TableCell className="text-sm font-semibold text-right">{formatCurrency(item.subtotal || item.subTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-2 sm:hidden">
                  {selectedTransaction.items?.map((item, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <p className="text-sm font-medium">{item.productName || item.product?.name || item.product_name}</p>
                            <p className="text-xs text-muted-foreground">{item.productSku || item.product?.sku || item.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(item.subtotal || item.subTotal)}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Harga: {formatCurrency(item.unitPrice || item.price)}</span>
                          {(item.discount || item.discountAmount) > 0 && (
                            <span>Diskon: {formatCurrency(item.discount || item.discountAmount)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="pt-3 border-t sm:pt-4">
                <div className="max-w-full space-y-2 sm:max-w-sm sm:ml-auto">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.subtotal || selectedTransaction.subTotal)}</span>
                  </div>
                  {(selectedTransaction.discount || selectedTransaction.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Diskon:</span>
                      <span className="font-medium">- {formatCurrency(selectedTransaction.discount || selectedTransaction.discountAmount)}</span>
                    </div>
                  )}
                  {(selectedTransaction.tax || selectedTransaction.taxAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Pajak:</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.tax || selectedTransaction.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 text-base font-bold border-t sm:text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedTransaction.totalAmount || selectedTransaction.total)}</span>
                  </div>
                  {(selectedTransaction.paymentMethod || selectedTransaction.payment_method) === 'CASH' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Bayar:</span>
                        <span className="font-medium">{formatCurrency(selectedTransaction.amountPaid || selectedTransaction.paymentAmount || selectedTransaction.payment_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Kembali:</span>
                        <span className="font-medium">{formatCurrency(selectedTransaction.changeAmount || selectedTransaction.change_amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedTransaction.notes && (
                <div className="pt-3 border-t sm:pt-4">
                  <Label className="text-xs text-muted-foreground sm:text-sm">Catatan</Label>
                  <p className="mt-1 text-sm">{selectedTransaction.notes}</p>
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
