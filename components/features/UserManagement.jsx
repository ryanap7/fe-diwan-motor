'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, UserCheck, Store, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usersAPI, branchesAPI, rolesAPI } from '@/lib/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
    role: 'CASHIER',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('UserManagement - Starting to fetch data...');
      
      const [usersRes, branchesRes] = await Promise.all([
        usersAPI.getAll(),
        branchesAPI.getAll()
      ]);

      // Safely extract data from API response with multiple format support
      const extractArrayData = (response) => {
        // Handle direct array
        if (Array.isArray(response)) return response;
        
        // Handle API3.md structure: { data: { users: [...] } }
        if (response?.data?.users && Array.isArray(response.data.users)) {
          return response.data.users;
        }
        
        // Handle API3.md structure for branches: { data: { branches: [...] } }
        if (response?.data?.branches && Array.isArray(response.data.branches)) {
          return response.data.branches;
        }
        
        // Handle legacy structure: { data: [...] }
        if (response?.data && Array.isArray(response.data)) return response.data;
        
        // Handle success wrapper: { success: true, data: [...] }
        if (response?.success && Array.isArray(response.data)) return response.data;
        
        console.warn('Unexpected API response structure:', response);
        return [];
      };
      
      const userData = extractArrayData(usersRes);
      const branchData = extractArrayData(branchesRes);
      
      console.log('UserManagement - Raw API Response:', { usersRes, branchesRes });
      console.log('UserManagement - Extracted Data:', { userData, branchData });
      
      setUsers(userData);
      setBranches(branchData);
      
      // Hardcoded roles sesuai API3.md
      setRoles([
        { id: 'ADMIN', name: 'Admin' },
        { id: 'BRANCH_MANAGER', name: 'Branch Manager' },
        { id: 'CASHIER', name: 'Cashier' }
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set empty state on error
      setUsers([]);
      setBranches([]);
      
      toast.error('Failed to load data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        password: '',
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role || 'CASHIER',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        email: '',
        fullName: '',
        phone: '',
        role: 'CASHIER',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation berdasarkan API3.md
    if (!formData.username?.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (!formData.email?.trim()) {
      toast.error('Email is required');
      return;
    }
    
    if (!formData.fullName?.trim()) {
      toast.error('Full Name is required');
      return;
    }
    
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }
    
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }
    
    setSaving(true);

    try {
      // Prepare data sesuai API3.md
      const dataToSend = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone?.trim() || '',
        role: formData.role,
        isActive: formData.isActive
      };

      if (editingUser) {
        if (formData.password?.trim()) {
          dataToSend.password = formData.password;
        }
        await usersAPI.update(editingUser.id, dataToSend);
        toast.success('User updated successfully!');
      } else {
        dataToSend.password = formData.password;
        await usersAPI.create(dataToSend);
        toast.success('User created successfully!');
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('User save error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await usersAPI.delete(userToDelete.id);
      toast.success('User deleted successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Failed to delete user');
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleById = (roleId) => {
    // Handle string role directly from API3.md
    if (typeof roleId === 'string' && ['ADMIN', 'BRANCH_MANAGER', 'CASHIER'].includes(roleId)) {
      return roles.find(r => r.id === roleId);
    }
    // Handle legacy role_id
    return roles.find(r => r.id === roleId);
  };

  const getBranchById = (branchId) => {
    if (!branchId) return null;
    return branches.find(b => b.id === branchId);
  };

  const getRoleBadgeColor = (roleName) => {
    // Handle both direct string role and role object
    const role = typeof roleName === 'string' ? roleName : roleName?.name;
    
    if (role === 'Admin' || role === 'ADMIN') return 'bg-purple-500';
    if (role === 'Branch Manager' || role === 'BRANCH_MANAGER') return 'bg-blue-500';
    if (role === 'Cashier' || role === 'CASHIER') return 'bg-green-500';
    return 'bg-gray-500';
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
          <h3 className="text-lg font-semibold text-gray-900">Kelola Pengguna</h3>
          <p className="text-sm text-muted-foreground">Total: {users.length} pengguna</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* Users Grid */}
      {!Array.isArray(users) || users.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users yet</h3>
            <p className="text-muted-foreground mb-6">Start by adding your first user</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(users) && users.map((user) => {
            const role = getRoleById(user.role || user.role_id);
            const branch = user.branch || getBranchById(user.branchId || user.branch_id);
            
            return (
              <Card
                key={user.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardHeader className="pb-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{user.username}</CardTitle>
                        {(role || user.role) && (
                          <Badge className={`${getRoleBadgeColor(role?.name || user.role)} hover:${getRoleBadgeColor(role?.name || user.role)} text-white text-xs`}>
                            {role?.name || user.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  {branch ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{branch.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="w-4 h-4 flex-shrink-0" />
                      <span className="text-gray-400 italic">No branch assigned</span>
                    </div>
                  )}
                  
                  {role && role.permissions && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Permissions:</span> {role.permissions.slice(0, 2).join(', ')}
                      {role.permissions.length > 2 && ` +${role.permissions.length - 2} more`}
                    </div>
                  )}

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(user)}
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={user.username === 'admin'}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and assignments' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Enter username"
                required
                disabled={editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

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
              <Label htmlFor="password">
                Password {!editingUser && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={editingUser ? 'Leave empty to keep current' : 'Enter password'}
                required={!editingUser}
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground">Leave empty to keep current password</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="text-sm font-normal">Active User</Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>💡 Info:</strong> To assign Branch Managers and Cashiers to branches, go to <strong>Branches</strong> menu and click the <strong>"Assign"</strong> button on each branch card.
              </p>
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
                  editingUser ? 'Update User' : 'Create User'
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
              This will permanently delete the user <strong>{userToDelete?.username}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
