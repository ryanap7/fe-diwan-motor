'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, Download, TrendingUp, TrendingDown, DollarSign, 
  Package, Calendar, BarChart3, PieChart, Filter, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const ReportingAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [error, setError] = useState(null);
  
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    branch_id: '',
    category_id: ''
  });

  // Report data states
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState({
    summary: { totalStockValue: 0, totalItems: 0, lowStockCount: 0, uniqueProducts: 0, deadStockCount: 0 },
    stockLevels: [],
    lowStock: [],
    lowStockProducts: [],
    categories: [],
    trend: 'stable'
  });
  const [financialReport, setFinancialReport] = useState(null);

  // API Test Function
  const testReportsAPI = async () => {
    console.log('🧪 Testing Reports API endpoints...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found');
      return;
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    };

    const endpoints = [
      'https://api.diwanmotor.com/api/transactions',
      'https://api.diwanmotor.com/api/products',
      'https://api.diwanmotor.com/api/branches',
      'https://api.diwanmotor.com/api/categories',
      'https://api.diwanmotor.com/api/reports/sales/summary',
      'https://api.diwanmotor.com/api/reports/sales/top-products',
      'https://api.diwanmotor.com/api/reports/inventory/summary'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Testing: ${endpoint}`);
        const response = await fetch(endpoint, { headers });
        const data = await response.json();
        
        console.log(`✅ ${endpoint}:`, {
          status: response.status,
          success: data.success,
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
          sample: data.data
        });
      } catch (error) {
        console.error(`❌ ${endpoint}:`, error.message);
      }
    }
  };

  useEffect(() => {
    // Make API test function globally available
    window.testReportsAPI = testReportsAPI;
    
    fetchInitialData();
    
    // Cleanup
    return () => {
      delete window.testReportsAPI;
    };
  }, []);

  useEffect(() => {
    console.log('🔄 UseEffect triggered:', {
      transactionsCount: transactions.length,
      productsCount: products.length,
      inventoryCount: inventory.length,
      loading
    });
    
    // Generate reports if we have transactions data (products are optional for basic report)
    if (transactions.length > 0 && !loading) {
      console.log('✅ Generating reports with available data');
      generateReports().catch(error => {
        console.error('Error generating reports:', error);
        setError('Failed to generate reports: ' + error.message);
      });
    } else if (transactions.length === 0 && !loading) {
      // Set empty reports when no transaction data is available
      console.log('📝 Setting empty reports due to no transaction data');
      setSalesReport(null);
      setInventoryReport(null);
      setFinancialReport(null);
    }
  }, [transactions, products, inventory, filters, loading]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      };

      const [transactionsRes, productsRes, inventoryRes, branchesRes, categoriesRes] = await Promise.all([
        axios.get('https://api.diwanmotor.com/api/transactions?limit=1000', { headers }),
        axios.get('https://api.diwanmotor.com/api/products?limit=1000', { headers }),
        axios.get('https://api.diwanmotor.com/api/reports/inventory/summary', { headers }),
        axios.get('https://api.diwanmotor.com/api/branches?limit=1000', { headers }),
        axios.get('https://api.diwanmotor.com/api/categories?limit=1000', { headers })
      ]);

      // Set data with proper fallbacks - trying multiple possible response structures
      console.log('🔄 Processing API responses...');
      
      // Handle Transactions - check multiple possible structures
      let transactionsData = [];
      if (transactionsRes.data?.success && transactionsRes.data.data) {
        if (Array.isArray(transactionsRes.data.data.transactions)) {
          transactionsData = transactionsRes.data.data.transactions;
        } else if (Array.isArray(transactionsRes.data.data)) {
          transactionsData = transactionsRes.data.data;
        }
      } else if (Array.isArray(transactionsRes.data?.data)) {
        transactionsData = transactionsRes.data.data;
      } else if (Array.isArray(transactionsRes.data)) {
        transactionsData = transactionsRes.data;
      }
      setTransactions(transactionsData);
      console.log('📝 Transactions set:', transactionsData.length);

      // Handle Products - check multiple possible structures
      let productsData = [];
      if (productsRes.data?.success && Array.isArray(productsRes.data.data)) {
        productsData = productsRes.data.data;
      } else if (Array.isArray(productsRes.data?.data)) {
        productsData = productsRes.data.data;
      } else if (Array.isArray(productsRes.data)) {
        productsData = productsRes.data;
      }
      setProducts(productsData);
      console.log('📝 Products set:', productsData.length);

      // Handle Inventory - summary object
      let inventoryData = [];
      if (inventoryRes.data?.success && inventoryRes.data.data) {
        inventoryData = [inventoryRes.data.data]; // Wrap object in array
      } else if (inventoryRes.data?.data) {
        inventoryData = Array.isArray(inventoryRes.data.data) ? inventoryRes.data.data : [inventoryRes.data.data];
      }
      setInventory(inventoryData);
      console.log('📝 Inventory set:', inventoryData.length);

      // Handle Branches - check multiple possible structures
      let branchesData = [];
      if (branchesRes.data?.success && Array.isArray(branchesRes.data.data)) {
        branchesData = branchesRes.data.data;
      } else if (Array.isArray(branchesRes.data?.data)) {
        branchesData = branchesRes.data.data;
      } else if (Array.isArray(branchesRes.data)) {
        branchesData = branchesRes.data;
      }
      setBranches(branchesData);
      console.log('📝 Branches set:', branchesData.length);

      // Handle Categories - check multiple possible structures
      let categoriesData = [];
      if (categoriesRes.data?.success && Array.isArray(categoriesRes.data.data)) {
        categoriesData = categoriesRes.data.data;
      } else if (Array.isArray(categoriesRes.data?.data)) {
        categoriesData = categoriesRes.data.data;
      } else if (Array.isArray(categoriesRes.data)) {
        categoriesData = categoriesRes.data;
      }
      setCategories(categoriesData);
      console.log('📝 Categories set:', categoriesData.length);
      
      console.log('📥 API Responses:', {
        transactionsRes: transactionsRes.data,
        productsRes: productsRes.data,
        inventoryRes: inventoryRes.data,
        branchesRes: branchesRes.data,
        categoriesRes: categoriesRes.data
      });

      console.log('🔍 Detailed Response Analysis:', {
        transactions: {
          success: transactionsRes.data?.success,
          dataType: typeof transactionsRes.data?.data,
          isArray: Array.isArray(transactionsRes.data?.data),
          length: Array.isArray(transactionsRes.data?.data) ? transactionsRes.data.data.length : 'N/A',
          hasTransactions: transactionsRes.data?.data?.transactions ? 'Yes' : 'No'
        },
        products: {
          success: productsRes.data?.success,
          dataType: typeof productsRes.data?.data,
          isArray: Array.isArray(productsRes.data?.data),
          length: Array.isArray(productsRes.data?.data) ? productsRes.data.data.length : 'N/A'
        },
        inventory: {
          success: inventoryRes.data?.success,
          dataType: typeof inventoryRes.data?.data,
          hasStockValue: inventoryRes.data?.data?.totalStockValue ? 'Yes' : 'No'
        }
      });
      
      console.log('✅ Loaded data counts:', {
        transactions: transactionsRes.data?.data?.transactions?.length || 0,
        products: productsRes.data?.data?.length || 0,
        inventory: inventoryRes.data?.data?.length || 0,
        branches: branchesRes.data?.data?.length || 0,
        categories: categoriesRes.data?.data?.length || 0
      });
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      
      // Set error state for display
      setError(error.response?.data?.message || error.message || 'Failed to fetch data');
      
      // Set empty arrays as fallback
      setTransactions([]);
      setProducts([]);
      setInventory([]);
      setBranches([]);
      setCategories([]);
      
      toast.error('Gagal memuat data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateReports = async () => {
    console.log('🔄 Generating reports with data:', {
      transactions: transactions.length,
      products: products.length,
      inventory: inventory.length,
      filters: filters
    });

    // Filter transactions based on date range and branch
    const filteredTransactions = transactions.filter(t => {
      try {
        const tDate = new Date(t.transactionDate || t.transaction_date || t.createdAt || t.created_at);
        const fromDate = new Date(filters.date_from);
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999);

        // Check if date is valid
        if (isNaN(tDate.getTime())) {
          console.warn('Invalid transaction date:', t);
          return false;
        }

        const dateMatch = tDate >= fromDate && tDate <= toDate;
        const branchMatch = !filters.branch_id || 
                          t.branchId === filters.branch_id || 
                          t.branch_id === filters.branch_id ||
                          filters.branch_id === 'all';
        
        return dateMatch && branchMatch;
      } catch (error) {
        console.warn('Error filtering transaction:', t, error);
        return false;
      }
    });

    console.log('� Filtered transactions:', {
      total: transactions.length,
      filtered: filteredTransactions.length,
      sampleTransaction: filteredTransactions[0]
    });

    // Generate Reports (now with API integration)
    await generateSalesReport(filteredTransactions);
    await generateInventoryReport();
    generateFinancialReport(filteredTransactions);
  };

  const generateSalesReport = async (filteredTransactions) => {
    console.log('📈 Generating sales report for', filteredTransactions.length, 'transactions');
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      };

      // Build query params based on filters
      const params = {};
      if (filters.branch_id && filters.branch_id !== 'all') {
        params.branchId = filters.branch_id;
      }
      if (filters.date_from && filters.date_to) {
        params.startDate = filters.date_from;
        params.endDate = filters.date_to;
      }

      console.log('📊 Fetching sales report with params:', params);

      // Fetch sales data using Postman collection endpoints
      const [salesSummaryRes, topProductsRes, categoryRes] = await Promise.all([
        axios.get('https://api.diwanmotor.com/api/reports/sales/summary', { headers, params }).catch(e => {
          console.warn('Sales summary API failed:', e.message);
          return { data: null };
        }),
        axios.get('https://api.diwanmotor.com/api/reports/sales/top-products', { headers, params }).catch(e => {
          console.warn('Top products API failed:', e.message);
          return { data: null };
        }),
        axios.get('https://api.diwanmotor.com/api/reports/sales/by-category', { headers, params }).catch(e => {
          console.warn('Sales by category API failed:', e.message);
          return { data: null };
        })
      ]);

      console.log('📈 Sales API responses:', {
        summary: salesSummaryRes.data,
        topProducts: topProductsRes.data,
        category: categoryRes.data
      });

      // Use API data if available, otherwise fallback to local calculation
      if (salesSummaryRes.data?.success) {
        // Process API data
        const apiSalesData = salesSummaryRes.data.data;
        const topProducts = topProductsRes.data?.success ? topProductsRes.data.data.products || [] : [];
        const categoryData = categoryRes.data?.success ? categoryRes.data.data || [] : [];

        setSalesReport({
          summary: {
            totalRevenue: apiSalesData.totalRevenue || 0,
            totalTransactions: apiSalesData.totalTransactions || 0,
            totalItemsSold: apiSalesData.totalItemsSold || 0,
            averageTransactionValue: apiSalesData.averageTransactionValue || 0
          },
          topProducts: topProducts.map(p => ({
            product_id: p.productId,
            product_name: p.productName,
            sku: p.productSku,
            quantity: p.totalQuantity,
            revenue: p.totalRevenue
          })),
          categoryBreakdown: Array.isArray(categoryData) ? categoryData : [],
          dailySales: [], // This would need a separate API endpoint
          trend: 'stable' // Calculate based on comparison
        });

        console.log('✅ Sales report generated from API data');
        return;
      }
    } catch (error) {
      console.error('❌ Error fetching sales report from API:', error);
    }

    // Fallback: Generate from local transaction data
    console.log('📊 Falling back to local sales report generation with', filteredTransactions.length, 'transactions');
    
    // Basic validation
    if (!Array.isArray(filteredTransactions) || filteredTransactions.length === 0) {
      console.log('⚠️ No transactions to process');
      setSalesReport({
        summary: { totalRevenue: 0, totalTransactions: 0, totalItems: 0, averageTransaction: 0 },
        dailySales: [],
        productSales: [],
        categorySales: [],
        cashierSales: [],
        bestSelling: [],
        slowMoving: []
      });
      return;
    }
    
    // Daily sales summary
    const dailySales = {};
    filteredTransactions.forEach(t => {
      try {
        const date = new Date(t.transactionDate || t.transaction_date || t.createdAt || t.created_at).toISOString().split('T')[0];
        if (!dailySales[date]) {
          dailySales[date] = { date, revenue: 0, transactions: 0, items: 0 };
        }
        const total = parseFloat(t.totalAmount || t.total || t.grandTotal || 0);
        dailySales[date].revenue += total;
        dailySales[date].transactions += 1;
        // Handle different item structures
        if (t.items && Array.isArray(t.items)) {
          dailySales[date].items += t.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        } else if (t.transactionItems && Array.isArray(t.transactionItems)) {
          dailySales[date].items += t.transactionItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }
      } catch (error) {
        console.warn('Error processing transaction for daily sales:', t, error);
      }
    });

    // Sales by product - handle multiple item structures
    const productSales = {};
    filteredTransactions.forEach(t => {
      const items = t.items || t.transactionItems || t.details || [];
      if (Array.isArray(items)) {
        items.forEach(item => {
          try {
            const productId = item.productId || item.product_id || item.id || 'unknown';
            if (!productSales[productId]) {
              productSales[productId] = {
                product_id: productId,
                product_name: item.productName || item.product_name || item.name || item.product?.name || 'Unknown Product',
                sku: item.productSku || item.sku || item.product?.sku || '-',
                quantity: 0,
                revenue: 0,
                transactions: 0
              };
            }
            productSales[productId].quantity += parseInt(item.quantity || 0);
            const subtotal = parseFloat(item.subtotal || item.subTotal || item.total || item.price * (item.quantity || 0) || 0);
            productSales[productId].revenue += subtotal;
            productSales[productId].transactions += 1;
          } catch (error) {
            console.warn('Error processing item for product sales:', item, error);
          }
        });
      }
    });

    // Sales by category
    const categorySales = {};
    filteredTransactions.forEach(t => {
      t.items?.forEach(item => {
        const productId = item.productId || item.product_id;
        const product = products.find(p => p.id === productId);
        const categoryId = product?.categoryId || product?.category_id || 'uncategorized';
        const category = categories.find(c => c.id === categoryId);
        const categoryName = category?.name || 'Uncategorized';

        if (!categorySales[categoryId]) {
          categorySales[categoryId] = {
            category_id: categoryId,
            category_name: categoryName,
            quantity: 0,
            revenue: 0
          };
        }
        categorySales[categoryId].quantity += item.quantity;
        const subtotal = parseFloat(item.subtotal || item.subTotal || 0);
        categorySales[categoryId].revenue += subtotal;
      });
    });

    // Sales by cashier
    const cashierSales = {};
    filteredTransactions.forEach(t => {
      const cashierId = t.cashierId || t.cashier_id;
      const cashierName = t.cashier?.fullName || t.cashier?.username || t.cashierName || t.cashier_name || 'Unknown';
      
      if (!cashierSales[cashierId]) {
        cashierSales[cashierId] = {
          cashier_id: cashierId,
          cashier_name: cashierName,
          transactions: 0,
          revenue: 0
        };
      }
      cashierSales[cashierId].transactions += 1;
      const total = parseFloat(t.totalAmount || t.total || 0);
      cashierSales[cashierId].revenue += total;
    });

    // Best selling products (top 10)
    const bestSelling = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Slow moving products (bottom 10)
    const slowMoving = Object.values(productSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    // Total summary
    const totalRevenue = filteredTransactions.reduce((sum, t) => {
      try {
        const amount = parseFloat(t.totalAmount || t.total || t.grandTotal || 0);
        return sum + amount;
      } catch {
        return sum;
      }
    }, 0);
    
    const totalTransactions = filteredTransactions.length;
    
    const totalItems = filteredTransactions.reduce((sum, t) => {
      try {
        const items = t.items || t.transactionItems || t.details || [];
        if (Array.isArray(items)) {
          return sum + items.reduce((s, item) => s + parseInt(item.quantity || 0), 0);
        }
        return sum;
      } catch {
        return sum;
      }
    }, 0);
    
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const salesReportData = {
      summary: {
        totalRevenue,
        totalTransactions,
        totalItems: totalItems,
        averageTransaction
      },
      dailySales: Object.values(dailySales).sort((a, b) => new Date(b.date) - new Date(a.date)),
      productSales: Object.values(productSales).sort((a, b) => b.revenue - a.revenue),
      categorySales: Object.values(categorySales).sort((a, b) => b.revenue - a.revenue),
      cashierSales: Object.values(cashierSales).sort((a, b) => b.revenue - a.revenue),
      bestSelling,
      slowMoving
    };
    
    console.log('✅ Sales report generated (LOCAL):', {
      summary: salesReportData.summary,
      dailySalesCount: salesReportData.dailySales.length,
      productSalesCount: salesReportData.productSales.length,
      totalRevenue,
      totalTransactions,
      totalItems
    });
    
    setSalesReport(salesReportData);
    console.log('✅ Sales report SET to state');
  };

  const generateInventoryReport = async () => {
    console.log('📦 Generating inventory report');
    
    // Initialize with safe defaults first
    const defaultInventoryReport = {
      summary: { totalStockValue: 0, totalItems: 0, lowStockCount: 0, uniqueProducts: 0, deadStockCount: 0 },
      stockLevels: [],
      lowStock: [],
      lowStockProducts: [],
      categories: [],
      trend: 'stable'
    };
    
    // Set default first to prevent undefined errors
    setInventoryReport(defaultInventoryReport);
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      };

      // Build query params based on filters
      const params = {};
      if (filters.branch_id && filters.branch_id !== 'all') {
        params.branchId = filters.branch_id;
      }

      console.log('📊 Fetching inventory reports with params:', params);

      // Fetch inventory data using Postman collection endpoints
      const [inventorySummaryRes, lowStockRes, stockValuationRes] = await Promise.all([
        axios.get('https://api.diwanmotor.com/api/reports/inventory/summary', { headers, params }).catch(e => {
          console.warn('Inventory summary API failed:', e.message);
          return { data: null };
        }),
        axios.get('https://api.diwanmotor.com/api/reports/inventory/low-stock', { headers, params }).catch(e => {
          console.warn('Low stock API failed:', e.message);
          return { data: null };
        }),
        axios.get('https://api.diwanmotor.com/api/reports/inventory/stock-valuation', { headers, params }).catch(e => {
          console.warn('Stock valuation API failed:', e.message);
          return { data: null };
        })
      ]);

      console.log('📦 Inventory API responses:', {
        summary: inventorySummaryRes.data,
        lowStock: lowStockRes.data,
        valuation: stockValuationRes.data
      });

      // Use API data if available
      if (inventorySummaryRes.data?.success) {
        const summaryData = inventorySummaryRes.data.data;
        const lowStockData = lowStockRes.data?.success ? lowStockRes.data.data : [];
        const valuationData = stockValuationRes.data?.success ? stockValuationRes.data.data : { stocks: [], totalValue: 0 };

        setInventoryReport({
          summary: {
            totalStockValue: summaryData.totalStockValue || 0,
            totalItems: summaryData.totalItems || 0,
            lowStockCount: summaryData.lowStockCount || 0,
            uniqueProducts: summaryData.uniqueProducts || 0
          },
          stockLevels: Array.isArray(valuationData.stocks) ? valuationData.stocks.map(stock => ({
            product_name: stock.product?.name || 'Unknown',
            sku: stock.product?.sku || '-',
            branch_name: stock.branch?.name || 'Unknown',
            quantity: stock.quantity || 0,
            stock_value: stock.totalValue || 0,
            purchase_price: stock.product?.price || 0
          })) : [],
          lowStockProducts: Array.isArray(lowStockData) ? lowStockData : [],
          categories: [], // Would need category breakdown endpoint
          trend: 'stable'
        });

        console.log('✅ Inventory report generated from API data');
        return;
      }
    } catch (error) {
      console.error('❌ Error fetching inventory report from API:', error);
    }

    // Fallback: Generate from local inventory data
    console.log('📦 Falling back to local inventory report generation');

    // Ensure arrays are valid before processing
    if (!Array.isArray(inventory)) {
      console.warn('Inventory data is not an array:', inventory);
      // Use the inventory summary data we fetched during initial load
      if (inventory && typeof inventory === 'object' && inventory.totalStockValue) {
        setInventoryReport({
          summary: {
            totalStockValue: inventory.totalStockValue,
            totalItems: inventory.totalItems,
            lowStockCount: inventory.lowStockCount,
            uniqueProducts: inventory.uniqueProducts
          },
          stockLevels: [],
          lowStockProducts: [],
          categories: [],
          trend: 'stable'
        });
        return;
      }
      
      setInventoryReport({
        summary: { totalStockValue: 0, totalItems: 0, lowStockCount: 0, uniqueProducts: 0, deadStockCount: 0 },
        stockLevels: [],
        lowStock: [], // Add missing property
        lowStockProducts: [],
        categories: [],
        trend: 'stable'
      });
      return;
    }

    // Current stock levels
    const stockLevels = inventory.map(inv => {
      const productId = inv.productId || inv.product_id;
      const branchId = inv.branchId || inv.branch_id;
      const product = Array.isArray(products) ? products.find(p => p.id === productId) : null;
      const branch = Array.isArray(branches) ? branches.find(b => b.id === branchId) : null;
      const purchasePrice = parseFloat(product?.purchasePrice || product?.purchase_price || 0);
      
      return {
        ...inv,
        product_name: product?.name || 'Unknown',
        sku: product?.sku || '-',
        branch_name: branch?.name || 'Unknown',
        purchase_price: purchasePrice,
        stock_value: purchasePrice * inv.quantity
      };
    });

    // Stock valuation
    const totalStockValue = stockLevels.reduce((sum, item) => sum + item.stock_value, 0);
    const totalItems = stockLevels.reduce((sum, item) => sum + item.quantity, 0);

    // Low stock items (< 10)
    const lowStock = stockLevels.filter(item => item.quantity < 10);

    // Dead stock (0 quantity or no sales in 90 days)
    const deadStock = stockLevels.filter(item => item.quantity === 0);

    // Stock by branch
    const stockByBranch = {};
    stockLevels.forEach(item => {
      const branchId = item.branchId || item.branch_id;
      if (!stockByBranch[branchId]) {
        stockByBranch[branchId] = {
          branch_id: branchId,
          branch_name: item.branch_name,
          total_items: 0,
          total_value: 0
        };
      }
      stockByBranch[branchId].total_items += item.quantity;
      stockByBranch[branchId].total_value += item.stock_value;
    });

    setInventoryReport({
      summary: {
        totalStockValue,
        totalItems,
        lowStockCount: lowStock.length,
        deadStockCount: deadStock.length
      },
      stockLevels: stockLevels.sort((a, b) => b.stock_value - a.stock_value),
      lowStock,
      deadStock,
      stockByBranch: Object.values(stockByBranch)
    });
  };

  const generateFinancialReport = (filteredTransactions) => {
    // Calculate revenue
    const totalRevenue = filteredTransactions.reduce((sum, t) => {
      const amount = parseFloat(t.totalAmount || t.total || 0);
      return sum + amount;
    }, 0);
    
    // Calculate COGS (Cost of Goods Sold)
    let totalCOGS = 0;
    filteredTransactions.forEach(t => {
      t.items?.forEach(item => {
        const productId = item.productId || item.product_id;
        const product = products.find(p => p.id === productId);
        const purchasePrice = parseFloat(product?.purchasePrice || product?.purchase_price || 0);
        totalCOGS += purchasePrice * item.quantity;
      });
    });

    // Gross profit
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Net profit (simplified - excluding operational expenses)
    const netProfit = grossProfit;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Cash flow (simplified)
    const cashInflow = totalRevenue;
    const cashOutflow = totalCOGS;
    const netCashFlow = cashInflow - cashOutflow;

    setFinancialReport({
      profitLoss: {
        revenue: totalRevenue,
        cogs: totalCOGS,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin
      },
      cashFlow: {
        inflow: cashInflow,
        outflow: cashOutflow,
        net: netCashFlow
      }
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = (reportType, format) => {
    toast.info(`Export ${reportType} ke ${format} akan segera hadir`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Memuat data laporan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Reporting & Analytics</h3>
          <p className="text-xs text-muted-foreground sm:text-sm">Laporan penjualan, inventory, dan keuangan</p>
        </div>
        <Button onClick={fetchInitialData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{loading ? 'Loading...' : 'Muat Ulang'}</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 sm:w-5 sm:h-5" />
            <CardTitle className="text-base sm:text-lg">Filter Laporan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm">Tanggal Dari</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tanggal Sampai</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Cabang</Label>
              <Select
                value={filters.branch_id || 'all'}
                onValueChange={(value) => handleFilterChange('branch_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Semua cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {Array.isArray(branches) && branches.length > 0 ? (
                    branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
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
              <Label className="text-sm">Kategori</Label>
              <Select
                value={filters.category_id || 'all'}
                onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      Tidak ada kategori tersedia
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Debug Panel */}
      <Card className="border-blue-200 bg-blue-50" style={{ display: 'none' }}>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-blue-800">🔧 System Status & Debug Info</h3>
          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
            {/* API Status */}
            <div className="space-y-2">
              <div className="font-medium text-blue-700">API Data Status:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Transactions:</span>
                  <span className={transactions.length > 0 ? 'text-green-600' : 'text-red-600'}>
                    {transactions.length > 0 ? `✅ ${transactions.length}` : '❌ 0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Products:</span>
                  <span className={products.length > 0 ? 'text-green-600' : 'text-red-600'}>
                    {products.length > 0 ? `✅ ${products.length}` : '❌ 0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Branches:</span>
                  <span className={branches.length > 0 ? 'text-green-600' : 'text-red-600'}>
                    {branches.length > 0 ? `✅ ${branches.length}` : '❌ 0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Categories:</span>
                  <span className={categories.length > 0 ? 'text-green-600' : 'text-red-600'}>
                    {categories.length > 0 ? `✅ ${categories.length}` : '❌ 0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Report Status */}
            <div className="space-y-2">
              <div className="font-medium text-blue-700">Report Generation:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Sales Report:</span>
                  <span className={salesReport ? 'text-green-600' : 'text-orange-600'}>
                    {salesReport ? '✅ Ready' : '⏳ Processing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Inventory Report:</span>
                  <span className={inventoryReport ? 'text-green-600' : 'text-orange-600'}>
                    {inventoryReport ? '✅ Ready' : '⏳ Processing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Financial Report:</span>
                  <span className={financialReport ? 'text-green-600' : 'text-orange-600'}>
                    {financialReport ? '✅ Ready' : '⏳ Processing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="space-y-2">
              <div className="font-medium text-blue-700">Current Filters:</div>
              <div className="space-y-1 text-gray-600">
                <div>Branch: {filters.branch_id || 'All'}</div>
                <div>From: {filters.date_from}</div>
                <div>To: {filters.date_to}</div>
              </div>
              <div className="space-y-1">
                <button 
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    fetchInitialData();
                  }}
                  className="w-full px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                >
                  🔄 Force Refresh
                </button>
                <button 
                  onClick={testReportsAPI}
                  className="w-full px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
                >
                  🧪 Test API
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-2 mt-3 bg-red-100 border border-red-300 rounded">
              <div className="text-xs text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="p-2 mt-3 bg-yellow-100 border border-yellow-300 rounded">
              <div className="text-xs text-yellow-800">
                🔄 Loading data from API...
              </div>
            </div>
          )}
          
          {!loading && transactions.length === 0 && (
            <div className="p-2 mt-3 bg-orange-100 border border-orange-300 rounded">
              <div className="text-xs text-orange-800">
                ⚠️ No transaction data available. This could be due to:
                <ul className="mt-1 ml-2 list-disc list-inside">
                  <li>No transactions in the selected date range</li>
                  <li>API endpoint returning empty data</li>
                  <li>Authentication or permission issues</li>
                  <li>API server connectivity problems</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">Penjualan</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm">Inventory</TabsTrigger>
          {/* <TabsTrigger value="financial" className="text-xs sm:text-sm">Keuangan</TabsTrigger> */}
        </TabsList>

        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="space-y-6">
          {salesReport && salesReport.summary ? (
            <>
              {/* Sales Summary Cards */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Total Pendapatan</p>
                        <p className="text-lg font-bold text-green-600 sm:text-2xl">
                          {formatCurrency(salesReport.summary.totalRevenue)}
                        </p>
                      </div>
                      <DollarSign className="w-6 h-6 text-green-500 sm:w-8 sm:h-8" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Total Transaksi</p>
                        <p className="text-lg font-bold sm:text-2xl">{salesReport.summary.totalTransactions}</p>
                      </div>
                      <FileText className="w-6 h-6 text-blue-500 sm:w-8 sm:h-8" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Item Terjual</p>
                        <p className="text-2xl font-bold">{salesReport.summary.totalItems}</p>
                      </div>
                      <Package className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Rata-rata Transaksi</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(salesReport.summary.averageTransaction)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Reports */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Best Selling Products */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Produk Terlaris
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleExport('best-selling', 'Excel')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport && Array.isArray(salesReport.bestSelling) && salesReport.bestSelling.length > 0 ? (
                          salesReport.bestSelling.map((item, index) => (
                            <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-right">{item.quantity}</TableCell>
                            <TableCell className="font-semibold text-right text-green-600">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                          </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan="3" className="text-center text-muted-foreground">
                              Tidak ada data produk terlaris
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Slow Moving Products */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                        Produk Lambat Terjual
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleExport('slow-moving', 'Excel')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport && Array.isArray(salesReport.slowMoving) && salesReport.slowMoving.length > 0 ? (
                          salesReport.slowMoving.map((item, index) => (
                            <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                          </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan="3" className="text-center text-muted-foreground">
                              Tidak ada data produk lambat terjual
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Sales by Category */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-blue-600" />
                      Penjualan per Kategori
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('category-sales', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">% Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport && Array.isArray(salesReport.categorySales) && salesReport.categorySales.length > 0 ? (
                        salesReport.categorySales.map((item, index) => {
                          const totalRevenue = salesReport?.summary?.totalRevenue || 0;
                          const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.category_name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="font-semibold text-right">
                                {formatCurrency(item.revenue)}
                              </TableCell>
                              <TableCell className="font-semibold text-right text-blue-600">
                                {percentage.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan="4" className="text-center text-muted-foreground">
                            Tidak ada data penjualan per kategori
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Sales by Cashier */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Performa Kasir
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('cashier-sales', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kasir</TableHead>
                        <TableHead className="text-right">Transaksi</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg/Transaksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport && Array.isArray(salesReport.cashierSales) && salesReport.cashierSales.length > 0 ? (
                        salesReport.cashierSales.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.cashier_name}</TableCell>
                            <TableCell className="text-right">{item.transactions}</TableCell>
                            <TableCell className="font-semibold text-right">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                            <TableCell className="text-right text-blue-600">
                              {formatCurrency(item.revenue / item.transactions)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan="4" className="text-center text-muted-foreground">
                            Tidak ada data penjualan per kasir
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Tidak Ada Data Penjualan</h3>
                <p className="text-muted-foreground">
                  {loading ? 'Memuat data...' : transactions.length === 0 ? 
                    'Belum ada transaksi yang tersedia' : 
                    'Tidak ada transaksi yang cocok dengan filter tanggal'}
                </p>
                
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-3 mt-4 text-xs text-left bg-gray-100 rounded">
                    <strong>Debug Info:</strong>
                    <div>Total Transactions: {transactions.length}</div>
                    <div>Products: {products.length}</div>
                    <div>Inventory: {inventory.length}</div>
                    <div>Branches: {branches.length}</div>
                    <div>Categories: {categories.length}</div>
                    <div>Date Range: {filters.date_from} to {filters.date_to}</div>
                    <div>Sales Report State: {salesReport ? 'Available' : 'Null'}</div>
                    <div>Loading: {loading ? 'Yes' : 'No'}</div>
                    <div>Error: {error || 'None'}</div>
                    {transactions.length > 0 && (
                      <div>Sample Transaction: {JSON.stringify(transactions[0], null, 2)}</div>
                    )}
                    {salesReport && <div>Sales Summary: Revenue: {salesReport.summary?.totalRevenue}, Transactions: {salesReport.summary?.totalTransactions}</div>}
                    <div className="mt-2">
                      <button 
                        className="px-2 py-1 mr-2 text-xs text-white bg-blue-500 rounded"
                        onClick={() => {
                          console.log('🔍 Manual Debug:', {
                            transactions,
                            products,
                            inventory,
                            branches,
                            categories,
                            salesReport,
                            filters,
                            loading,
                            error
                          });
                        }}
                      >
                        Log Full State
                      </button>
                      <button 
                        className="px-2 py-1 text-xs text-white bg-green-500 rounded"
                        onClick={() => {
                          console.log('🔄 Force Generate Reports');
                          generateReports().catch(console.error);
                        }}
                      >
                        Force Generate
                      </button>
                    </div>
                  </div>
                )}
                
                {!loading && transactions.length === 0 && (
                  <Button 
                    onClick={fetchInitialData} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Muat Ulang Data
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inventory Reports Tab */}
        <TabsContent value="inventory" className="space-y-6">
          {inventoryReport && inventoryReport.summary ? (
            <>
              {/* Inventory Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Nilai Total Stok</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(inventoryReport?.summary?.totalStockValue || 0)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Item</p>
                        <p className="text-2xl font-bold">{inventoryReport?.summary?.totalItems || 0}</p>
                      </div>
                      <Package className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Stok Menipis</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {inventoryReport?.summary?.lowStockCount || 0}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Dead Stock</p>
                        <p className="text-2xl font-bold text-red-600">
                          {inventoryReport?.summary?.deadStockCount || 0}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Valuation Report */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      Valuasi Stok
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('stock-valuation', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Cabang</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga Beli</TableHead>
                        <TableHead className="text-right">Nilai Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryReport && Array.isArray(inventoryReport.stockLevels) && inventoryReport.stockLevels.length > 0 ? (
                        inventoryReport.stockLevels.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{item.branch_name}</TableCell>
                          <TableCell className="font-semibold text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.purchase_price)}
                          </TableCell>
                          <TableCell className="font-semibold text-right text-blue-600">
                            {formatCurrency(item.stock_value)}
                          </TableCell>
                        </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan="5" className="text-center text-muted-foreground">
                            Tidak ada data stock levels
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                      Stok Menipis (Reorder Alert)
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('low-stock', 'Excel')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!inventoryReport || !inventoryReport.lowStock ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">Memuat data low stock...</p>
                    </div>
                  ) : inventoryReport.lowStock.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="font-medium text-green-600">✓ Semua stok aman</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead>Cabang</TableHead>
                          <TableHead className="text-right">Sisa Stok</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReport && Array.isArray(inventoryReport.lowStock) && inventoryReport.lowStock.length > 0 ? (
                          inventoryReport.lowStock.map((item, index) => (
                            <TableRow key={index} className="bg-orange-50">
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{item.branch_name}</TableCell>
                            <TableCell className="font-bold text-right text-orange-600">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="px-2 py-1 text-xs text-orange-800 bg-orange-100 rounded-full">
                                Perlu Restock
                              </span>
                            </TableCell>
                          </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan="4" className="text-center text-muted-foreground">
                              Tidak ada produk dengan stok menipis
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Tidak Ada Data Inventory</h3>
                <p className="text-muted-foreground">
                  {loading ? 'Memuat data...' : inventory.length === 0 ? 
                    'Belum ada data inventory yang tersedia' : 
                    'Data inventory sedang diproses'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="space-y-6">
          {financialReport ? (
            <>
              {/* Profit & Loss Report */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Laporan Laba Rugi
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('profit-loss', 'PDF')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                  <CardDescription>
                    Periode: {formatDate(filters.date_from)} - {formatDate(filters.date_to)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <span className="font-medium">Total Pendapatan</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(financialReport.profitLoss.revenue)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <span className="font-medium">Harga Pokok Penjualan (HPP)</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(financialReport.profitLoss.cogs)}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t-2"></div>
                    
                    <div className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg bg-green-50">
                      <div>
                        <p className="font-medium">Laba Kotor</p>
                        <p className="text-sm text-muted-foreground">
                          Margin: {financialReport.profitLoss.grossMargin.toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialReport.profitLoss.grossProfit)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div>
                        <p className="font-medium">Laba Bersih</p>
                        <p className="text-sm text-muted-foreground">
                          Margin: {financialReport.profitLoss.netMargin.toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialReport.profitLoss.netProfit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Flow Report */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Laporan Arus Kas
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => handleExport('cash-flow', 'PDF')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                  <CardDescription>
                    Periode: {formatDate(filters.date_from)} - {formatDate(filters.date_to)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
                      <div>
                        <p className="font-medium">Kas Masuk</p>
                        <p className="text-sm text-muted-foreground">Dari penjualan</p>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(financialReport.cashFlow.inflow)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">Kas Keluar</p>
                        <p className="text-sm text-muted-foreground">Pembelian barang</p>
                      </div>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(financialReport.cashFlow.outflow)}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t-2"></div>
                    
                    <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div>
                        <p className="text-lg font-medium">Arus Kas Bersih</p>
                        <p className="text-sm text-muted-foreground">Kas Masuk - Kas Keluar</p>
                      </div>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(financialReport.cashFlow.net)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Tidak Ada Data Keuangan</h3>
                <p className="text-muted-foreground">
                  {loading ? 'Memuat data...' : transactions.length === 0 ? 
                    'Belum ada transaksi untuk laporan keuangan' : 
                    'Data keuangan sedang diproses'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingAnalytics;
