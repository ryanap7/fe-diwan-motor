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
  Package,
  Plus,
  Edit,
  Trash2,
  Power,
  Loader2,
  Search,
  Image as ImageIcon,
  Tag,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import {
  productsAPI,
  categoriesAPI,
  brandsAPI,
  branchesAPI,
  stockAPI,
} from "@/lib/api";

const UOM_OPTIONS = [
  "Pcs",
  "Unit",
  "Box",
  "Lusin",
  "Karton",
  "Kg",
  "Liter",
  "Meter",
  "Set",
];

const ProductManagement = () => {
  // Auto-generate functions
  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PRD-${timestamp}-${randomStr}`;
  };

  const generateBarcode = () => {
    // Generate 13-digit EAN barcode
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return (timestamp.slice(-9) + random).substring(0, 13);
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [selectedProductForPromo, setSelectedProductForPromo] = useState(null);
  const [promoFormData, setPromoFormData] = useState({
    discount_percentage: "",
    is_active: true,
  });

  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    unit: "Pcs", // Default to Pcs
    compatibleModels: "",
    purchasePrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    minStock: "",
    minOrderWholesale: "", // Min Transaksi Grosir
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
    specifications: {},
    storageLocation: "Gudang", // Default to Gudang
    tags: "Product", // Default tag
    images: [], // Default empty
    mainImage: "",
    isActive: true,
    isFeatured: false, // Disabled by default
  });
  const [saving, setSaving] = useState(false);
  
  // Stock Management State
  const [stockData, setStockData] = useState({
    action: 'insert', // 'insert' or 'remove'
    quantity: '',
    notes: '',
    reason: ''
  });

  useEffect(() => {
    // Verifikasi token tersedia sebelum fetch data
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found. Please login first.');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsRes, categoriesRes, brandsRes, branchesRes] =
        await Promise.all([
          productsAPI.getAll(),
          categoriesAPI.getAll(),
          brandsAPI.getAll(),
          branchesAPI.getAll(),
        ]);

      // Handle API response - correct structure based on API testing
      console.log("Products API Response:", productsRes);
      console.log("Categories API Response:", categoriesRes);
      console.log("Brands API Response:", brandsRes);

      const extractedProducts = Array.isArray(productsRes?.data?.products)
        ? productsRes.data.products
        : Array.isArray(productsRes?.data?.data)
        ? productsRes.data.data
        : Array.isArray(productsRes?.data)
        ? productsRes.data
        : [];

      const extractedCategories = Array.isArray(categoriesRes?.data?.categories)
        ? categoriesRes.data.categories
        : Array.isArray(categoriesRes?.data?.data)
        ? categoriesRes.data.data
        : Array.isArray(categoriesRes?.data)
        ? categoriesRes.data
        : [];

      const extractedBrands = Array.isArray(brandsRes?.data?.brands)
        ? brandsRes.data.brands
        : Array.isArray(brandsRes?.data?.data)
        ? brandsRes.data.data
        : Array.isArray(brandsRes?.data)
        ? brandsRes.data
        : [];

      const extractedBranches = Array.isArray(branchesRes?.data?.branches)
        ? branchesRes.data.branches
        : Array.isArray(branchesRes?.data?.data)
        ? branchesRes.data.data
        : Array.isArray(branchesRes?.data)
        ? branchesRes.data
        : [];

      console.log(
        "Extracted Products:",
        extractedProducts.length,
        extractedProducts
      );
      console.log(
        "Extracted Categories:",
        extractedCategories.length,
        extractedCategories
      );
      console.log("Extracted Brands:", extractedBrands.length, extractedBrands);
      
      // Debug minOrderWholesale field
      if (extractedProducts.length > 0) {
        console.log('First product minOrderWholesale fields check:', {
          minOrderWholesale: extractedProducts[0].minOrderWholesale,
          min_order_wholesale: extractedProducts[0].min_order_wholesale,
          minWholesaleQuantity: extractedProducts[0].minWholesaleQuantity,
          allKeys: Object.keys(extractedProducts[0])
        });
      }

      setProducts(extractedProducts);
      setCategories(extractedCategories);
      setBrands(extractedBrands);
      setBranches(extractedBranches);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      toast.error(
        "Gagal memuat data: " + (error.response?.data?.message || error.message)
      );

      // Set default empty arrays on error
      setProducts([]);
      setCategories([]);
      setBrands([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku || "",
        barcode: product.barcode || "",
        name: product.name || "",
        description: product.description || "",
        categoryId: product.categoryId || product.category?.id || "",
        brandId: product.brandId || product.brand?.id || "",
        unit: product.unit || "Pcs",
        compatibleModels: product.compatibleModels || "",
        purchasePrice: product.purchasePrice || "",
        sellingPrice: product.sellingPrice || "",
        wholesalePrice: product.wholesalePrice || "",
        minStock: product.minStock || "",
        minOrderWholesale: product.minOrderWholesale || product.min_order_wholesale || product.minWholesaleQuantity || (product.wholesalePrice ? "1" : ""),
        weight: product.weight || "",
        dimensions: {
          length: product.dimensions?.length || "",
          width: product.dimensions?.width || "",
          height: product.dimensions?.height || "",
        },
        specifications: product.specifications || {},
        storageLocation: product.storageLocation || "Gudang",
        tags: product.tags || "",
        images: product.images || [],
        mainImage: product.mainImage || "",
        isActive: product.isActive !== undefined ? product.isActive : true,
        isFeatured:
          product.isFeatured !== undefined ? product.isFeatured : false,
      });
    } else {
      setEditingProduct(null);
      // Auto-generate values for new product
      const firstBrandId =
        Array.isArray(brands) && brands.length > 0 ? brands[0].id : "";
      console.log('Auto-selecting first brand:', firstBrandId, 'from brands:', brands);
      setFormData({
        sku: generateSKU(), // Auto-generate SKU
        barcode: generateBarcode(), // Auto-generate Barcode
        name: "",
        description: "",
        categoryId: "",
        brandId: firstBrandId, // Auto-select first brand
        unit: "Pcs", // Default to Pcs
        compatibleModels: "",
        purchasePrice: "",
        sellingPrice: "",
        wholesalePrice: "",
        minStock: "",
        minOrderWholesale: "",
        weight: "",
        dimensions: {
          length: "",
          width: "",
          height: "",
        },
        specifications: {},
        storageLocation: "Gudang", // Auto-input Gudang
        tags: "Product", // Default tag
        images: [], // Default empty images
        mainImage: "",
        isActive: true,
        isFeatured: false, // Disabled by default
      });
    }
    
    // Reset stock data
    setStockData({
      action: 'insert',
      quantity: '',
      notes: '',
      reason: ''
    });
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    // Reset stock data
    setStockData({
      action: 'insert',
      quantity: '',
      notes: '',
      reason: ''
    });
  };

  const calculateMargin = (purchase, selling) => {
    if (!purchase || !selling) return 0;
    const margin = ((selling - purchase) / selling) * 100;
    return margin.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submit attempt with data:', formData);
    console.log('Current brands state:', brands);
    setSaving(true);

    try {
      // Struktur data sesuai API3_productcustomer.md
      const dataToSend = {
        sku: formData.sku,
        barcode: formData.barcode,
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        brandId: formData.brandId,
        unit: formData.unit,
        compatibleModels: formData.compatibleModels,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
        minStock: parseInt(formData.minStock) || 0,
        minOrderWholesale: parseInt(formData.minOrderWholesale) || 0,
        specifications:
          typeof formData.specifications === "string"
            ? { description: formData.specifications }
            : formData.specifications,
        storageLocation: formData.storageLocation,
        tags: formData.tags,
        images: formData.images.filter((img) => img && img.trim() !== ""),
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      console.log('Data to send - minOrderWholesale:', dataToSend.minOrderWholesale);
      console.log('Form data - minOrderWholesale:', formData.minOrderWholesale);
      console.log('Complete data being sent to API:', JSON.stringify(dataToSend, null, 2));

      // Only include mainImage if it has a valid value (not empty string)
      if (formData.mainImage && formData.mainImage.trim() !== "") {
        dataToSend.mainImage = formData.mainImage;
      }

      // Only include dimensions if they have valid values (> 0)
      const length = parseFloat(formData.dimensions.length) || 0;
      const width = parseFloat(formData.dimensions.width) || 0;
      const height = parseFloat(formData.dimensions.height) || 0;

      if (length > 0 || width > 0 || height > 0) {
        dataToSend.dimensions = {
          length: Math.max(length, 0.1), // Minimum 0.1 to avoid validation error
          width: Math.max(width, 0.1),
          height: Math.max(height, 0.1),
        };
      }

      // Only include weight if it has a valid value (> 0)
      const weight = parseFloat(formData.weight) || 0;
      if (weight > 0) {
        dataToSend.weight = weight;
      }

      let apiResponse;
      if (editingProduct) {
        apiResponse = await productsAPI.update(editingProduct.id, dataToSend);
        toast.success("Produk berhasil diperbarui!");
        
        // Handle stock adjustment for existing product
        if (stockData.quantity && parseInt(stockData.quantity) > 0) {
          await handleStockAdjustment(editingProduct.id);
        }
      } else {
        apiResponse = await productsAPI.create(dataToSend);
        toast.success("Produk berhasil dibuat!");
        
        // Handle stock adjustment for new product
        if (stockData.quantity && parseInt(stockData.quantity) > 0) {
          const newProductId = apiResponse.data?.id || apiResponse.id;
          if (newProductId) {
            await handleStockAdjustment(newProductId);
          }
        }
      }

      console.log('API Response after save:', apiResponse);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Gagal menyimpan produk"
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async (productId) => {
    try {
      // Get user branch ID from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const branchId = userData.branch?.id;
      
      if (!branchId) {
        toast.error('User belum di-assign ke cabang. Hubungi administrator.');
        return;
      }

      // Struktur request sesuai API spec
      const stockAdjustmentData = {
        branchId: branchId,
        quantity: parseInt(stockData.quantity),
        type: stockData.action === 'insert' ? 'IN' : 'OUT',
        reason: stockData.reason || (stockData.action === 'insert' ? 'Manual stock increase' : 'Manual stock decrease'),
        notes: stockData.notes || `Stock ${stockData.action} via product form`
      };

      console.log('Stock adjustment data:', stockAdjustmentData);
      console.log('Posting to endpoint:', `/api/stocks/adjust/${productId}`);
      
      // Post to stock adjustment API dengan productId sebagai parameter URL
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stocks/adjust/${productId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stockAdjustmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Stock adjustment failed');
      }

      const result = await response.json();
      console.log('Stock adjustment success:', result);
      
      const actionText = stockData.action === 'insert' ? 'ditambahkan' : 'dikurangi';
      toast.success(`Stock berhasil ${actionText}: ${stockData.quantity} unit`);
      
    } catch (error) {
      console.error('Stock adjustment error:', error);
      toast.error(
        `Gagal melakukan adjustment stock: ${error.message || 'Unknown error'}`
      );
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const newActiveStatus = !product.isActive;
      await productsAPI.updateStatus(product.id, newActiveStatus);
      const message = newActiveStatus ? "diaktifkan" : "dinonaktifkan";
      toast.success("Produk berhasil " + message + "!");
      fetchData();
    } catch (error) {
      toast.error(
        "Gagal mengubah status produk: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await productsAPI.delete(productToDelete.id);
      toast.success("Produk berhasil dihapus!");
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Gagal menghapus produk"
      );
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStockChange = (field, value) => {
    setStockData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error("Maksimal 3 gambar");
      return;
    }

    // Convert files to base64
    const readers = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers)
      .then((base64Images) => {
        setFormData({ ...formData, images: base64Images, imageFiles: files });
      })
      .catch((error) => {
        toast.error("Gagal membaca file gambar");
        console.error(error);
      });
  };

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newFiles = formData.imageFiles.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages, imageFiles: newFiles });
  };

  const getCategoryName = (categoryId) => {
    if (!Array.isArray(categories)) return "-";
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : "-";
  };

  const getBrandName = (brandId) => {
    if (!Array.isArray(brands)) return "-";
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.name : "-";
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const matchSearch =
          searchQuery === "" ||
          (product.name &&
            product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.sku &&
            product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchCategory =
          filterCategory === "all" ||
          product.categoryId === filterCategory ||
          product.category?.id === filterCategory;
        const matchBrand =
          filterBrand === "all" ||
          product.brandId === filterBrand ||
          product.brand?.id === filterBrand;

        return matchSearch && matchCategory && matchBrand;
      })
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-0 shadow-md animate-pulse rounded-xl">
              <CardContent className="p-0">
                <div className="h-40 bg-gray-200 sm:h-48 rounded-t-xl"></div>
                <div className="p-3 space-y-3 sm:p-4">
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                  <div className="flex justify-between">
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">Kelola Produk</h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Total: {filteredProducts.length} produk
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="w-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 transform shadow-lg sm:w-auto sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Tambah Produk</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </div>

      {/* Search & Filter - Mobile Responsive */}
      <Card className="border-0 shadow-md rounded-xl">
        <CardContent className="p-3 sm:p-4 md:pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3.5" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-3 pl-10 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="py-3 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {Array.isArray(categories) &&
                  categories
                    .filter((cat) => cat.isActive === true)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="py-3 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Semua Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Brand</SelectItem>
                {Array.isArray(brands) &&
                  brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-md rounded-xl">
          <CardContent className="py-8 text-center sm:pt-12 sm:pb-12">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {products.length === 0
                ? "Belum ada produk"
                : "Tidak ada produk yang cocok"}
            </h3>
            <p className="mb-6 text-muted-foreground">
              {products.length === 0
                ? "Mulai dengan menambahkan produk pertama Anda"
                : "Coba ubah filter atau kata kunci pencarian"}
            </p>
            {products.length === 0 && (
              <Button
                onClick={() => handleOpenDialog()}
                className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        // Product Grid - Mobile Responsive
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const margin = calculateMargin(
              product.purchase_price,
              product.price_levels?.normal
            );
            const mainImage =
              product.images && product.images.length > 0
                ? product.images[0]
                : null;

            return (
              <Card
                key={product.id}
                className="overflow-hidden transition-all duration-300 transform border-0 shadow-md hover:shadow-lg hover:-translate-y-1 rounded-xl"
              >
                {mainImage && (
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 sm:h-48">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-2 font-mono text-xs bg-gray-50">
                        {product.sku}
                      </Badge>
                      <h3 className="mb-1 text-sm font-bold leading-tight text-gray-900 sm:text-base line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2 text-xs sm:gap-2 text-muted-foreground">
                        <span className="truncate">{product.category?.name || "No Category"}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden truncate sm:inline">{product.brand?.name || "No Brand"}</span>
                      </div>
                    </div>
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className={`ml-2 text-xs rounded-full ${product.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"}`}
                    >
                      {product.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>

                  <div className="pt-3 mb-3 space-y-2 border-t border-gray-100">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-medium text-muted-foreground">Harga Jual:</span>
                      <span className="font-bold text-right text-blue-600">
                        Rp {product.sellingPrice?.toLocaleString("id-ID") || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Harga Grosir:
                      </span>
                      <span className="text-right">
                        Rp{" "}
                        {product.wholesalePrice?.toLocaleString("id-ID") || "0"}
                      </span>
                    </div>
                    {product.wholesalePrice && parseInt(product.wholesalePrice) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Min Grosir:
                        </span>
                        <span className="font-medium text-right text-blue-600">
                          {product.minOrderWholesale || product.min_order_wholesale || product.minWholesaleQuantity || "1"} unit+
                        </span>
                      </div>
                    )}
                    {product.promo &&
                      product.promo.is_active &&
                      product.promo.discount_percentage > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-orange-500">
                            🎉 Promo Diskon!
                          </span>
                          <span className="font-bold text-orange-600">
                            {product.promo.discount_percentage}% OFF
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between pt-2 text-xs border-t">
                      <span className="text-muted-foreground">Margin:</span>
                      <span
                        className={`text-right ${
                          parseFloat(margin) > 20
                            ? "text-green-600 font-semibold"
                            : "text-orange-600"
                        }`}
                      >
                        {margin}%
                      </span>
                    </div>
                  </div>

                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(typeof product.tags === "string"
                        ? product.tags.split(",").slice(0, 3)
                        : Array.isArray(product.tags)
                        ? product.tags.slice(0, 3)
                        : []
                      ).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs truncate bg-blue-50 max-w-16 sm:max-w-none"
                        >
                          <Tag className="flex-shrink-0 w-2 h-2 mr-1" />
                          <span className="truncate">
                            {typeof tag === "string" ? tag.trim() : tag}
                          </span>
                        </Badge>
                      ))}
                      {(() => {
                        const tagsArray =
                          typeof product.tags === "string"
                            ? product.tags.split(",").filter((t) => t.trim())
                            : Array.isArray(product.tags)
                            ? product.tags
                            : [];
                        return (
                          tagsArray.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{tagsArray.length - 3}
                            </Badge>
                          )
                        );
                      })()}
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    {/* Mobile Layout - Stacked buttons */}
                    <div className="flex flex-col gap-2 sm:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(product)}
                        className="w-full py-2.5 text-sm font-medium transition-all duration-200 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl"
                      >
                        <Edit className="w-3 h-3 mr-2" />
                        Ubah Produk
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProductForPromo(product);
                            if (product.promo && product.promo.is_active) {
                              setPromoFormData({
                                discount_percentage:
                                  product.promo.discount_percentage || "",
                                is_active: product.promo.is_active,
                              });
                            } else {
                              setPromoFormData({
                                discount_percentage: "",
                                is_active: true,
                              });
                            }
                            setPromoDialogOpen(true);
                          }}
                          className="flex-1 py-2 text-xs font-medium transition-all duration-200 border-2 border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 rounded-xl"
                        >
                          <Percent className="w-3 h-3 mr-1" />
                          Promo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(product)}
                          className={`flex-1 py-2 text-xs font-medium transition-all duration-200 border-2 rounded-xl ${
                            product.is_active
                              ? "border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                              : "border-green-200 hover:bg-green-50 hover:border-green-300"
                          }`}
                        >
                          <Power className="w-3 h-3 mr-1" />
                          {product.is_active ? "Off" : "On"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProductToDelete(product);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex-1 py-2 text-xs font-medium transition-all duration-200 border-2 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-xl"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout - Horizontal buttons */}
                    <div className="hidden gap-2 sm:flex">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(product)}
                        className="flex-1 hover:bg-blue-50"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Ubah
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProductForPromo(product);
                          if (product.promo && product.promo.is_active) {
                            setPromoFormData({
                              discount_percentage:
                                product.promo.discount_percentage || "",
                              is_active: product.promo.is_active,
                            });
                          } else {
                            setPromoFormData({
                              discount_percentage: "",
                              is_active: true,
                            });
                          }
                          setPromoDialogOpen(true);
                        }}
                        className="hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Percent className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(product)}
                        className={
                          product.is_active
                            ? "hover:bg-orange-50"
                            : "hover:bg-green-50"
                        }
                      >
                        <Power className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductToDelete(product);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingProduct ? "Ubah Produk" : "Tambah Produk Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Perbarui informasi produk"
                : "Buat produk baru dengan detail lengkap"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden Fields - Auto Generated Values */}
            <div style={{ display: "none" }}>
              <div className="space-y-2">
                <Label>
                  SKU/Part Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="contoh: BR-MTR-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  placeholder="Barcode produk"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Nama Produk <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="contoh: Ban Motor Tubeless 120/70-17"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleChange("categoryId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) &&
                    categories
                      .filter((cat) => cat.isActive === true)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hidden Brand - Auto Selected First Brand */}
            <div style={{ display: "none" }}>
              <Label>
                Brand <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) => handleChange("brandId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih brand" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(brands) &&
                    brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* Hidden Unit - Default Pcs */}
            <div style={{ display: "none" }}>
              <Label>Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleChange("unit", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map((uom) => (
                    <SelectItem key={uom} value={uom}>
                      {uom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label>
                Model Kendaraan Compatible{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.compatibleModels}
                onChange={(e) =>
                  handleChange("compatibleModels", e.target.value)
                }
                placeholder="contoh: Yamaha R15, Honda CBR150R, Suzuki GSX-R150"
                required
              />
              <p className="text-xs text-muted-foreground">
                Pisahkan dengan koma untuk multiple model
              </p>
            </div> */}

            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50">
              <div className="space-y-2">
                <Label>
                  Harga Beli <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    handleChange("purchasePrice", e.target.value)
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Harga Jual <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => handleChange("sellingPrice", e.target.value)}
                  placeholder="0"
                  required
                />
                {formData.purchasePrice && formData.sellingPrice && (
                  <p className="text-xs text-green-600">
                    Margin:{" "}
                    {calculateMargin(
                      formData.purchasePrice,
                      formData.sellingPrice
                    )}
                    %
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Harga Grosir <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.wholesalePrice}
                  onChange={(e) => {
                    handleChange("wholesalePrice", e.target.value);
                    // Auto-set minimum 1 untuk minOrderWholesale jika harga grosir diisi
                    if (e.target.value && !formData.minOrderWholesale) {
                      handleChange("minOrderWholesale", "1");
                    }
                  }}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Harga khusus untuk pembelian grosir
                </p>
              </div>
              <div className="space-y-2">
                <Label>
                  Min Transaksi Grosir <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.minOrderWholesale}
                  onChange={(e) => {
                    console.log('Min Transaksi Grosir changed:', e.target.value);
                    handleChange("minOrderWholesale", e.target.value);
                  }}
                  placeholder="0"
                  required
                  min="1"
                  step="1"
                  disabled={!formData.wholesalePrice}
                  className={!formData.wholesalePrice ? "bg-gray-50 opacity-50" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Jumlah minimum untuk mendapat harga grosir
                </p>
                {formData.minOrderWholesale && formData.wholesalePrice && (
                  <div className="p-2 mt-2 border border-green-200 rounded bg-green-50">
                    <p className="text-xs font-medium text-green-700">
                      ✅ Pembelian {formData.minOrderWholesale}+ unit = Rp {parseInt(formData.wholesalePrice).toLocaleString('id-ID')}/unit
                    </p>
                    <p className="text-xs text-green-600">
                      Hemat Rp {(parseInt(formData.sellingPrice || 0) - parseInt(formData.wholesalePrice || 0)).toLocaleString('id-ID')}/unit
                    </p>
                  </div>
                )}
                {!formData.wholesalePrice && (
                  <p className="text-xs text-orange-500">
                    ⚠️ Isi harga grosir terlebih dahulu
                  </p>
                )}
              </div>
            </div>

            {/* Stock Management Section */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="mb-3 text-sm font-semibold text-blue-800">
                📦 Manajemen Stok
              </h4>
              
              {/* Check if user has branch assignment */}
              {(() => {
                try {
                  const userData = JSON.parse(localStorage.getItem('user') || '{}');
                  const branchId = userData.branch?.id;
                  const branchName = userData.branch?.name;
                  
                  if (!branchId) {
                    return (
                      <div className="p-3 mb-3 border border-red-200 rounded bg-red-50">
                        <p className="text-sm font-medium text-red-700">
                          ⚠️ Stock Management Tidak Tersedia
                        </p>
                        <p className="text-xs text-red-600">
                          User belum di-assign ke cabang. Hubungi administrator untuk assign user ke cabang.
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="p-2 mb-3 bg-blue-100 border border-blue-200 rounded">
                      <p className="text-xs text-blue-700">
                        🏢 Stock akan di-adjust untuk cabang: <strong>{branchName}</strong>
                      </p>
                    </div>
                  );
                } catch {
                  return (
                    <div className="p-3 mb-3 border border-red-200 rounded bg-red-50">
                      <p className="text-sm font-medium text-red-700">
                        ⚠️ Error loading user data
                      </p>
                    </div>
                  );
                }
              })()}
              
              {(() => {
                try {
                  const userData = JSON.parse(localStorage.getItem('user') || '{}');
                  const userHasBranch = userData.branch?.id;
                  
                  return (
                    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${!userHasBranch ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="space-y-2">
                        <Label>Aksi Stok</Label>
                        <Select
                          value={stockData.action}
                          onValueChange={(value) => handleStockChange("action", value)}
                          disabled={!userHasBranch}
                        >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insert">➕ Tambah Stok</SelectItem>
                      <SelectItem value="remove">➖ Kurangi Stok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                        <div className="space-y-2">
                          <Label>Jumlah</Label>
                          <Input
                            type="number"
                            min="0"
                            value={stockData.quantity}
                            onChange={(e) => handleStockChange("quantity", e.target.value)}
                            placeholder="0"
                            disabled={!userHasBranch}
                          />
                          <p className="text-xs text-blue-600">
                            Unit yang akan {stockData.action === 'insert' ? 'ditambahkan ke' : 'dikurangi dari'} stok
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Alasan</Label>
                          <Input
                            value={stockData.reason}
                            onChange={(e) => handleStockChange("reason", e.target.value)}
                            placeholder={stockData.action === 'insert' ? 'Pembelian, produksi, dll' : 'Rusak, kehilangan, dll'}
                            disabled={!userHasBranch}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Catatan</Label>
                          <Input
                            value={stockData.notes}
                            onChange={(e) => handleStockChange("notes", e.target.value)}
                            placeholder="Catatan tambahan (opsional)"
                            disabled={!userHasBranch}
                          />
                        </div>
                      </div>
                    );
                } catch {
                  return (
                    <div className="opacity-50 pointer-events-none">
                      <p className="text-sm text-red-600">Error loading form</p>
                    </div>
                  );
                }
              })()}
              {stockData.quantity && parseInt(stockData.quantity) > 0 && (
                <div className={`p-2 mt-3 border rounded ${
                  stockData.action === 'insert' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-orange-200 bg-orange-50'
                }`}>
                  <p className={`text-xs font-medium ${
                    stockData.action === 'insert' ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    {stockData.action === 'insert' ? '✅' : '⚠️'} 
                    {stockData.action === 'insert' ? ' Akan menambah' : ' Akan mengurangi'} stok sebanyak {stockData.quantity} unit
                  </p>
                  <p className={`text-xs ${
                    stockData.action === 'insert' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    Alasan: {stockData.reason || (stockData.action === 'insert' ? 'Manual stock increase' : 'Manual stock decrease')}
                  </p>
                </div>
              )}
              {!stockData.quantity && (
                <div className="p-2 mt-3 border border-gray-200 rounded bg-gray-50">
                  <p className="text-xs text-gray-600">
                    💡 Kosongkan jumlah jika tidak ingin melakukan adjustment stok
                  </p>
                </div>
              )}
            </div>

            {/* Hidden Image Upload - Default Empty */}
            <div style={{ display: "none" }}>
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Gambar Produk (Maksimal 3)
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Upload gambar dari perangkat Anda (JPG, PNG, max 3 gambar)
              </p>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="object-cover w-full h-24 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute flex items-center justify-center w-5 h-5 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* <div className="space-y-2" style={{ display: "none" }}>
              <Label>
                Deskripsi Produk <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Deskripsi detail produk..."
                rows={4}
                className="resize-none"
                required
              />
            </div> */}

            {/* <div className="grid grid-cols-2 gap-4" style={{ display: "none" }}>
              <div className="space-y-2">
                <Label>
                  Lokasi Penyimpanan <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.storageLocation}
                  onChange={(e) =>
                    handleChange("storageLocation", e.target.value)
                  }
                  placeholder="contoh: Rak A-3, Gudang Utama"
                  required
                />
                <p className="text-xs text-muted-foreground">Default: Gudang</p>
              </div>
              <div className="space-y-2">
                <Label>
                  Min Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div> */}

            {/* Hidden Tags - Default "Product" */}
            <div style={{ display: "none" }}>
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags/Label
              </Label>
              <Input
                value={formData.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="contoh: promo, best seller, new arrival"
              />
              <p className="text-xs text-muted-foreground">
                Pisahkan dengan koma untuk multiple tags
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Produk Aktif</Label>
            </div>

            {/* Hidden Product Featured - Disabled by Default */}
            <div style={{ display: "none" }}>
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleChange("isFeatured", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isFeatured">Produk Unggulan</Label>
            </div>

            {/* Debug Info - Show Auto Generated Values */}
            {/* {!editingProduct && (
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="mb-2 text-sm font-semibold text-blue-800">
                  Auto Generated & Default Values:
                </h4>
                <div className="space-y-1 text-xs text-blue-600">
                  <p>
                    <strong>SKU:</strong> {formData.sku}
                  </p>
                  <p>
                    <strong>Barcode:</strong> {formData.barcode}
                  </p>
                  <p>
                    <strong>Brand:</strong>{" "}
                    {(Array.isArray(brands) &&
                      brands.find((b) => b.id === formData.brandId)?.name) ||
                      "Loading..."}
                  </p>
                  <p>
                    <strong>Unit:</strong> {formData.unit}
                  </p>
                  <p>
                    <strong>Storage Location:</strong>{" "}
                    {formData.storageLocation}
                  </p>
                  <p>
                    <strong>Tags:</strong> {formData.tags}
                  </p>
                  <p>
                    <strong>Product Featured:</strong>{" "}
                    {formData.isFeatured ? "Yes" : "No (Disabled)"}
                  </p>
                  <p>
                    <strong>Images:</strong> Empty (Default)
                  </p>
                </div>
              </div>
            )} */}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : editingProduct ? "Update" : "Simpan"}
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
              Ini akan menghapus produk <strong>{productToDelete?.name}</strong>{" "}
              secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promo Dialog */}
      <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Percent className="w-5 h-5 text-orange-500" />
              Atur Promo untuk {selectedProductForPromo?.name}
            </DialogTitle>
            <DialogDescription>
              Set persentase diskon untuk produk ini. Bisa diubah kapan saja!
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            <div className="p-6 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-red-50">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">
                    Diskon Persentase
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={promoFormData.discount_percentage}
                      onChange={(e) =>
                        setPromoFormData((prev) => ({
                          ...prev,
                          discount_percentage: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="text-2xl font-bold text-center"
                    />
                    <span className="text-2xl font-bold text-orange-600">
                      %
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Masukkan persentase diskon (0-100%)
                  </p>
                </div>

                {promoFormData.discount_percentage > 0 &&
                  selectedProductForPromo && (
                    <div className="p-3 mt-4 bg-white border rounded">
                      <p className="mb-2 text-sm font-medium">
                        Preview Harga Setelah Diskon:
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Harga Normal:</span>
                          <div className="text-right">
                            <span className="line-through text-muted-foreground">
                              Rp{" "}
                              {selectedProductForPromo.price_levels?.normal?.toLocaleString(
                                "id-ID"
                              )}
                            </span>
                            <span className="ml-2 font-bold text-green-600">
                              Rp{" "}
                              {Math.round(
                                (selectedProductForPromo.price_levels?.normal *
                                  (100 - promoFormData.discount_percentage)) /
                                  100
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Harga Grosir:</span>
                          <div className="text-right">
                            <span className="line-through text-muted-foreground">
                              Rp{" "}
                              {selectedProductForPromo.price_levels?.wholesale?.toLocaleString(
                                "id-ID"
                              )}
                            </span>
                            <span className="ml-2 font-bold text-green-600">
                              Rp{" "}
                              {Math.round(
                                (selectedProductForPromo.price_levels
                                  ?.wholesale *
                                  (100 - promoFormData.discount_percentage)) /
                                  100
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPromoDialogOpen(false);
                  setPromoFormData({
                    discount_percentage: "",
                    is_active: true,
                  });
                }}
              >
                Batal
              </Button>

              {selectedProductForPromo?.promo &&
                selectedProductForPromo.promo.is_active && (
                  <Button
                    onClick={async () => {
                      try {
                        await productsAPI.removeDiscount(
                          selectedProductForPromo.id
                        );
                        toast.success("Promo dihapus!");
                        fetchData();
                        setPromoDialogOpen(false);
                        setPromoFormData({
                          discount_percentage: "",
                          is_active: true,
                        });
                      } catch (error) {
                        toast.error(
                          "Gagal menghapus promo: " +
                            (error.response?.data?.message || error.message)
                        );
                      }
                    }}
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                  >
                    Hapus Promo
                  </Button>
                )}

              <Button
                onClick={async () => {
                  try {
                    await productsAPI.addDiscount(selectedProductForPromo.id, {
                      discountPercent:
                        parseFloat(promoFormData.discount_percentage) || 0,
                    });
                    toast.success("Promo berhasil disimpan!");
                    fetchData();
                    setPromoDialogOpen(false);
                    setPromoFormData({
                      discount_percentage: "",
                      is_active: true,
                    });
                  } catch (error) {
                    toast.error(
                      "Gagal menyimpan promo: " +
                        (error.response?.data?.message || error.message)
                    );
                  }
                }}
                className="text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                disabled={
                  !promoFormData.discount_percentage ||
                  parseFloat(promoFormData.discount_percentage) <= 0
                }
              >
                <Percent className="w-4 h-4 mr-2" />
                {selectedProductForPromo?.promo &&
                selectedProductForPromo.promo.is_active
                  ? "Update Promo"
                  : "Aktifkan Promo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
