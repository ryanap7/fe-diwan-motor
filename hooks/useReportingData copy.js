'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const useReportingData = () => {
  // State for different data types - sama seperti dashboard
  const [dashboardData, setDashboardData] = useState({
    salesPerformance: null,
    inventoryStats: null,
    customerStats: null,
    topSellingProducts: [],
    recentTransactions: [],
    lowStockAlerts: []
  });
  
  const [reportsData, setReportsData] = useState(null);
  
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesChartData, setSalesChartData] = useState(null);
  const [inventoryAlerts, setInventoryAlerts] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache management
  const [lastFetch, setLastFetch] = useState(null);
  const [cache, setCache] = useState({});

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Helper function to get headers
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Cache checker
  const isCached = useCallback((key) => {
    return cache[key] && (Date.now() - cache[key].timestamp < CACHE_DURATION);
  }, [cache]);

  // Clear cache function
  const clearCache = useCallback(() => {
    console.log('🗑️ Clearing cache');
    setCache({});
    setLastFetch(null);
  }, []);
  
  // Fetch reports data using correct API endpoints from Postman documentation
  const fetchReportsData = useCallback(async (params = {}) => {
    try {
      const headers = getHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.branchId && params.branchId !== 'all') queryParams.append('branchId', params.branchId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      console.log('🌐 Fetching reports data with params:', params);

      // Fetch multiple reports in parallel
      const [
        salesSummaryRes,
        topProductsRes,
        slowMovingRes,
        salesByCategoryRes,
        cashierPerformanceRes,
        inventorySummaryRes,
        lowStockRes
      ] = await Promise.allSettled([
        axios.get(`/api/reports/sales/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { headers }),
        axios.get(`/api/reports/sales/top-products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { headers }),
        axios.get(`/api/reports/sales/slow-moving?daysThreshold=30${queryParams.toString() ? `&${queryParams.toString()}` : ''}`, { headers }),
        axios.get(`/api/reports/sales/by-category${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { headers }),
        axios.get(`/api/reports/sales/cashier-performance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { headers }),
        axios.get(`/api/reports/inventory/summary${params.branchId && params.branchId !== 'all' ? `?branchId=${params.branchId}` : ''}`, { headers }),
        axios.get(`/api/reports/inventory/low-stock${params.branchId && params.branchId !== 'all' ? `?branchId=${params.branchId}` : ''}`, { headers })
      ]);

      // Process sales data
      const salesSummary = salesSummaryRes.status === 'fulfilled' && salesSummaryRes.value?.data?.success 
        ? salesSummaryRes.value.data.data 
        : { totalRevenue: 0, totalTransactions: 0, totalItemsSold: 0, averageTransactionValue: 0 };

      const topProducts = topProductsRes.status === 'fulfilled' && topProductsRes.value?.data?.success 
        ? topProductsRes.value.data.data.products || []
        : [];

      const slowMovingProducts = slowMovingRes.status === 'fulfilled' && slowMovingRes.value?.data?.success 
        ? slowMovingRes.value.data.data.products || []
        : [];

      const salesByCategory = salesByCategoryRes.status === 'fulfilled' && salesByCategoryRes.value?.data?.success 
        ? salesByCategoryRes.value.data.data.categories || []
        : [];

      const cashierPerformance = cashierPerformanceRes.status === 'fulfilled' && cashierPerformanceRes.value?.data?.success 
        ? cashierPerformanceRes.value.data.data.performance || []
        : [];

      // Process inventory data
      const inventorySummary = inventorySummaryRes.status === 'fulfilled' && inventorySummaryRes.value?.data?.success 
        ? inventorySummaryRes.value.data.data 
        : { totalStockValue: 0, totalItems: 0, lowStockCount: 0, uniqueProducts: 0 };

      const lowStockProducts = lowStockRes.status === 'fulfilled' && lowStockRes.value?.data?.success 
        ? lowStockRes.value.data.data.products || []
        : [];

      const reportsData = {
        salesPerformance: {
          totalRevenue: salesSummary.totalRevenue,
          totalTransactions: salesSummary.totalTransactions,
          totalItemsSold: salesSummary.totalItemsSold,
          averageTransactionValue: salesSummary.averageTransactionValue
        },
        inventoryStats: {
          totalStockValue: inventorySummary.totalStockValue,
          totalItems: inventorySummary.totalItems,
          lowStockCount: inventorySummary.lowStockCount,
          uniqueProducts: inventorySummary.uniqueProducts
        },
        topSellingProducts: topProducts,
        slowMovingProducts: slowMovingProducts,
        salesByCategory: salesByCategory,
        cashierPerformance: cashierPerformance,
        lowStockAlerts: lowStockProducts
      };

      setDashboardData(reportsData);

      console.log('✅ Reports data loaded:', reportsData);
      return reportsData;
    } catch (error) {
      console.error('❌ Error fetching reports data:', error);
      throw error;
    }
  }, []);

  // Fetch sales chart data (sama seperti dashboard)
  const fetchSalesChartData = useCallback(async (params = {}) => {
    try {
      const headers = getHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.branchId) queryParams.append('branchId', params.branchId);
      if (params.period) queryParams.append('period', params.period); // daily | weekly | monthly | yearly
      if (params.limit) queryParams.append('limit', params.limit);

      const url = `/api/dashboard/sales-chart${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('📊 Fetching sales chart data:', url);
      const response = await axios.get(url, { headers });
      
      if (response.data?.success && response.data?.data) {
        setSalesChartData(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching sales chart data:', error);
      setSalesChartData(null);
      return null;
    }
  }, []);

  // Fetch inventory alerts (sama seperti dashboard)
  const fetchInventoryAlerts = useCallback(async (params = {}) => {
    try {
      const headers = getHeaders();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.branchId) queryParams.append('branchId', params.branchId);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.alertType) queryParams.append('alertType', params.alertType); // low_stock | out_of_stock | all

      const url = `/api/dashboard/inventory-alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🚨 Fetching inventory alerts:', url);
      const response = await axios.get(url, { headers });
      
      if (response.data?.success && response.data?.data) {
        setInventoryAlerts(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching inventory alerts:', error);
      setInventoryAlerts(null);
      return null;
    }
  }, []);
  
  // Individual fetch functions dengan endpoint yang benar
  const fetchTransactions = useCallback(async () => {
    try {
      const headers = getHeaders();
      console.log('🌐 Fetching transactions from API');
      const response = await axios.get('/api/transactions', { headers });
      
      const data = response.data?.data || response.data || [];
      const processedData = Array.isArray(data) ? data : [];
      setTransactions(processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Failed to fetch transactions:', error);
      setTransactions([]);
      return [];
    }
  }, []);
  
  const fetchProducts = useCallback(async () => {
    try {
      const headers = getHeaders();
      console.log('🌐 Fetching products from API');
      const response = await axios.get('/api/products', { headers });
      
      const data = response.data?.data || response.data || [];
      const processedData = Array.isArray(data) ? data : [];
      setProducts(processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      setProducts([]);
      return [];
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const headers = getHeaders();
      console.log('🌐 Fetching inventory from API');
      const response = await axios.get('/api/inventory', { headers });
      
      const data = response.data?.data || response.data || [];
      const processedData = Array.isArray(data) ? data : [];
      setInventory(processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Failed to fetch inventory:', error);
      setInventory([]);
      return [];
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const headers = getHeaders();
      console.log('🌐 Fetching branches from API');
      const response = await axios.get('/api/branches', { headers });
      
      // Ensure we always set an array
      const branchData = response.data;
      let processedData = [];
      
      if (Array.isArray(branchData)) {
        processedData = branchData;
      } else if (branchData && Array.isArray(branchData.data)) {
        processedData = branchData.data;
      }
      
      setBranches(processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Failed to fetch branches:', error);
      setBranches([]);
      return [];
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const headers = getHeaders();
      console.log('🌐 Fetching categories from API');
      const response = await axios.get('/api/categories', { headers });
      
      const data = response.data?.data || response.data || [];
      const processedData = Array.isArray(data) ? data : [];
      setCategories(processedData);
      return processedData;
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      setCategories([]);
      return [];
    }
  }, []);
  
  // Main function to fetch all data - menggunakan dashboard endpoint sebagai primary source
  const fetchAllData = useCallback(async (params = {}) => {
    if (loading) {
      console.log('⏳ Already loading, skipping...');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Starting to fetch all data with params:', params);
      
      // Fetch dashboard analytics first (primary source)
      const [
        dashboardResult,
        transactionsResult,
        productsResult,
        inventoryResult,
        branchesResult,
        categoriesResult,
        salesChartResult,
        inventoryAlertsResult
      ] = await Promise.allSettled([
        fetchDashboardAnalytics(params),
        fetchTransactions(),
        fetchProducts(),
        fetchInventory(),
        fetchBranches(),
        fetchCategories(),
        fetchSalesChartData(params),
        fetchInventoryAlerts(params)
      ]);

      setLastFetch(Date.now());

      // Log results
      console.log('✅ Successfully completed data fetch:', {
        dashboardAnalytics: dashboardResult.status === 'fulfilled',
        transactions: transactionsResult.status === 'fulfilled' ? transactionsResult.value?.length : 0,
        products: productsResult.status === 'fulfilled' ? productsResult.value?.length : 0,
        inventory: inventoryResult.status === 'fulfilled' ? inventoryResult.value?.length : 0,
        branches: branchesResult.status === 'fulfilled' ? branchesResult.value?.length : 0,
        categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value?.length : 0,
        salesChart: salesChartResult.status === 'fulfilled' && salesChartResult.value,
        inventoryAlerts: inventoryAlertsResult.status === 'fulfilled' && inventoryAlertsResult.value
      });

      // Show success message if we got data
      const hasData = dashboardResult.status === 'fulfilled' || 
                     transactionsResult.status === 'fulfilled' || 
                     productsResult.status === 'fulfilled';
      
      if (hasData) {
        toast({
          title: "Data Loaded",
          description: `Successfully loaded reporting data from dashboard analytics`,
          duration: 3000
        });
      }

    } catch (error) {
      console.error('❌ Error in fetchAllData:', error);
      setError(error.message || 'Failed to fetch data');
      
      toast({
        title: "Error",
        description: 'Failed to load data: ' + (error.message || 'Unknown error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [loading, fetchReportsData, fetchTransactions, fetchProducts, fetchInventory, fetchBranches, fetchCategories, fetchSalesChartData, fetchInventoryAlerts]);

  // Generate comprehensive reports using proper API endpoints
  const generateReports = useCallback(async (startDate, endDate, branchId = null, reportType = 'all') => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Generating reports:', { startDate, endDate, branchId, reportType });

      const params = {
        startDate,
        endDate,
        branchId
      };

      // Use the proper reports API endpoints
      const data = await fetchReportsData(params);
      console.log('📈 Using reports API data:', data);

      // Generate combined reports based on the data
      const reports = {};

      if (reportType === 'all' || reportType === 'sales') {
        reports.sales = {
          summary: data.salesPerformance || {},
          topProducts: data.topSellingProducts || [],
          slowMovingProducts: data.slowMovingProducts || [],
          salesByCategory: data.salesByCategory || [],
          cashierPerformance: data.cashierPerformance || []
        };
      }

      if (reportType === 'all' || reportType === 'inventory') {
        reports.inventory = {
          summary: data.inventoryStats || {},
          alerts: data.lowStockAlerts || []
        };
      }

      if (reportType === 'all' || reportType === 'transactions') {
        reports.transactions = {
          recent: [] // This would need a separate endpoint based on documentation
        };
      }

      setReportsData(reports);
      console.log('✅ Reports generated successfully:', reports);

      return reports;

    } catch (error) {
      console.error('❌ Error generating reports:', error);
      setError(error.message);
      toast?.({
        title: "Error",
        description: "Failed to generate reports. Please try again.",
        variant: "destructive"
      });
      
      // Fallback to legacy methods if reports API fails
      try {
        console.log('🔄 Attempting fallback to legacy methods...');
        
        const [salesData, inventoryData] = await Promise.allSettled([
          fetchSalesChartData(startDate, endDate, branchId),
          fetchInventoryAlerts()
        ]);

        const fallbackReports = {};
        if (reportType === 'all' || reportType === 'sales') {
          fallbackReports.sales = {
            summary: salesData.status === 'fulfilled' ? salesData.value : {},
            topProducts: [],
            slowMovingProducts: [],
            salesByCategory: [],
            cashierPerformance: []
          };
        }

        if (reportType === 'all' || reportType === 'inventory') {
          fallbackReports.inventory = {
            summary: {},
            alerts: inventoryData.status === 'fulfilled' ? inventoryData.value : []
          };
        }

        setReportsData(fallbackReports);
        console.log('✅ Fallback reports generated:', fallbackReports);
        return fallbackReports;

      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, [fetchReportsData, fetchSalesChartData, fetchInventoryAlerts, toast]);
  
  return {
    // Data from dashboard analytics
    dashboardData,
    salesChartData,
    inventoryAlerts,
    
    // Traditional data
    transactions,
    products,
    inventory,
    branches,
    categories,
    
    // States
    loading,
    error,
    lastFetch,
    
    // Functions
    fetchAllData,
    clearCache,
    isCached: (key) => isCached(key),
    
    // Reports data and functions
    reportsData,
    fetchReportsData,
    generateReports,
    
    // Dashboard specific functions  
    fetchSalesChartData,
    fetchInventoryAlerts,
    
    // Individual fetch functions
    fetchTransactions,
    fetchProducts,
    fetchInventory,
    fetchBranches,
    fetchCategories
  };
};

export default useReportingData;