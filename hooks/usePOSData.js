'use client';

import { useState, useEffect, useCallback } from 'react';
import { productsAPI, categoriesAPI, customersAPI, stockAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// Custom hook for optimized POS data loading
export const usePOSData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Check if user is cashier
  const isCashier = useCallback(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userRole = userData.role || userData.user_role;
      return userRole === 'CASHIER' || userRole === 'KASIR' || userRole === 'cashier';
    } catch {
      return false;
    }
  }, []);

  // Optimized product fetching with stock data
  const fetchProductsWithStock = useCallback(async () => {
    try {
      console.log('Fetching products with stock optimization...');
      
      // Fetch products first
      const productsResponse = await productsAPI.getAll();
      let productsData = [];
      
      if (productsResponse?.success && productsResponse.data?.products) {
        productsData = productsResponse.data.products;
      } else if (Array.isArray(productsResponse?.data)) {
        productsData = productsResponse.data;
      } else if (Array.isArray(productsResponse)) {
        productsData = productsResponse;
      }

      console.log('Products loaded:', productsData.length);

      // Try to fetch stock data
      try {
        const stockResponse = await stockAPI.getStockOverview();
        let stockData = [];
        
        if (stockResponse?.success && stockResponse.data?.products) {
          stockData = stockResponse.data.products;
        } else if (stockResponse?.success && Array.isArray(stockResponse.data)) {
          stockData = stockResponse.data;
        } else if (Array.isArray(stockResponse?.data)) {
          stockData = stockResponse.data;
        } else if (Array.isArray(stockResponse)) {
          stockData = stockResponse;
        }

        console.log('Stock data loaded:', stockData.length);

        // Merge products with stock data
        if (stockData.length > 0) {
          const stockMap = new Map();
          stockData.forEach(stock => {
            const productId = stock.productId || stock.id;
            if (productId) {
              stockMap.set(productId, {
                stock: stock.stock || stock.quantity || stock.available || stock.currentStock || stock.totalStock || 0,
                stockData: stock
              });
            }
          });

          productsData = productsData.map(product => {
            const stockInfo = stockMap.get(product.id);
            return {
              ...product,
              stock: stockInfo ? stockInfo.stock : 0,
              stockData: stockInfo ? stockInfo.stockData : null
            };
          });
        } else {
          // Set default stock if no stock data available
          productsData = productsData.map(product => ({
            ...product,
            stock: 0
          }));
        }

      } catch (stockError) {
        console.warn('Stock API error, setting default stock:', stockError);
        productsData = productsData.map(product => ({
          ...product,
          stock: 0
        }));
      }

      return productsData;
      
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll();
      
      if (response?.success && response.data?.categories) {
        return response.data.categories;
      } else if (Array.isArray(response?.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getAll();
      
      if (response?.success && response.data?.customers) {
        return response.data.customers;
      } else if (Array.isArray(response?.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }, []);

  // Load data with optimization for cashier
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No access token available. Please login first.");
      }

      const cashier = isCashier();
      console.log('Loading POS data - Is Cashier:', cashier);

      if (cashier) {
        // For cashier: Load products first (highest priority)
        console.log('Cashier mode: Loading products first...');
        const productsData = await fetchProductsWithStock();
        setProducts(productsData);
        
        console.log('Products loaded, now loading categories and customers...');
        // Load categories and customers in background
        const [categoriesData, customersData] = await Promise.all([
          fetchCategories(),
          fetchCustomers()
        ]);
        
        setCategories(categoriesData);
        setCustomers(customersData);
        
      } else {
        // For other roles: Load all data in parallel
        console.log('Non-cashier mode: Loading all data in parallel...');
        const [productsData, categoriesData, customersData] = await Promise.all([
          fetchProductsWithStock(),
          fetchCategories(),
          fetchCustomers()
        ]);
        
        setProducts(productsData);
        setCategories(categoriesData);
        setCustomers(customersData);
      }

      console.log('POS data loaded successfully');
      
    } catch (err) {
      console.error("Error loading POS data:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Gagal memuat data POS. " + err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchProductsWithStock, fetchCategories, fetchCustomers, isCashier]);

  // Auto-load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh function for manual reload
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    error,
    products,
    categories,
    customers,
    refresh,
    isCashier: isCashier()
  };
};

export default usePOSData;