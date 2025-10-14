'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Store, Plus, Edit, Trash2, Power, MapPin, Phone, User, Loader2, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { branchesAPI, usersAPI, setDevToken } from '@/lib/api';

const BranchManagement = ({ currentUser = null, viewMode = 'admin' }) => {
  const { toast } = useToast();
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [branchForStaffAssignment, setBranchForStaffAssignment] = useState(null);
  const [staffAssignment, setStaffAssignment] = useState({
    manager_id: '',
    cashier_id: ''
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    },
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Determine if user is a branch manager viewing their profile
  const isProfileMode = viewMode === 'profile' && currentUser;

  // Setup JWT token for testing
  useEffect(() => {
    setDevToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWZmYzE1Yy1lZjI3LTQwNjEtYmQ1Mi00OTA0MTc3ZjVlZDQiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsInJvbGUiOiJBRE1JTiIsImJyYW5jaElkIjpudWxsLCJpYXQiOjE3NjA0NDIwMDgsImV4cCI6MTc2MTA0NjgwOH0.XRp-8-vVfmkuKvI8H52mMxeqYCl8uFo--NtKDpG7A3I');
  }, []);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      console.log('BranchManagement - Starting to fetch data...');
      
      const [branchesRes, usersRes] = await Promise.all([
        branchesAPI.getAll(),
        usersAPI.getAll()
      ]);
      
      // Safely extract data from API response with multiple format support
      const extractArrayData = (response) => {
        // Handle direct array
        if (Array.isArray(response)) return response;
        
        // Handle API3.md structure: { data: { branches: [...] } }
        if (response?.data?.branches && Array.isArray(response.data.branches)) {
          return response.data.branches;
        }
        
        // Handle API3.md structure for users: { data: { users: [...] } }
        if (response?.data?.users && Array.isArray(response.data.users)) {
          return response.data.users;
        }
        
        // Handle legacy structure: { data: [...] }
        if (response?.data && Array.isArray(response.data)) return response.data;
        
        // Handle success wrapper: { success: true, data: [...] }
        if (response?.success && Array.isArray(response.data)) return response.data;
        
        console.warn('Unexpected API response structure:', response);
        return [];
      };
      
      let branchData = extractArrayData(branchesRes);
      const userData = extractArrayData(usersRes);
      
      console.log('BranchManagement - Raw API Response:', { branchesRes, usersRes });
      console.log('BranchManagement - Extracted Data:', { branchData, userData });
      
      // Filter to only show user's branch if in profile mode
      if (isProfileMode && currentUser?.branch_id) {
        branchData = branchData.filter(b => b.id === currentUser.branch_id);
      }
      
      setBranches(branchData);
      setUsers(userData);
      
      // Hardcoded roles sesuai API3.md
      setRoles([
        { id: 'ADMIN', name: 'Admin' },
        { id: 'BRANCH_MANAGER', name: 'Branch Manager' },
        { id: 'CASHIER', name: 'Cashier' }
      ]);
    } catch (error) {
      console.error('Failed to load branches:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set empty state on error
      setBranches([]);
      setUsers([]);
      
      toast({
        title: 'Error',
        description: 'Failed to load branches: ' + (error.response?.data?.message || error.message),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getBranchUsers = (branchId) => {
    // Cari branch dari data yang sudah dimuat
    const branch = branches.find(b => b.id === branchId);
    
    if (branch) {
      // API3.md sudah menyediakan data manager dan cashier secara langsung
      return {
        manager: branch.manager || null,
        cashier: branch.cashier || null
      };
    }
    
    // Fallback ke cara lama jika data tidak tersedia
    const branchUsers = users.filter(u => u.branch_id === branchId);
    const managerRole = roles.find(r => r.name === 'Branch Manager');
    const cashierRole = roles.find(r => r.name === 'Cashier');
    
    const manager = branchUsers.find(u => u.role_id === managerRole?.id);
    const cashier = branchUsers.find(u => u.role_id === cashierRole?.id);
    
    return { manager, cashier };
  };

  const handleOpenDialog = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        operating_hours: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingBranch) {
        await branchesAPI.update(editingBranch.id, formData);
        toast({
          title: 'Berhasil',
          description: 'Branch updated successfully!'
        });
      } else {
        await branchesAPI.create(formData);
        toast({
          title: 'Berhasil',
          description: 'Branch created successfully!'
        });
      }

      fetchBranches();
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to save branch',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch) => {
    try {
      if (branch.isActive) {
        const reason = prompt('Please enter reason for deactivation:');
        if (reason) {
          await branchesAPI.deactivate(branch.id, reason);
          toast({
            title: 'Berhasil',
            description: 'Branch deactivated successfully!'
          });
        } else {
          return;
        }
      } else {
        await branchesAPI.activate(branch.id);
        toast({
          title: 'Berhasil',
          description: 'Branch activated successfully!'
        });
      }
      fetchBranches();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle branch status: ' + (error.response?.data?.message || error.message),
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;

    try {
      await branchesAPI.delete(branchToDelete.id);
      toast({
        title: 'Berhasil',
        description: 'Branch deleted successfully!'
      });
      fetchBranches();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete branch: ' + (error.response?.data?.error || error.message),
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenStaffDialog = (branch) => {
    const { manager, cashier } = getBranchUsers(branch.id);
    setBranchForStaffAssignment(branch);
    setStaffAssignment({
      manager_id: manager?.id || '',
      cashier_id: cashier?.id || ''
    });
    setStaffDialogOpen(true);
  };

  const handleCloseStaffDialog = () => {
    setStaffDialogOpen(false);
    setBranchForStaffAssignment(null);
  };

  const handleStaffAssignmentSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Assign manager and cashier separately using API3.md endpoints
      if (staffAssignment.manager_id) {
        await branchesAPI.assignManager(branchForStaffAssignment.id, {
          userId: staffAssignment.manager_id
        });
      }
      
      if (staffAssignment.cashier_id) {
        await branchesAPI.assignCashier(branchForStaffAssignment.id, {
          userId: staffAssignment.cashier_id
        });
      }

      toast({
        title: 'Berhasil',
        description: 'Staff assigned successfully!'
      });
      fetchBranches();
      handleCloseStaffDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to assign staff',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getAvailableManagers = () => {
    const managerRole = roles.find(r => r.name === 'Branch Manager');
    if (!managerRole) return [];
    
    return users.filter(u => u.role_id === managerRole.id);
  };

  const getAvailableCashiers = () => {
    const cashierRole = roles.find(r => r.name === 'Cashier');
    if (!cashierRole) return [];
    
    return users.filter(u => u.role_id === cashierRole.id);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-4 mt-2 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If profile mode and has branch, show edit form directly
  if (isProfileMode && branches.length > 0) {
    const branch = branches[0];
    const { manager, cashier } = getBranchUsers(branch.id);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Profile Cabang Saya</h3>
          <p className="text-sm text-muted-foreground">Edit informasi cabang tempat Anda bekerja</p>
        </div>

        {/* Edit Form Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 shadow-md bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Informasi Cabang</CardTitle>
                <CardDescription>Perbarui detail cabang Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Cabang</Label>
                  <Input
                    id="code"
                    value={formData.code || branch.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Contoh: JKT01"
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Cabang *</Label>
                  <Input
                    id="name"
                    value={formData.name || branch.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama cabang"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={formData.address || branch.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap cabang"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone || branch.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Nomor telepon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || branch.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email cabang"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operating_hours">Jam Operasional</Label>
                <Input
                  id="operating_hours"
                  value={formData.operating_hours || branch.operating_hours}
                  onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                  placeholder="Contoh: Senin-Sabtu 08:00-17:00"
                />
              </div>

              {/* Staff Information (Read-only) */}
              <div className="pt-4 mt-4 border-t">
                <h4 className="mb-3 text-sm font-semibold text-gray-700">Staff Cabang:</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-600">Manager</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {manager ? (manager.fullName || manager.username || manager.name) : <span className="italic text-gray-400">Belum ditugaskan</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-green-200 rounded-lg bg-green-50">
                    <User className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-600">Kasir</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {cashier ? (cashier.fullName || cashier.username || cashier.name) : <span className="italic text-gray-400">Belum ditugaskan</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      code: branch.code,
                      name: branch.name,
                      address: branch.address,
                      phone: branch.phone,
                      email: branch.email,
                      operating_hours: branch.operating_hours
                    });
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isProfileMode ? 'Profile Cabang Saya' : 'Manage Branches'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isProfileMode ? 'Informasi cabang tempat Anda bekerja' : `Total: ${branches.length} branches`}
          </p>
        </div>
        {!isProfileMode && (
          <Button
            onClick={() => handleOpenDialog()}
            className="text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Branch
          </Button>
        )}
      </div>

      {/* Branches Grid */}
      {!Array.isArray(branches) || branches.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No branches yet</h3>
            <p className="mb-6 text-muted-foreground">Start by adding your first branch location</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Branch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(branches) && branches.map((branch) => {
            const { manager, cashier } = getBranchUsers(branch.id);
            
            return (
              <Card
                key={branch.id}
                className="overflow-hidden transition-all duration-300 transform border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 -mt-16 -mr-16 transition-transform duration-500 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 opacity-5 group-hover:scale-150"></div>
                <CardHeader className="relative pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50"
                        >
                          {branch.code}
                        </Badge>
                        <Badge
                          variant={branch.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={
                            branch.status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' :
                            branch.status === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600' :
                            branch.status === 'DRAFT' ? 'bg-gray-500 hover:bg-gray-600' : ''
                          }
                        >
                          {branch.status || 'Unknown'}
                        </Badge>
                      </div>
                      <CardTitle className="mb-1 text-xl">{branch.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{branch.address || 'No address'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="flex-shrink-0 w-4 h-4" />
                    <span>{branch.phone || 'No phone'}</span>
                  </div>
                  
                  {/* Assigned Staff Section */}
                  <div className="pt-3 mt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-700">Assigned Staff:</p>
                      {!isProfileMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenStaffDialog(branch)}
                          className="h-6 px-2 text-xs hover:bg-blue-50"
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="flex-shrink-0 w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-600">Manager:</span>
                        {manager ? (
                          <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50">
                            {manager.fullName || manager.username || manager.name}
                          </Badge>
                        ) : (
                          <span className="text-xs italic text-gray-400">Not assigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="flex-shrink-0 w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-600">Cashier:</span>
                        {cashier ? (
                          <Badge variant="outline" className="text-xs border-green-200 bg-green-50">
                            {cashier.fullName || cashier.username || cashier.name}
                          </Badge>
                        ) : (
                          <span className="text-xs italic text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons - only show for admin */}
                  {!isProfileMode && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(branch)}
                        className="flex-1 transition-colors duration-200 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(branch)}
                        className={`flex-1 transition-colors duration-200 ${
                          branch.isActive
                            ? 'hover:bg-orange-50 hover:border-orange-300'
                            : 'hover:bg-green-50 hover:border-green-300'
                        }`}
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {branch.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBranchToDelete(branch);
                          setDeleteDialogOpen(true);
                        }}
                        className="transition-colors duration-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* View-only mode for branch managers */}
                  {isProfileMode && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(branch)}
                        className="w-full transition-colors duration-200 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Lihat Detail
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingBranch ? 'Edit Branch' : 'Add New Branch'}
            </DialogTitle>
            <DialogDescription>
              {editingBranch ? 'Update branch information' : 'Fill in the details for the new branch'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Branch Code <span className="text-red-500">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="e.g., BR001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Branch Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Main Store"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter branch address"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operating_hours">Jam Operasional</Label>
              <Input
                id="operating_hours"
                value={formData.operating_hours}
                onChange={(e) => handleChange('operating_hours', e.target.value)}
                placeholder="contoh: 08:00 - 20:00"
              />
              <p className="text-xs text-muted-foreground">Manager dan staff akan di-assign setelah cabang dibuat</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingBranch ? 'Update Branch' : 'Create Branch'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Staff Assignment Dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Assign Staff to Branch</DialogTitle>
            <DialogDescription>
              Assign Branch Manager and Cashier to <strong>{branchForStaffAssignment?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStaffAssignmentSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Branch Manager</Label>
              <Select
                value={staffAssignment.manager_id || 'none'}
                onValueChange={(value) => setStaffAssignment(prev => ({ ...prev, manager_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {getAvailableManagers().map((user) => {
                    const isAssigned = users.find(u => u.id === user.id && u.branch_id && u.branch_id !== branchForStaffAssignment?.id);
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.username}</span>
                          {isAssigned && <span className="text-xs text-orange-600">(Assigned to other branch)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only users with "Branch Manager" role are shown
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier">Cashier</Label>
              <Select
                value={staffAssignment.cashier_id || 'none'}
                onValueChange={(value) => setStaffAssignment(prev => ({ ...prev, cashier_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cashier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Cashier</SelectItem>
                  {getAvailableCashiers().map((user) => {
                    const isAssigned = users.find(u => u.id === user.id && u.branch_id && u.branch_id !== branchForStaffAssignment?.id);
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.username}</span>
                          {isAssigned && <span className="text-xs text-orange-600">(Assigned to other branch)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only users with "Cashier" role are shown
              </p>
            </div>

            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-xs text-blue-900">
                <strong>💡 Info:</strong> Assigning a user who is already assigned to another branch will automatically unassign them from the previous branch.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseStaffDialog}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Assign Staff'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the branch <strong>{branchToDelete?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BranchManagement;