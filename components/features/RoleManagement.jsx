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
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Edit, Trash2, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'All Permissions', description: 'Full system access' },
  { id: 'manage_branch', label: 'Manage Branch', description: 'Manage branch operations' },
  { id: 'manage_inventory', label: 'Manage Inventory', description: 'Add, edit, delete inventory' },
  { id: 'manage_products', label: 'Manage Products', description: 'Add, edit, delete products' },
  { id: 'manage_suppliers', label: 'Manage Suppliers', description: 'Add, edit, delete suppliers' },
  { id: 'manage_customers', label: 'Manage Customers', description: 'Add, edit, delete customers' },
  { id: 'process_sales', label: 'Process Sales', description: 'Create sales transactions' },
  { id: 'view_reports', label: 'View Reports', description: 'Access reports and analytics' },
  { id: 'view_products', label: 'View Products', description: 'View product catalog' },
];

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data || []);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingRole) {
        await axios.post(`/api/roles/${editingRole.id}/update`, formData, { headers });
        toast.success('Role updated successfully!');
      } else {
        await axios.post('/api/roles/create', formData, { headers });
        toast.success('Role created successfully!');
      }

      fetchRoles();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/roles/${roleToDelete.id}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Role deleted successfully!');
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete role');
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const index = permissions.indexOf(permissionId);
      
      if (index > -1) {
        permissions.splice(index, 1);
      } else {
        permissions.push(permissionId);
      }
      
      return { ...prev, permissions };
    });
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
          <h3 className="text-lg font-semibold text-gray-900">System User Roles</h3>
          <p className="text-sm text-muted-foreground">Total: {roles.length} predefined roles</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Info:</strong> System roles are predefined and cannot be modified
          </p>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card
            key={role.id}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="pb-3 relative">
              <div className="flex items-start justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                {role.is_system && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    System
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{role.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {role.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.length > 0 ? (
                    role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs bg-purple-50 border-purple-200">
                        {AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No permissions</span>
                  )}
                  {role.permissions?.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      +{role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4">
                {role.is_system ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-gray-600">
                      <Shield className="w-3 h-3 inline mr-1" />
                      System Role - Read Only
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(role)}
                      className="flex-1 hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRoleToDelete(role);
                        setDeleteDialogOpen(true);
                      }}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs removed - roles are now fixed and read-only */}
    </div>
  );
};

export default RoleManagement;