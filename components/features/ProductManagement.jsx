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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  MapPin,
  QrCode,
  AlertTriangle,
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
  const [filterStock, setFilterStock] = useState("all");
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [selectedProductForPromo, setSelectedProductForPromo] = useState(null);
  const [promoFormData, setPromoFormData] = useState({
    discount_percentage: "",
    is_active: true,
  });
  
  const [autoGenerateBarcode, setAutoGenerateBarcode] = useState(true);

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
  const [compressingImages, setCompressingImages] = useState(false);
  
  // Stock Management State
  const [stockData, setStockData] = useState({
    action: 'insert', // 'insert' or 'remove'
    quantity: '',
    notes: '',
    reason: ''
  });

  // Wholesale Price Form Control State
  const [showWholesaleForm, setShowWholesaleForm] = useState(false);

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
      console.log('🔄 Fetching products with limit: 1000');

      // Fetch all data with individual error handling
      const results = await Promise.allSettled([
        productsAPI.getAll({ limit: 1000 }),
        categoriesAPI.getAll(),
        brandsAPI.getAll(),
        branchesAPI.getAll(),
      ]);

      const [productsRes, categoriesRes, brandsRes, branchesRes] = results;

      // Handle individual API failures
      if (productsRes.status === 'rejected') {
        console.error("Products API failed:", productsRes.reason);
      }
      if (categoriesRes.status === 'rejected') {
        console.error("Categories API failed:", categoriesRes.reason);
        toast.error("Gagal memuat data kategori: " + categoriesRes.reason.message);
      }
      if (brandsRes.status === 'rejected') {
        console.error("Brands API failed:", brandsRes.reason);
        toast.error("Gagal memuat data brand: " + brandsRes.reason.message);
      }
      if (branchesRes.status === 'rejected') {
        console.error("Branches API failed:", branchesRes.reason);
      }

      // Extract successful responses
      const productsData = productsRes.status === 'fulfilled' ? productsRes.value : null;
      const categoriesData = categoriesRes.status === 'fulfilled' ? categoriesRes.value : null;
      const brandsData = brandsRes.status === 'fulfilled' ? brandsRes.value : null;
      const branchesData = branchesRes.status === 'fulfilled' ? branchesRes.value : null;

      // Handle API response - correct structure based on API testing

      const extractedProducts = Array.isArray(productsData?.data?.products)
        ? productsData.data.products
        : Array.isArray(productsData?.data?.data)
        ? productsData.data.data
        : Array.isArray(productsData?.data)
        ? productsData.data
        : [];

      const extractedCategories = Array.isArray(categoriesData?.data?.categories)
        ? categoriesData.data.categories
        : Array.isArray(categoriesData?.data?.data)
        ? categoriesData.data.data
        : Array.isArray(categoriesData?.data)
        ? categoriesData.data
        : Array.isArray(categoriesData)
        ? categoriesData
        : [];

      const extractedBrands = Array.isArray(brandsData?.data?.brands)
        ? brandsData.data.brands
        : Array.isArray(brandsData?.data?.data)
        ? brandsData.data.data
        : Array.isArray(brandsData?.data)
        ? brandsData.data
        : Array.isArray(brandsData)
        ? brandsData
        : [];

      const extractedBranches = Array.isArray(branchesData?.data?.branches)
        ? branchesData.data.branches
        : Array.isArray(branchesData?.data?.data)
        ? branchesData.data.data
        : Array.isArray(branchesData?.data)
        ? branchesData.data
        : Array.isArray(branchesData)
        ? branchesData
        : [];



      setProducts(extractedProducts);
      setCategories(extractedCategories.sort((a, b) => a.name?.localeCompare(b.name) || 0));
      setBrands(extractedBrands.sort((a, b) => a.name?.localeCompare(b.name) || 0));
      setBranches(extractedBranches);

      console.log('✅ Data loaded successfully:', {
        products: extractedProducts.length,
        categories: extractedCategories.length,
        brands: extractedBrands.length,
        branches: extractedBranches.length
      });
    } catch (error) {
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
      
      // Set autoGenerateBarcode based on existing barcode
      setAutoGenerateBarcode(!product.barcode || product.barcode === "");
      
      // Set showWholesaleForm based on existing wholesale price
      setShowWholesaleForm(!!(product.wholesalePrice && product.wholesalePrice !== product.sellingPrice));
    } else {
      setEditingProduct(null);
      // Auto-generate values for new product
      
      // Default to auto-generate barcode for new products
      setAutoGenerateBarcode(true);
      
      // Default to hide wholesale form for new products
      setShowWholesaleForm(false);
      
      setFormData({
        sku: generateSKU(), // Auto-generate SKU
        barcode: "", // Will be generated based on mode
        name: "",
        description: "",
        categoryId: "",
        brandId: "", // User must select brand manually
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
    // Reset barcode mode to auto-generate
    setAutoGenerateBarcode(true);
    // Reset stock data
    setStockData({
      action: 'insert',
      quantity: '',
      notes: '',
      reason: ''
    });
    // Reset compression loading
    setCompressingImages(false);
  };

  const calculateMargin = (purchase, selling) => {
    if (!purchase || !selling) return 0;
    const margin = ((selling - purchase) / selling) * 100;
    return margin.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi barcode berdasarkan mode
    if (!autoGenerateBarcode && (!formData.barcode || formData.barcode.trim() === "")) {
      toast.error("Barcode harus diisi jika mode manual dipilih!");
      return;
    }
    
    setSaving(true);

    try {
      // Generate barcode if auto mode is selected
      let finalBarcode = formData.barcode;
      if (autoGenerateBarcode) {
        finalBarcode = generateBarcode();
      }
      
      // Handle harga grosir logic berdasarkan radio button
      let finalWholesalePrice;
      let finalMinOrderWholesale;
      
      if (showWholesaleForm) {
        // Jika form grosir diaktifkan, gunakan nilai dari form
        finalWholesalePrice = parseFloat(formData.wholesalePrice) || 0;
        finalMinOrderWholesale = parseInt(formData.minOrderWholesale) || 100;
        
        // Jika harga grosir tidak diisi padahal form diaktifkan, samakan dengan harga jual
        if (!formData.wholesalePrice || parseFloat(formData.wholesalePrice) === 0) {
          finalWholesalePrice = parseFloat(formData.sellingPrice) || 0;
          finalMinOrderWholesale = 100;
        }
      } else {
        // Jika form grosir tidak diaktifkan, samakan dengan harga jual dan set min order ke 100
        finalWholesalePrice = parseFloat(formData.sellingPrice) || 0;
        finalMinOrderWholesale = 100;
      }
      
      // Struktur data sesuai API3_productcustomer.md
      const dataToSend = {
        sku: formData.sku,
        barcode: finalBarcode,
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        brandId: formData.brandId,
        unit: formData.unit,
        compatibleModels: formData.compatibleModels,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        wholesalePrice: finalWholesalePrice,
        minStock: parseInt(formData.minStock) || 0,
        minOrderWholesale: finalMinOrderWholesale,
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
        if (autoGenerateBarcode) {
          toast.success(`Produk berhasil dibuat! Barcode: ${finalBarcode}`);
        } else {
          toast.success("Produk berhasil dibuat!");
        }
        
        // Handle stock adjustment for new product
        if (stockData.quantity && parseInt(stockData.quantity) > 0) {
          const newProductId = apiResponse.data?.id || apiResponse.id;
          if (newProductId) {
            await handleStockAdjustment(newProductId);
          }
        }
      }

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
      
      const actionText = stockData.action === 'insert' ? 'ditambahkan' : 'dikurangi';
      toast.success(`Stock berhasil ${actionText}: ${stockData.quantity} unit`);
      
    } catch (error) {
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

  // Fungsi untuk kompresi gambar
  const compressImage = (file, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Hitung ukuran baru untuk menjaga aspect ratio
        const maxWidth = 1024; // maksimum width
        const maxHeight = 1024; // maksimum height
        
        let { width, height } = img;
        
        // Resize jika lebih besar dari maksimum
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Gambar dengan kompresi
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert ke blob dengan kualitas yang ditentukan
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Convert blob ke base64
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Gagal mengkompresi gambar'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      
      // Load image dari file
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error("Maksimal 3 gambar");
      return;
    }

    if (files.length === 0) return;

    try {
      setCompressingImages(true);
      toast.info("🗜️ Mengkompresi gambar...");
      
      // Kompresi setiap file dengan kualitas 80%
      const compressedImages = await Promise.all(
        files.map(async (file, index) => {
          try {
            const originalSize = (file.size / 1024 / 1024).toFixed(2); // MB
            
            // Update progress toast
            toast.info(`📸 Memproses gambar ${index + 1}/${files.length}...`);
            
            const compressedBase64 = await compressImage(file, 0.8);
            
            // Hitung ukuran setelah kompresi (perkiraan)
            const base64Length = compressedBase64.length;
            const compressedSize = ((base64Length * 3) / 4 / 1024 / 1024).toFixed(2); // MB
            const compressionRatio = ((1 - (compressedSize / originalSize)) * 100).toFixed(0);
            
            return compressedBase64;
          } catch (error) {
            toast.warning(`Kompresi gagal untuk ${file.name}, menggunakan ukuran original`);
            
            // Fallback ke base64 tanpa kompresi jika gagal
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }
        })
      );

      // Hitung total ukuran
      const totalOriginalSize = files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;
      const totalCompressedSize = compressedImages.reduce((sum, img) => sum + ((img.length * 3) / 4 / 1024 / 1024), 0);
      const totalSaved = ((1 - (totalCompressedSize / totalOriginalSize)) * 100).toFixed(0);

      setFormData({ ...formData, images: compressedImages, imageFiles: files });
      toast.success(`✅ ${files.length} gambar berhasil dikompresi! Hemat ${totalSaved}% storage`);
      
    } catch (error) {
      toast.error("❌ Gagal memproses gambar: " + error.message);
    } finally {
      setCompressingImages(false);
    }
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

  // Function to check if product has low stock based on minStock
  const isLowStock = (product) => {
    const currentStock = parseInt(product.stock) || 0;
    const minStockThreshold = parseInt(product.minStock) || 10; // Default 10 if no minStock set
    return currentStock <= minStockThreshold;
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const matchSearch =
          searchQuery === "" ||
          (product.name &&
            product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.sku &&
            product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.barcode &&
            product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchCategory =
          filterCategory === "all" ||
          product.categoryId === filterCategory ||
          product.category?.id === filterCategory;
        const matchBrand =
          filterBrand === "all" ||
          product.brandId === filterBrand ||
          product.brand?.id === filterBrand;

        const matchStock =
          filterStock === "all" ||
          (filterStock === "normal" && !isLowStock(product));

        return matchSearch && matchCategory && matchBrand && matchStock;
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
        <div className="text-left sm:text-left">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3.5" />
              <Input
                placeholder="Cari produk atau barcode..."
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
                    .sort((a, b) => a.name?.localeCompare(b.name) || 0)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="py-3 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Merek Barang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Merek Barang</SelectItem>
                {Array.isArray(brands) &&
                  brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger className="py-3 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Status Stok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Stok</SelectItem>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-500" />
                    Stok Normal
                  </div>
                </SelectItem>
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
                        {product.barcode || product.sku}
                      </Badge>
                      <h3 className="mb-1 text-sm font-bold leading-tight text-gray-900 sm:text-base line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2 text-xs sm:gap-2 text-muted-foreground">
                        <span className="truncate">{product.category?.name || "No Category"}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden truncate sm:inline">{product.brand?.name || "No Brand"}</span>
                      </div>
                      {product.storageLocation && (
                        <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
                          <MapPin className="flex-shrink-0 w-3 h-3" />
                          <span className="truncate">{product.storageLocation}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                        className={`text-xs rounded-full ${product.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"}`}
                      >
                        {product.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-3 mb-3 space-y-2 border-t border-gray-100">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-medium text-muted-foreground">Harga Jual:</span>
                      <span className="font-bold text-right text-blue-600">
                        Rp {product.sellingPrice?.toLocaleString("id-ID") || "0"}
                      </span>
                    </div>
                    {/* Tampilkan harga grosir hanya jika berbeda dengan harga jual */}
                    {product.wholesalePrice && 
                     product.sellingPrice && 
                     product.wholesalePrice !== product.sellingPrice && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">
                          Harga grosir Rp {product.wholesalePrice?.toLocaleString("id-ID")} minimal pembelian {product.minOrderWholesale || 100}
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
        <DialogContent className="w-[96vw] max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 md:p-8">
          <DialogHeader className="space-y-3 sm:space-y-4">
            <DialogTitle className="text-xl font-bold sm:text-2xl md:text-3xl">
              {editingProduct ? "Ubah Produk" : "Tambah Produk Baru"}
            </DialogTitle>
            <DialogDescription className="text-base sm:text-lg text-muted-foreground">
              {editingProduct
                ? "Perbarui informasi produk"
                : "Buat produk baru dengan detail lengkap"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6 sm:space-y-8">
            {/* Hidden SKU - Auto Generated */}
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
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Nama Produk <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="contoh: Ban Motor Tubeless 120/70-17"
                required
                className="h-10 text-sm"
              />
            </div>

            {/* Barcode Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="w-4 h-4" />
                Barcode {!autoGenerateBarcode && <span className="text-red-500">*</span>}
              </Label>
              
              <div className="space-y-3">
                {/* Toggle untuk mode barcode */}
                <div className="flex flex-col p-3 space-y-3 rounded-lg bg-gray-50 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="autoBarcode"
                      name="barcodeMode"
                      checked={autoGenerateBarcode}
                      onChange={(e) => {
                        setAutoGenerateBarcode(true);
                        handleChange("barcode", ""); // Clear manual barcode
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="autoBarcode" className="text-sm font-medium cursor-pointer">
                      Generate Otomatis
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="manualBarcode"
                      name="barcodeMode"
                      checked={!autoGenerateBarcode}
                      onChange={(e) => {
                        setAutoGenerateBarcode(false);
                        handleChange("barcode", ""); // Clear auto barcode
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="manualBarcode" className="text-sm font-medium cursor-pointer">
                      ✏️ Input Manual
                    </Label>
                  </div>
                </div>

                {/* Input barcode */}
                <Input
                  value={formData.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  placeholder={
                    autoGenerateBarcode 
                      ? "Akan otomatis di-generate saat menyimpan" 
                      : "Masukkan barcode produk"
                  }
                  disabled={autoGenerateBarcode}
                  required={!autoGenerateBarcode}
                  className={`h-10 text-sm ${autoGenerateBarcode ? "bg-gray-100 text-gray-500" : ""}`}
                />

                <p className="text-xs text-muted-foreground">
                  {autoGenerateBarcode 
                    ? "📊 Barcode akan otomatis dibuat berdasarkan data produk" 
                    : "📝 Masukkan barcode yang sudah ada atau sesuai sistem Anda"
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleChange("categoryId", value)}
                required
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder={loading ? "Memuat kategori..." : "Pilih kategori"} />
                </SelectTrigger>
                <SelectContent className="text-sm">
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories
                      .filter((cat) => cat && (cat.isActive === true || cat.isActive === undefined))
                      .sort((a, b) => a.name?.localeCompare(b.name) || 0)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="py-2 text-sm">
                          {cat.name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="" disabled className="py-2 text-sm">
                      {loading ? "Memuat kategori..." : "Tidak ada kategori tersedia"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Brand <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) => handleChange("brandId", value)}
                required
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder={loading ? "Memuat brand..." : "Pilih brand"} />
                </SelectTrigger>
                <SelectContent className="text-sm">
                  {Array.isArray(brands) && brands.length > 0 ? (
                    brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id} className="py-2 text-sm">
                        {brand.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled className="py-2 text-sm">
                      {loading ? "Memuat brand..." : "Tidak ada brand tersedia"}
                    </SelectItem>
                  )}
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

            <div className="grid grid-cols-1 gap-4 p-4 rounded-lg bg-gray-50 sm:grid-cols-2">
              <div className="mb-2 col-span-full">
                <div className="p-3 border border-blue-200 rounded bg-blue-50">
                  <p className="mb-1 text-sm font-medium text-blue-800">💰 Pengaturan Harga</p>
                  <p className="text-xs text-blue-600">
                    Gunakan radio button untuk mengatur apakah produk ini memiliki harga grosir khusus atau tidak. Jika tidak ada harga grosir, sistem akan menggunakan harga jual dengan minimum pembelian 100 unit.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
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
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Harga Jual <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => handleChange("sellingPrice", e.target.value)}
                  placeholder="0"
                  required
                  className="h-10 text-sm"
                />
                {formData.purchasePrice && formData.sellingPrice && (
                  <p className="text-xs font-medium text-green-600">
                    Margin:{" "}
                    {calculateMargin(
                      formData.purchasePrice,
                      formData.sellingPrice
                    )}
                    %
                  </p>
                )}
              </div>
              {/* Radio Button untuk Harga Grosir */}
              <div className="col-span-full">
                <Label className="block mb-3 text-sm font-medium">
                  Pengaturan Harga Grosir
                </Label>
                <RadioGroup
                  value={showWholesaleForm ? "yes" : "no"}
                  onValueChange={(value) => {
                    const showForm = value === "yes";
                    setShowWholesaleForm(showForm);
                    
                    // Reset wholesale fields when hiding form
                    if (!showForm) {
                      handleChange("wholesalePrice", "");
                      handleChange("minOrderWholesale", "");
                    }
                  }}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no-wholesale" />
                    <Label htmlFor="no-wholesale" className="text-sm">
                      Tidak ada harga grosir
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes-wholesale" />
                    <Label htmlFor="yes-wholesale" className="text-sm">
                      Ada harga grosir
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Form Harga Grosir - hanya muncul jika radio button "Ada harga grosir" dipilih */}
              {showWholesaleForm && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Harga Grosir <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.wholesalePrice}
                      onChange={(e) => {
                        handleChange("wholesalePrice", e.target.value);
                        // Auto-set minimum 100 untuk minOrderWholesale jika harga grosir diisi
                        if (e.target.value && !formData.minOrderWholesale) {
                          handleChange("minOrderWholesale", "100");
                        }
                      }}
                      placeholder="0"
                      required
                      className="h-10 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Harga khusus untuk pembelian grosir
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Min Transaksi Grosir <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.minOrderWholesale}
                      onChange={(e) => {
                        handleChange("minOrderWholesale", e.target.value);
                      }}
                      placeholder="100"
                      min="1"
                      step="1"
                      required
                      className="h-10 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Jumlah minimum untuk mendapat harga grosir
                    </p>
                    {formData.wholesalePrice && (
                      <div className="p-2 mt-2 border border-green-200 rounded bg-green-50">
                        <p className="text-xs font-medium text-green-700">
                          ✅ Pembelian {formData.minOrderWholesale || "100"}+ unit = Rp {parseInt(formData.wholesalePrice).toLocaleString('id-ID')}/unit
                        </p>
                        <p className="text-xs text-green-600">
                          Hemat Rp {(parseInt(formData.sellingPrice || 0) - parseInt(formData.wholesalePrice || 0)).toLocaleString('id-ID')}/unit
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Minimal Stock Section */}
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Minimal Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                  placeholder="0"
                  required
                  min="0"
                  step="1"
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  📊 Batas minimum stok sebelum sistem menandai sebagai "Stok Menipis"
                </p>
                {formData.minStock && parseInt(formData.minStock) > 0 && (
                  <div className="p-2 mt-2 bg-orange-100 border border-orange-300 rounded">
                    <p className="text-xs font-medium text-orange-700">
                      ⚠️ Akan ditandai "Stok Menipis" jika stok ≤ {formData.minStock} unit
                    </p>
                  </div>
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
                        <Label className="text-sm font-medium">Aksi Stok</Label>
                        <Select
                          value={stockData.action}
                          onValueChange={(value) => handleStockChange("action", value)}
                          disabled={!userHasBranch}
                        >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-sm">
                      <SelectItem value="insert" className="py-2 text-sm">➕ Tambah Stok</SelectItem>
                      <SelectItem value="remove" className="py-2 text-sm">➖ Kurangi Stok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Jumlah</Label>
                          <Input
                            type="number"
                            min="0"
                            value={stockData.quantity}
                            onChange={(e) => handleStockChange("quantity", e.target.value)}
                            placeholder="0"
                            disabled={!userHasBranch}
                            className="h-10 text-sm"
                          />
                          <p className="text-xs font-medium text-blue-600">
                            Unit yang akan {stockData.action === 'insert' ? 'ditambahkan ke' : 'dikurangi dari'} stok
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Alasan</Label>
                          <Input
                            value={stockData.reason}
                            onChange={(e) => handleStockChange("reason", e.target.value)}
                            placeholder={stockData.action === 'insert' ? 'Pembelian, produksi, dll' : 'Rusak, kehilangan, dll'}
                            disabled={!userHasBranch}
                            className="h-10 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Catatan</Label>
                          <Input
                            value={stockData.notes}
                            onChange={(e) => handleStockChange("notes", e.target.value)}
                            placeholder="Catatan tambahan (opsional)"
                            disabled={!userHasBranch}
                            className="h-10 text-sm"
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

            {/* Image Upload with Camera */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="w-4 h-4" />
                Foto Produk (Maksimal 3)
              </Label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleImageFileChange}
                  disabled={compressingImages}
                  className={`h-10 text-sm cursor-pointer ${compressingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {compressingImages && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white rounded bg-opacity-90">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengkompresi...
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                <p className="mb-1 text-xs font-medium text-blue-800">
                  📷 Kamera akan terbuka langsung untuk foto produk
                </p>
                <p className="text-xs text-blue-600">
                  🗜️ <strong>Auto Kompresi:</strong> Gambar akan otomatis dikompresi 80% untuk menghemat storage dan mempercepat upload
                </p>
                <p className="text-xs text-blue-600">
                  📏 <strong>Auto Resize:</strong> Gambar besar akan diperkecil ke 1024x1024px max
                </p>
                <p className="text-xs text-blue-600">
                  📁 <strong>Format:</strong> JPG, PNG (maksimal 3 gambar)
                </p>
              </div>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Preview Gambar ({formData.images.length}/3)</span>
                    <span className="font-medium text-green-600">✅ Dikompresi 80%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                    {formData.images.map((img, index) => {
                      // Perkiraan ukuran file setelah kompresi
                      const estimatedSize = ((img.length * 3) / 4 / 1024 / 1024).toFixed(1);
                      
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="object-cover w-full h-20 border rounded sm:h-24"
                          />
                          <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-xs text-white bg-black bg-opacity-70 rounded-b">
                            <div className="text-center">
                              <span className="font-medium">{estimatedSize}MB</span>
                              <span className="ml-1 text-green-300">📦</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute flex items-center justify-center w-5 h-5 text-sm text-white transition-opacity bg-red-500 rounded-full opacity-0 sm:w-6 sm:h-6 top-1 right-1 group-hover:opacity-100 sm:text-base hover:bg-red-600"
                            title="Hapus gambar"
                          >
                            x
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>

            {/* Storage Location & Tags */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Lokasi Penyimpanan
                </Label>
                <Input
                  value={formData.storageLocation}
                  onChange={(e) =>
                    handleChange("storageLocation", e.target.value)
                  }
                  placeholder="contoh: Rak A-3, Gudang Utama"
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  📍 Lokasi fisik barang di gudang/toko (opsional)
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <Tag className="inline w-4 h-4 mr-2" />
                  Tags
                </Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="contoh: Motor, Sparepart, Populer"
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  🏷️ Tag untuk kategori atau pencarian (pisahkan dengan koma)
                </p>
              </div>
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
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Produk Aktif</Label>
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



            <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={saving}
                className="w-full h-10 text-sm font-medium sm:w-auto"
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="w-full h-10 text-sm font-medium sm:w-auto">
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
