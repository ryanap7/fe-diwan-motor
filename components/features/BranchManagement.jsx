'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Store, Plus, Edit, Trash2, Power, MapPin, Phone, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BranchManagement = () => {
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
    phone: '',
    email: '',
    manager_name: '',
    manager_phone: '',
    operating_hours: '',
    stock_capacity: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [branchesRes, usersRes, rolesRes] = await Promise.all([
        axios.get('/api/branches', { headers }),
        axios.get('/api/users', { headers }),
        axios.get('/api/roles', { headers })
      ]);
      
      setBranches(branchesRes.data || []);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };
  
  const getBranchUsers = (branchId) => {
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
        manager_name: '',
        manager_phone: '',
        operating_hours: '',
        stock_capacity: ''
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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingBranch) {
        await axios.post(`/api/branches/${editingBranch.id}/update`, formData, { headers });
        toast.success('Branch updated successfully!');
      } else {
        await axios.post('/api/branches/create', formData, { headers });
        toast.success('Branch created successfully!');
      }

      fetchBranches();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/branches/${branch.id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Branch ${branch.is_active ? 'deactivated' : 'activated'} successfully!`);
      fetchBranches();
    } catch (error) {
      toast.error('Failed to toggle branch status');
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/branches/${branchToDelete.id}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Branch deleted successfully!');
      fetchBranches();
    } catch (error) {
      toast.error('Failed to delete branch');
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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Update users with new branch assignments
      await axios.post('/api/branches/assign-staff', {
        branch_id: branchForStaffAssignment.id,
        manager_id: staffAssignment.manager_id || null,
        cashier_id: staffAssignment.cashier_id || null
      }, { headers });

      toast.success('Staff assigned successfully!');
      fetchBranches();
      handleCloseStaffDialog();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign staff');
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Manage Branches</h3>
          <p className="text-sm text-muted-foreground">Total: {branches.length} branches</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Branch
        </Button>
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No branches yet</h3>
            <p className="text-muted-foreground mb-6">Start by adding your first branch location</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Branch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => {
            const { manager, cashier } = getBranchUsers(branch.id);
            
            return (
              <Card
                key={branch.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="pb-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
                        >
                          {branch.code}
                        </Badge>
                        <Badge
                          variant={branch.is_active ? 'default' : 'secondary'}
                          className={branch.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-1">{branch.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{branch.address || 'No address'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{branch.phone || 'No phone'}</span>
                  </div>
                  
                  {/* Assigned Staff Section */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-700">Assigned Staff:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenStaffDialog(branch)}
                        className="h-6 px-2 text-xs hover:bg-blue-50"
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        Assign
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span className="font-medium text-xs text-gray-600">Manager:</span>
                        {manager ? (
                          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                            {manager.username}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not assigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 flex-shrink-0 text-green-600" />
                        <span className="font-medium text-xs text-gray-600">Cashier:</span>
                        {cashier ? (
                          <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                            {cashier.username}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(branch)}
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(branch)}
                      className={`flex-1 transition-colors duration-200 ${
                        branch.is_active
                          ? 'hover:bg-orange-50 hover:border-orange-300'
                          : 'hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      <Power className="w-3 h-3 mr-1" />
                      {branch.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBranchToDelete(branch);
                        setDeleteDialogOpen(true);
                      }}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
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
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager_name">Manager Name</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => handleChange('manager_name', e.target.value)}
                  placeholder="Enter manager name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_phone">Manager Phone</Label>
                <Input
                  id="manager_phone"
                  value={formData.manager_phone}
                  onChange={(e) => handleChange('manager_phone', e.target.value)}
                  placeholder="Enter manager phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operating_hours">Operating Hours</Label>
                <Input
                  id="operating_hours"
                  value={formData.operating_hours}
                  onChange={(e) => handleChange('operating_hours', e.target.value)}
                  placeholder="e.g., 08:00 - 20:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_capacity">Stock Capacity</Label>
                <Input
                  id="stock_capacity"
                  value={formData.stock_capacity}
                  onChange={(e) => handleChange('stock_capacity', e.target.value)}
                  placeholder="e.g., 1000 items"
                />
              </div>
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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