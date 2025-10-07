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
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Sampai</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
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

      {filteredLogs.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada log aktivitas</h3>
            <p className="text-muted-foreground">
              {logs.length === 0 ? 'Belum ada aktivitas yang tercatat' : 'Tidak ada aktivitas yang cocok dengan filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <Card
              key={log.id}
              className="border-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {log.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{log.username}</span>
                        <Badge className={`${getActionBadgeColor(log.action)} hover:${getActionBadgeColor(log.action)} text-white text-xs`}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getEntityTypeLabel(log.entity_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {log.entity_name && (
                          <span className="font-medium">{log.entity_name}</span>
                        )}
                      </p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    {log.ip_address && (
                      <div className="text-xs text-muted-foreground">
                        IP: {log.ip_address}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
