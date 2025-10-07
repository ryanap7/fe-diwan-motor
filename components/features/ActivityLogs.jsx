'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Filter, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    entity_type: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [logs, filters]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [logsRes, usersRes] = await Promise.all([
        axios.get('/api/activity-logs', { headers }),
        axios.get('/api/users', { headers })
      ]);

      setLogs(logsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      toast.error('Gagal memuat log aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.user_id) {
      filtered = filtered.filter(log => log.user_id === filters.user_id);
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.entity_type) {
      filtered = filtered.filter(log => log.entity_type === filters.entity_type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.username?.toLowerCase().includes(searchLower) ||
        log.entity_name?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.date_from) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.date_from));
    }

    if (filters.date_to) {
      const dateTo = new Date(filters.date_to);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.timestamp) <= dateTo);
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      user_id: '',
      action: '',
      entity_type: '',
      search: '',
      date_from: '',
      date_to: ''
    });
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'login': return 'bg-green-500';
      case 'logout': return 'bg-gray-500';
      case 'create': return 'bg-blue-500';
      case 'update': return 'bg-yellow-500';
      case 'delete': return 'bg-red-500';
      case 'assign': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      login: 'Masuk',
      logout: 'Keluar',
      create: 'Buat',
      update: 'Ubah',
      delete: 'Hapus',
      assign: 'Tetapkan'
    };
    return labels[action] || action;
  };

  const getEntityTypeLabel = (entityType) => {
    const labels = {
      user: 'Pengguna',
      branch: 'Cabang',
      company: 'Perusahaan',
      staff_assignment: 'Penugasan Staf',
      auth: 'Autentikasi'
    };
    return labels[entityType] || entityType;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Log Aktivitas</h3>
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredLogs.length} dari {logs.length} aktivitas
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="hover:bg-blue-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Muat Ulang
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Filter</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari pengguna, entitas..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pengguna</Label>
              <Select
                value={filters.user_id || 'all'}
                onValueChange={(value) => handleFilterChange('user_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua pengguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pengguna</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aksi</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="login">Masuk</SelectItem>
                  <SelectItem value="logout">Keluar</SelectItem>
                  <SelectItem value="create">Buat</SelectItem>
                  <SelectItem value="update">Ubah</SelectItem>
                  <SelectItem value="delete">Hapus</SelectItem>
                  <SelectItem value="assign">Tetapkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipe Entitas</Label>
              <Select
                value={filters.entity_type || 'all'}
                onValueChange={(value) => handleFilterChange('entity_type', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="user">Pengguna</SelectItem>
                  <SelectItem value="branch">Cabang</SelectItem>
                  <SelectItem value="company">Perusahaan</SelectItem>
                  <SelectItem value="staff_assignment">Penugasan Staf</SelectItem>
                  <SelectItem value="auth">Autentikasi</SelectItem>
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

          <div className="mt-4 flex justify-end">
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

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada log aktivitas</h3>
              <p className="text-muted-foreground">
                {logs.length === 0 ? 'Belum ada aktivitas yang tercatat' : 'Tidak ada aktivitas yang cocok dengan filter'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Waktu</TableHead>
                      <TableHead className="w-[120px]">Pengguna</TableHead>
                      <TableHead className="w-[100px]">Aksi</TableHead>
                      <TableHead className="w-[120px]">Tipe</TableHead>
                      <TableHead className="w-[150px]">Entitas</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead className="w-[120px]">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs">{formatDate(log.timestamp)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {log.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-sm">{log.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getActionBadgeColor(log.action)} hover:${getActionBadgeColor(log.action)} text-white text-xs`}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getEntityTypeLabel(log.entity_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {log.entity_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="border-t px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredLogs.length)} dari {filteredLogs.length} log
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
    </div>
  );
};

export default ActivityLogs;
