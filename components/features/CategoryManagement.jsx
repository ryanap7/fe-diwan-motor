"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Power,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categoriesAPI } from "@/lib/api";

const CategoryManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log("CategoryManagement - Starting to fetch data...");
      const response = await categoriesAPI.getAll();

      console.log("DF", response);

      // Safely extract data from API response with multiple format support
      const extractArrayData = (response) => {
        // Handle direct array
        if (Array.isArray(response)) return response;

        // Handle API structure: { data: { categories: [...] } }
        if (
          response?.data?.categories &&
          Array.isArray(response.data.categories)
        ) {
          return response.data.categories;
        }

        // Handle legacy structure: { data: [...] }
        if (response?.data && Array.isArray(response.data))
          return response.data;

        // Handle success wrapper: { success: true, data: [...] }
        if (response?.success && Array.isArray(response.data))
          return response.data;

        console.warn("Unexpected API response structure:", response);
        return [];
      };

  let categoryData = extractArrayData(response);

  // Filter out soft-deleted categories (those with deletedAt not null)
  categoryData = (Array.isArray(categoryData) ? categoryData : []).filter((cat) => !cat.deletedAt);

  // Sort parent categories A -> Z by name
  categoryData = categoryData.slice().sort((a, b) => (a?.name || '').toString().localeCompare((b?.name || '').toString()));

      // Flatten the structure - convert children array to parent-child relationships
      const flattenCategories = (categories) => {
        const flattened = [];

        categories.forEach((category) => {
          // Add the parent category
          const parentCategory = { ...category };
          delete parentCategory.children; // Remove children array
          flattened.push(parentCategory);

          // Add all children as separate entries with parentId (children sorted A -> Z)
          if (category.children && category.children.length > 0) {
            const childrenSorted = category.children
              .filter((c) => !c.deletedAt)
              .slice()
              .sort((a, b) => (a?.name || '').toString().localeCompare((b?.name || '').toString()));

            childrenSorted.forEach((child) => {
              flattened.push({
                ...child,
                parentId: category.id,
              });
            });
          }
        });

        return flattened;
      };

      const flattenedCategories = flattenCategories(categoryData);

      console.log(
        "CategoryManagement - Flattened Categories:",
        flattenedCategories
      );

      setCategories(flattenedCategories);
    } catch (error) {
      console.error("Failed to load categories:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Set empty state on error
      setCategories([]);

      toast({
        title: "Error",
        description:
          "Gagal memuat kategori: " +
          (error.response?.data?.message || error.message),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        description: category.description || "",
        parent_id: category.parentId || "",
        is_active: category.isActive ?? true,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        parent_id: "",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert form data to API3 format
      const categoryData = {
        name: formData.name,
        parentId: formData.parent_id || null,
        description: formData.description,
        isActive: formData.is_active,
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, categoryData);
        toast({
          title: "Berhasil",
          description: "Kategori berhasil diperbarui!",
        });
      } else {
        await categoriesAPI.create(categoryData);
        toast({
          title: "Berhasil",
          description: "Kategori berhasil dibuat!",
        });
      }

      fetchCategories();
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Gagal menyimpan kategori",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const currentStatus = category.isActive;
      const newStatus = !currentStatus;
      await categoriesAPI.updateStatus(category.id, newStatus);

      const message = newStatus ? "diaktifkan" : "dinonaktifkan";
      toast({
        title: "Berhasil",
        description: `Kategori berhasil ${message}!`,
      });
      fetchCategories();
    } catch (error) {
      console.error("Failed to toggle category status:", error);
      toast({
        title: "Error",
        description:
          "Gagal mengubah status kategori: " +
          (error.response?.data?.message || error.message),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      // Ask user if they want to cascade delete subcategories
      const hasSubcategories = categories.some(
        (cat) => cat.parentId === categoryToDelete.id
      );
      const cascade = hasSubcategories
        ? window.confirm(
            "Kategori ini memiliki subkategori. Hapus juga semua subkategori?"
          )
        : false;

      await categoriesAPI.delete(categoryToDelete.id, cascade);
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus!",
      });
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast({
        title: "Error",
        description:
          "Gagal menghapus kategori: " +
          (error.response?.data?.message || error.message),
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getParentCategories = () => {
    return categories.filter((cat) => !cat.parentId && !cat.deletedAt);
  };

  const getChildCategories = (parentId) => {
    return categories.filter(
      (cat) => cat.parentId === parentId && !cat.deletedAt
    );
  };

  const renderNestedCategoryOptions = () => {
    const renderCategory = (category, level = 0) => {
      // Don't show the category we're editing as option
      if (editingCategory && category.id === editingCategory.id) {
        return null;
      }

      const indent = "　".repeat(level); // Using Japanese space for proper indentation
      const icon = level === 0 ? "📁" : "📄";
      const children = getChildCategories(category.id);

      return (
        <div key={category.id}>
          <SelectItem value={category.id} className="font-medium">
            {indent}
            {icon} {category.name}
          </SelectItem>
          {children.map((child) => renderCategory(child, level + 1))}
        </div>
      );
    };

    return getParentCategories().map((parent) => renderCategory(parent));
  };

  const renderCategoryTree = () => {
    const parentCategories = getParentCategories();

    if (parentCategories.length === 0) {
      return (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Belum ada kategori
            </h3>
            <p className="mb-6 text-muted-foreground">
              Mulai dengan menambahkan kategori pertama Anda
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori Pertama
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {parentCategories.map((parent) => {
          const children = getChildCategories(parent.id);
          const childCount = children.length;

          return (
            <Card key={parent.id} className="border-0 rounded-lg shadow-sm">
              <CardContent className="p-3">
                <div className="relative">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg shadow-sm bg-gradient-to-r from-blue-500 to-purple-500">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 text-sm font-semibold text-gray-900 line-clamp-2">{parent.name}</h3>
                      {/* compact: hide description on small screens, show on lg */}
                      {parent.description && (
                        <p className="hidden text-xs text-muted-foreground line-clamp-2 lg:block">{parent.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(parent)}
                          className="px-3 rounded-lg h-9"
                          title="Ubah"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(parent)}
                          className={`h-9 px-3 rounded-lg ${parent.isActive ? 'hover:bg-orange-50' : 'hover:bg-green-50'}`}
                          title={parent.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setCategoryToDelete(parent); setDeleteDialogOpen(true); }}
                          className="px-3 text-red-600 rounded-lg h-9 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant={(parent.isActive ?? parent.is_active) ? 'default' : 'secondary'} className={(parent.isActive ?? parent.is_active) ? 'bg-green-500 text-[11px] px-2 py-1 rounded' : 'text-[11px] px-2 py-1 rounded'}>
                        {(parent.isActive ?? parent.is_active) ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {childCount > 0 && (
                  <div className="p-2 space-y-2 sm:p-2">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center gap-3 p-2 transition-colors rounded-md bg-gray-50 hover:bg-gray-100">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 font-medium text-gray-900 truncate">{child.name}</span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(child)} className="h-8 px-2 rounded-lg hover:bg-blue-50" title="Ubah">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(child)} className="h-8 px-2 rounded-lg hover:bg-orange-50" title="Toggle">
                            <Power className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setCategoryToDelete(child); setDeleteDialogOpen(true); }} className="h-8 px-2 rounded-lg hover:bg-red-50 hover:text-red-600" title="Hapus">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6 sm:px-6 lg:px-8">
      {/* Mobile-responsive header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Kelola Kategori Produk
          </h3>
          <p className="text-sm text-muted-foreground">
            Total: {categories.length} kategori
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={fetchCategories}
            disabled={loading}
            className="w-full hover:bg-gray-50 sm:w-auto"
            size="sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg
                  className="w-4 h-4 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </>
            )}
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-full text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 sm:w-auto"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Tambah Kategori</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {renderCategoryTree()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingCategory ? "Ubah Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingCategory
                ? "Perbarui informasi kategori"
                : "Buat kategori produk baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Masukkan nama kategori"
                required
                disabled={saving}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Kategori Induk (Opsional)</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(value) =>
                  handleChange("parent_id", value === "none" ? "" : value)
                }
                disabled={saving}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih kategori induk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-medium">
                    📁 Tidak Ada (Kategori Utama)
                  </SelectItem>
                  {renderNestedCategoryOptions()}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Kosongkan jika ini kategori utama
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Deskripsi kategori (opsional)"
                rows={3}
                className="resize-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  handleChange("is_active", value === "active")
                }
                disabled={saving}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="active"
                    className="font-medium text-green-600"
                  >
                    ✅ Aktif
                  </SelectItem>
                  <SelectItem
                    value="inactive"
                    className="font-medium text-gray-600"
                  >
                    ⏸️ Nonaktif
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : editingCategory ? (
                  "Perbarui Kategori"
                ) : (
                  "Buat Kategori"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus kategori{" "}
              <strong>{categoryToDelete?.name}</strong> secara permanen.
              {categoryToDelete &&
                getChildCategories(categoryToDelete.id).length > 0 && (
                  <span className="block mt-2 font-semibold text-orange-600">
                    ⚠️ Kategori ini memiliki{" "}
                    {getChildCategories(categoryToDelete.id).length}{" "}
                    sub-kategori. Sub-kategori akan menjadi kategori utama.
                  </span>
                )}
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Kategori
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoryManagement;
