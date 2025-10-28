'use client';

import { useState, useEffect, useRef } from 'react';
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
import { toast } from '@/hooks/use-toast';
import useReportingData from '@/hooks/useReportingData';
import useStockData from '@/hooks/useStockData';
import axios from 'axios';

const ReportingAnalytics = () => {
  // Use custom hook for all data management
  const {
    dashboardData,
    reportsData,
    salesChartData,
    inventoryAlerts,
    transactions,
    products,
    inventory,
    branches,
    categories,
    loading,
    error,
    isFetching,
    fetchAllData,
    generateReports,
    clearCache,
    isCached
  } = useReportingData();

  // Use dedicated stock data hook for stock valuation
  const {
    stocksResponse,
    stockItems,
    loading: stockLoading,
    error: stockError,
    fetchStocks,
    stockSummary
  } = useStockData();
  
  const [activeTab, setActiveTab] = useState('sales');
  
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
  const [financialReport, setFinancialReport] = useState({
    profitLoss: {
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      grossMargin: 0,
      netProfit: 0,
      netMargin: 0
    },
    cashFlow: {
      inflow: 0,
      outflow: 0,
      net: 0
    }
  });

  // Generate reports function using proper API endpoints
  const generateLocalReports = async () => {
    console.log('🔄 Generating reports with filters:', filters);

    try {
      // Call the generateReports function from the hook with proper parameters
      const reportsResult = await generateReports(
        filters.date_from,
        filters.date_to,
        filters.branch_id || null,
        'all'
      );

      if (reportsResult) {
        // Update local states with the reports data
        if (reportsResult.sales) {
          setSalesReport({
            summary: reportsResult.sales.summary,
            topProducts: reportsResult.sales.topProducts,
            slowMovingProducts: reportsResult.sales.slowMovingProducts,
            salesByCategory: reportsResult.sales.salesByCategory,
            cashierPerformance: reportsResult.sales.cashierPerformance
          });
        }

        if (reportsResult.inventory) {
          setInventoryReport({
            summary: reportsResult.inventory.summary,
            alerts: reportsResult.inventory.alerts,
            stockLevels: reportsResult.inventory.alerts || []
          });
        }

        // For financial report, we'll use the sales summary data
        if (reportsResult.sales?.summary) {
          const summary = reportsResult.sales.summary;
          const totalRevenue = summary.totalRevenue || 0;
          const totalCOGS = (totalRevenue * 0.7) || 0; // Estimate COGS as 70% of revenue
          const grossProfit = totalRevenue - totalCOGS;
          const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
          const netProfit = grossProfit; // Simplified, no other expenses calculated
          const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

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
              inflow: totalRevenue,
              outflow: totalCOGS,
              net: totalRevenue - totalCOGS
            }
          });
        }

        console.log('✅ Local reports updated successfully');
      }
    } catch (error) {
      console.error('❌ Error in generateLocalReports:', error);
      
      // Fallback to legacy method if new API fails
      console.log('🔄 Falling back to legacy report generation...');
      await generateLegacyReports();
    }
  };

  // Legacy report generation as fallback
  const generateLegacyReports = async () => {
    // Use dashboard data as primary source
    if (dashboardData && dashboardData.salesPerformance) {
      console.log('📊 Using dashboard data for legacy reports');
      await generateSalesReportFromDashboard();
      await generateInventoryReportFromDashboard();
      generateFinancialReportFromDashboard();
    } else {
      // Fallback to transaction filtering for legacy mode
      const filteredTransactions = transactions.filter((t, index) => {
        try {
          const tDate = new Date(t.transactionDate || t.transaction_date || t.createdAt || t.created_at);
          const fromDate = new Date(filters.date_from);
          const toDate = new Date(filters.date_to);
          toDate.setHours(23, 59, 59, 999);

          if (isNaN(tDate.getTime())) return false;

          const dateMatch = tDate >= fromDate && tDate <= toDate;
          const branchMatch = !filters.branch_id || 
                            t.branchId === filters.branch_id || 
                            t.branch_id === filters.branch_id ||
                            filters.branch_id === 'all';
          
          return dateMatch && branchMatch;
        } catch (error) {
          return false;
        }
      });

      // Generate Reports from filtered transactions
      await generateSalesReport(filteredTransactions);
      await generateInventoryReport();
      generateFinancialReport(filteredTransactions);
    }
  };

  // Generate sales report from dashboard data
  const generateSalesReportFromDashboard = async () => {
    try {
      console.log('📊 Generating sales report from dashboard data');
      
      const { salesPerformance, topSellingProducts, recentTransactions } = dashboardData;

      setSalesReport({
        summary: {
          totalRevenue: salesPerformance?.thisMonth?.revenue || 0,
          totalTransactions: salesPerformance?.totalTransactions || 0,
          totalItems: salesPerformance?.totalItemsSold || 0,
          averageTransaction: salesPerformance?.thisMonth?.revenue && salesPerformance?.totalTransactions 
            ? salesPerformance.thisMonth.revenue / salesPerformance.totalTransactions 
            : 0
        },
        dailySales: [],
        productSales: [],
        categorySales: [],
        cashierSales: [],
        bestSelling: (topSellingProducts || []).map(p => ({
          product_id: p.productId || p.id,
          product_name: p.productName || p.name,
          sku: p.productSku || p.sku,
          quantity: p.totalQuantity || p.quantity,
          revenue: p.totalRevenue || p.revenue
        })),
        slowMoving: []
      });
    } catch (error) {
      console.error('❌ Error generating sales report from dashboard:', error);
    }
  };

  // Generate inventory report from dashboard data
  const generateInventoryReportFromDashboard = async () => {
    try {
      console.log('📦 Generating inventory report from dashboard data');
      
      const { inventoryStats, lowStockAlerts } = dashboardData;

      setInventoryReport({
        summary: {
          totalStockValue: inventoryStats?.totalStockValue || 0,
          totalItems: inventoryStats?.totalItems || 0,
          lowStockCount: inventoryStats?.lowStockCount || 0,
          uniqueProducts: inventoryStats?.uniqueProducts || 0,
          deadStockCount: inventoryStats?.deadStockCount || 0
        },
        stockLevels: [],
        lowStock: lowStockAlerts || [],
        lowStockProducts: lowStockAlerts || [],
        categories: [],
        trend: 'stable'
      });
    } catch (error) {
      console.error('❌ Error generating inventory report from dashboard:', error);
    }
  };

  // Generate financial report from dashboard data
  const generateFinancialReportFromDashboard = () => {
    try {
      console.log('💰 Generating financial report from dashboard data');
      
      const { salesPerformance } = dashboardData;

      if (salesPerformance) {
        const totalRevenue = salesPerformance.thisMonth?.revenue || 0;
        // Simplified financial calculation
        const totalCOGS = totalRevenue * 0.7; // Assume 70% COGS
        const grossProfit = totalRevenue - totalCOGS;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        setFinancialReport({
          profitLoss: {
            revenue: totalRevenue,
            cogs: totalCOGS,
            grossProfit,
            grossMargin,
            netProfit: grossProfit,
            netMargin: grossMargin
          },
          cashFlow: {
            inflow: totalRevenue,
            outflow: totalCOGS,
            net: grossProfit
          }
        });
      }
    } catch (error) {
      console.error('❌ Error generating financial report from dashboard:', error);
    }
  };

  // Effects
  useEffect(() => {
    console.log('🚀 Component mounted, fetching data...');
    
    // Build params from filters
    const params = {};
    if (filters.branch_id && filters.branch_id !== 'all') {
      params.branchId = filters.branch_id;
    }
    if (filters.date_from && filters.date_to) {
      params.startDate = filters.date_from;
      params.endDate = filters.date_to;
    }

    // Fetch main reports data
    fetchAllData(params).catch(error => {
      console.error('❌ Failed to fetch initial data:', error);
      toast({
        title: "Error",
        description: 'Failed to load initial data: ' + error.message,
        variant: "destructive"
      });
    });

    // Fetch stock data for stock valuation table
    fetchStocks(params).catch(error => {
      console.error('❌ Failed to fetch stock data:', error);
    });
  }, []); // Remove dependencies to prevent infinite loop

  // Fetch stocks when filters change
  useEffect(() => {
    const params = {};
    if (filters.branch_id && filters.branch_id !== 'all') {
      params.branchId = filters.branch_id;
    }
    
    fetchStocks(params).catch(error => {
      console.error('❌ Failed to fetch updated stock data:', error);
    });
  }, [filters.branch_id, fetchStocks]);

  // State untuk mencegah multiple report generation
  const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  const [lastDataHash, setLastDataHash] = useState('');

  useEffect(() => {
    // Create a hash of current data to prevent unnecessary re-generations
    const dataHash = JSON.stringify({
      dashboardData: !!dashboardData,
      transactionsCount: transactions.length,
      productsCount: products.length,
      inventoryCount: inventory.length,
      loading,
      error: !!error
    });

    console.log('📊 Data state:', {
      dashboardData: !!dashboardData,
      transactionsCount: transactions.length,
      productsCount: products.length,
      inventoryCount: inventory.length,
      loading,
      error: !!error,
      isGeneratingReports,
      dataChanged: dataHash !== lastDataHash
    });

    // Only generate reports if:
    // 1. Not currently loading or generating reports
    // 2. Data has actually changed
    // 3. We have some data available
    if (!loading && !error && !isGeneratingReports && dataHash !== lastDataHash) {
      if (dashboardData || transactions.length > 0) {
        console.log('✅ Generating reports from data');
        setIsGeneratingReports(true);
        setLastDataHash(dataHash);
        
        generateLocalReports()
          .catch(error => {
            console.error('❌ Error generating reports:', error);
            toast({
              title: "Error",
              description: 'Failed to generate reports: ' + error.message,
              variant: "destructive"
            });
          })
          .finally(() => {
            setIsGeneratingReports(false);
          });
      } else if (!loading && !error) {
        console.log('⚠️ No data available, setting empty reports');
        setLastDataHash(dataHash);
        setSalesReport({
          summary: { 
            totalRevenue: 0, 
            totalTransactions: 0, 
            totalItems: 0, 
            averageTransaction: 0 
          },
          bestSelling: [],
          slowMoving: [],
          categorySales: [],
          cashierSales: []
        });
        setInventoryReport({
          summary: { totalStockValue: 0, totalItems: 0, lowStockCount: 0, uniqueProducts: 0, deadStockCount: 0 },
          stockLevels: [],
          lowStock: [],
          lowStockProducts: [],
          categories: [],
          trend: 'stable'
        });  
        setFinancialReport({
          profitLoss: {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossMargin: 0,
            netProfit: 0,
            netMargin: 0
          },
          cashFlow: {
            inflow: 0,
            outflow: 0,
            net: 0
          }
        });
      }
    }
  }, [dashboardData, transactions, products, inventory, loading, error, isGeneratingReports, lastDataHash]); // Minimal dependencies

  const generateSalesReport = async (filteredTransactions) => {
    try {
      // Build query params based on filters
      const params = {};
      if (filters.branch_id && filters.branch_id !== 'all') {
        params.branchId = filters.branch_id;
      }
      if (filters.date_from && filters.date_to) {
        params.startDate = filters.date_from;
        params.endDate = filters.date_to;
      }

      // Simple API calls
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [salesSummaryRes, topProductsRes, categoryRes] = await Promise.allSettled([
        axios.get('https://api.diwanmotor.com/api/reports/sales/summary', { params, headers }),
        axios.get('https://api.diwanmotor.com/api/reports/sales/top-products', { params, headers }),
        axios.get('https://api.diwanmotor.com/api/reports/sales/by-category', { params, headers })
      ]);


      // Use API data if available, otherwise fallback to local calculation
      if (salesSummaryRes.status === 'fulfilled' && salesSummaryRes.value?.data?.success) {
        const apiSalesData = salesSummaryRes.value.data.data;
        const topProducts = topProductsRes.status === 'fulfilled' && topProductsRes.value?.data?.success 
          ? topProductsRes.value.data.data.products || [] 
          : [];
        const categoryData = categoryRes.status === 'fulfilled' && categoryRes.value?.data?.success 
          ? categoryRes.value.data.data || [] 
          : [];

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
          dailySales: [],
          trend: 'stable'
        });
        return;
      }
    } catch (error) {
      console.error('❌ Error fetching sales report from API:', error);
    }

    // Fallback: Generate from local transaction data
    if (!Array.isArray(filteredTransactions) || filteredTransactions.length === 0) {
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
    

    
    setSalesReport(salesReportData);

  };

  const generateInventoryReport = async () => {
    // Initialize with safe defaults first
    const defaultInventoryReport = {
      summary: { totalStockValue: 0, totalItems: 0, lowStockCount: 0, uniqueProducts: 0, deadStockCount: 0 },
      stockLevels: [],
      lowStock: [],
      lowStockProducts: [],
      categories: [],
      trend: 'stable'
    };
    
    setInventoryReport(defaultInventoryReport);
    
    try {
      // Build query params based on filters
      const params = {};
      if (filters.branch_id && filters.branch_id !== 'all') {
        params.branchId = filters.branch_id;
      }

      // Simple API calls
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Try multiple inventory endpoints to get comprehensive data
      const [inventorySummaryRes, lowStockRes, stockValuationRes, inventoryListRes] = await Promise.allSettled([
        axios.get('https://api.diwanmotor.com/api/reports/inventory/summary', { params, headers }),
        axios.get('https://api.diwanmotor.com/api/reports/inventory/low-stock', { params, headers }),
        axios.get('https://api.diwanmotor.com/api/reports/inventory/stock-valuation', { params, headers }),
        axios.get('https://api.diwanmotor.com/api/inventory', { params: { ...params, limit: 1000 }, headers })
      ]);

      // Process API responses to get comprehensive inventory data
      let inventoryApiData = null;
      let summaryData = null;
      let lowStockData = [];
      let stockLevels = [];

      // Get summary data
      if (inventorySummaryRes.status === 'fulfilled' && inventorySummaryRes.value?.data?.success) {
        summaryData = inventorySummaryRes.value.data.data;
      }

      // Get low stock data
      if (lowStockRes.status === 'fulfilled' && lowStockRes.value?.data?.success) {
        lowStockData = lowStockRes.value.data.data || [];
      }

      // Get detailed inventory list if available
      if (inventoryListRes.status === 'fulfilled' && inventoryListRes.value?.data?.success) {
        inventoryApiData = inventoryListRes.value.data.data || [];
        console.log('📦 Got inventory list from API:', inventoryApiData.length);
        
        // Process inventory list to create stock levels
        stockLevels = inventoryApiData.map(inv => {
          const product = products.find(p => p.id === (inv.productId || inv.product_id));
          const branch = branches.find(b => b.id === (inv.branchId || inv.branch_id));
          const purchasePrice = parseFloat(product?.purchasePrice || product?.purchase_price || inv.purchasePrice || 0);
          const quantity = parseInt(inv.quantity || inv.stock || 0);
          
          return {
            productId: inv.productId || inv.product_id,
            product_name: product?.name || inv.productName || 'Unknown',
            sku: product?.sku || inv.sku || '-',
            branch_name: branch?.name || inv.branchName || 'Unknown',
            branchId: inv.branchId || inv.branch_id,
            quantity: quantity,
            purchase_price: purchasePrice,
            stock_value: purchasePrice * quantity
          };
        });
      } else if (stockValuationRes.status === 'fulfilled' && stockValuationRes.value?.data?.success) {
        // Fallback to stock valuation data
        const valuationData = stockValuationRes.value.data.data || { stocks: [] };
        stockLevels = Array.isArray(valuationData.stocks) ? valuationData.stocks.map(stock => ({
          product_name: stock.product?.name || 'Unknown',
          sku: stock.product?.sku || '-',
          branch_name: stock.branch?.name || 'Unknown',
          quantity: stock.quantity || 0,
          stock_value: stock.totalValue || 0,
          purchase_price: stock.product?.price || 0
        })) : [];
      }

      // If we have any API data, use it
      if (summaryData || stockLevels.length > 0) {
        // Calculate summary if not provided
        if (!summaryData && stockLevels.length > 0) {
          const totalStockValue = stockLevels.reduce((sum, item) => sum + item.stock_value, 0);
          const totalItems = stockLevels.reduce((sum, item) => sum + item.quantity, 0);
          const lowStockCount = stockLevels.filter(item => item.quantity < 10).length;
          
          summaryData = {
            totalStockValue,
            totalItems,
            lowStockCount,
            uniqueProducts: stockLevels.length
          };
        }

        setInventoryReport({
          summary: {
            totalStockValue: summaryData?.totalStockValue || 0,
            totalItems: summaryData?.totalItems || 0,
            lowStockCount: summaryData?.lowStockCount || 0,
            uniqueProducts: summaryData?.uniqueProducts || stockLevels.length,
            deadStockCount: stockLevels.filter(item => item.quantity === 0).length
          },
          stockLevels: stockLevels.sort((a, b) => b.stock_value - a.stock_value),
          lowStock: stockLevels.filter(item => item.quantity < 10),
          lowStockProducts: Array.isArray(lowStockData) ? lowStockData : stockLevels.filter(item => item.quantity < 10),
          categories: [],
          trend: 'stable'
        });
        return;
      }
    } catch (error) {
      console.error('❌ Error fetching inventory report from API:', error);
    }

    // Fallback: Generate from local inventory data


    // Process inventory data by combining with products data
    console.log('📦 Processing inventory data locally:', {
      inventory: inventory.length || 'not array',
      products: products.length,
      branches: branches.length,
      inventoryType: typeof inventory,
      isInventoryArray: Array.isArray(inventory),
      sampleInventory: Array.isArray(inventory) ? inventory[0] : inventory
    });

    // If inventory is not array but we have products, generate stock levels from products
    if (!Array.isArray(inventory) && Array.isArray(products) && products.length > 0) {
      console.log('⚠️ Inventory is not array, generating from products data');
      
      // Create stock levels from products data
      const stockLevels = products.map(product => {
        const purchasePrice = parseFloat(product.purchasePrice || product.purchase_price || product.price || 0);
        const quantity = parseInt(product.stock || product.quantity || product.currentStock || 0);
        
        return {
          productId: product.id,
          product_id: product.id,
          product_name: product.name || 'Unknown Product',
          sku: product.sku || '-',
          branch_name: 'Default Branch',
          branchId: 'default',
          quantity: quantity,
          purchase_price: purchasePrice,
          stock_value: purchasePrice * quantity,
          categoryId: product.categoryId || product.category_id,
          category_name: categories.find(c => c.id === (product.categoryId || product.category_id))?.name || 'Uncategorized'
        };
      });

      console.log('📊 Generated stock levels from products:', stockLevels.length, stockLevels[0]);

      // Calculate summary
      const totalStockValue = stockLevels.reduce((sum, item) => sum + item.stock_value, 0);
      const totalItems = stockLevels.reduce((sum, item) => sum + item.quantity, 0);
      const lowStock = stockLevels.filter(item => item.quantity < 10);
      const deadStock = stockLevels.filter(item => item.quantity === 0);

      setInventoryReport({
        summary: {
          totalStockValue,
          totalItems,
          lowStockCount: lowStock.length,
          uniqueProducts: stockLevels.length,
          deadStockCount: deadStock.length
        },
        stockLevels: stockLevels.sort((a, b) => b.stock_value - a.stock_value),
        lowStock,
        lowStockProducts: lowStock,
        categories: [],
        trend: 'stable'
      });
      return;
    }

    // If inventory is summary object, use it directly
    if (!Array.isArray(inventory) && inventory && typeof inventory === 'object' && inventory.totalStockValue !== undefined) {
      console.log('📋 Using inventory summary object:', inventory);
      setInventoryReport({
        summary: {
          totalStockValue: inventory.totalStockValue || 0,
          totalItems: inventory.totalItems || 0,
          lowStockCount: inventory.lowStockCount || 0,
          uniqueProducts: inventory.uniqueProducts || 0,
          deadStockCount: inventory.deadStockCount || 0
        },
        stockLevels: [],
        lowStock: [],
        lowStockProducts: [],
        categories: [],
        trend: 'stable'
      });
      return;
    }

    // If no usable data available
    if (!Array.isArray(inventory) && (!Array.isArray(products) || products.length === 0)) {
      console.log('❌ No inventory or products data available');
      setInventoryReport({
        summary: { totalStockValue: 0, totalItems: 0, lowStockCount: 0, uniqueProducts: 0, deadStockCount: 0 },
        stockLevels: [],
        lowStock: [],
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

  // Debounce filter changes to prevent excessive API calls
  const filterTimeoutRef = useRef(null);
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    
    // Clear existing timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Debounce API call by 1 second
    filterTimeoutRef.current = setTimeout(() => {
      const params = {};
      const newFilters = { ...filters, [field]: value };
      
      if (newFilters.branch_id && newFilters.branch_id !== 'all') {
        params.branchId = newFilters.branch_id;
      }
      if (newFilters.date_from && newFilters.date_to) {
        params.startDate = newFilters.date_from;
        params.endDate = newFilters.date_to;
      }
      
      console.log('🔄 Filter changed, refreshing data with params:', params);
      fetchAllData(params);
    }, 1000); // 1 second debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  const handleExport = (reportType, format) => {
    toast({
      title: "Export Feature",
      description: `Export ${reportType} ke ${format} akan segera hadir`
    });
  };

  const formatCurrency = (amount) => {
    // Handle invalid values (NaN, null, undefined, etc.)
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      return 'Rp 0';
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numericAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && !dashboardData && transactions.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Memuat data laporan...</p>
          {isFetching && (
            <p className="mt-2 text-xs text-muted-foreground">Mengambil data dari server...</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-red-600">Error Loading Data</h3>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <Button 
            onClick={() => { clearCache(); fetchAllData(); }} 
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
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
        <Button onClick={() => { 
          clearCache(); 
          const params = {};
          if (filters.branch_id && filters.branch_id !== 'all') {
            params.branchId = filters.branch_id;
          }
          if (filters.date_from && filters.date_to) {
            params.startDate = filters.date_from;
            params.endDate = filters.date_to;
          }
          fetchAllData(params); 
        }} variant="outline" size="sm" disabled={loading || isFetching}>
          <RefreshCw className={`w-4 h-4 sm:mr-2 ${(loading || isFetching) ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {loading || isFetching ? 'Loading...' : 'Muat Ulang'}
          </span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg" style={{ display: 'none' }}>
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
                          {formatCurrency(salesReport.summary.totalRevenue || 0)}
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
                        <p className="text-lg font-bold sm:text-2xl">{salesReport.summary.totalTransactions || 0}</p>
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
                        <p className="text-2xl font-bold">{salesReport.summary.totalItems || 0}</p>
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
                          {formatCurrency(salesReport.summary.averageTransaction || 0)}
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
                              {formatCurrency(item.transactions > 0 ? item.revenue / item.transactions : 0)}
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
                

                
                {!loading && transactions.length === 0 && (
                  <Button 
                    onClick={() => { clearCache(); fetchAllData(); }} 
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
                      {(() => {
                        // Use dedicated stock hook data
                        if (stockLoading || (loading && !stockItems)) {
                          return (
                            <TableRow>
                              <TableCell colSpan="5" className="text-center text-muted-foreground">
                                Memuat data stok...
                              </TableCell>
                            </TableRow>
                          );
                        }

                        if (stockError) {
                          return (
                            <TableRow>
                              <TableCell colSpan="5" className="text-center text-red-500">
                                Error: {stockError}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        console.log('📊 Using stock data from useStockData hook:', {
                          stockItems: stockItems?.length || 0,
                          stockSummary,
                          sampleStockItem: stockItems?.[0] || null,
                          lowStockItems: stockItems?.filter(item => item.isLowStock).length || 0
                        });

                        // Use processed stock items from hook (limit to 30 for display)
                        const displayStockItems = stockItems?.slice(0, 30) || [];
                        
                        // Display stock data rows using processed data from hook
                        if (displayStockItems && displayStockItems.length > 0) {
                          console.log('📈 Displaying stock items:', displayStockItems.length);
                          
                          return displayStockItems.map((item, index) => (
                            <TableRow key={`stock-${item.product_id}-${item.branch_code || index}`} 
                                      className={item.isLowStock ? 'bg-orange-50' : ''}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.product_name || 'Unknown Product'}</p>
                                  <p className="text-xs text-muted-foreground">SKU: {item.sku || '-'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.category} - {item.brand} {item.unit && `(${item.unit})`}
                                  </p>
                                  {item.isLowStock && (
                                    <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                                      ⚠️ Low Stock
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.branch_name}</p>
                                  <p className="text-xs text-muted-foreground">{item.branch_code}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div>
                                  <span className={item.isLowStock ? 'text-orange-600 font-medium' : ''}>
                                    {item.quantity?.toLocaleString() || 0}
                                  </span>
                                  {item.minStock > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Min: {item.minStock}
                                    </p>
                                  )}
                                  {item.isLowStock && (
                                    <p className="text-xs text-orange-600 font-medium">
                                      ⚠️ Below minimum
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency ? formatCurrency(item.purchase_price || 0) : `Rp ${(item.purchase_price || 0).toLocaleString()}`}
                              </TableCell>
                              <TableCell className="font-medium text-right">
                                {formatCurrency ? formatCurrency(item.stock_value || 0) : `Rp ${(item.stock_value || 0).toLocaleString()}`}
                              </TableCell>
                            </TableRow>
                          ));
                        } else {
                          return (
                            <TableRow>
                              <TableCell colSpan="5" className="text-center text-muted-foreground">
                                {stockItems?.length === 0 ? 'Tidak ada data stok tersedia' : 'Memuat data stok...'}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        })()}
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
                  {loading && !inventoryReport ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">Memuat data low stock...</p>
                    </div>
                  ) : !inventoryReport || !inventoryReport.lowStock || inventoryReport.lowStock.length === 0 ? (
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
                        {formatCurrency(financialReport?.profitLoss?.revenue || 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <span className="font-medium">Harga Pokok Penjualan (HPP)</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(financialReport?.profitLoss?.cogs || 0)}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t-2"></div>
                    
                    <div className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg bg-green-50">
                      <div>
                        <p className="font-medium">Laba Kotor</p>
                        <p className="text-sm text-muted-foreground">
                          Margin: {(financialReport?.profitLoss?.grossMargin || 0).toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialReport?.profitLoss?.grossProfit || 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div>
                        <p className="font-medium">Laba Bersih</p>
                        <p className="text-sm text-muted-foreground">
                          Margin: {(financialReport?.profitLoss?.netMargin || 0).toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialReport?.profitLoss?.netProfit || 0)}
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
                        {formatCurrency(financialReport?.cashFlow?.inflow || 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">Kas Keluar</p>
                        <p className="text-sm text-muted-foreground">Pembelian barang</p>
                      </div>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(financialReport?.cashFlow?.outflow || 0)}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t-2"></div>
                    
                    <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <div>
                        <p className="text-lg font-medium">Arus Kas Bersih</p>
                        <p className="text-sm text-muted-foreground">Kas Masuk - Kas Keluar</p>
                      </div>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(financialReport?.cashFlow?.net || 0)}
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
