'use client';

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const useStockData = () => {
  const [stocksResponse, setStocksResponse] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get headers
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Fetch stocks data
  const fetchStocks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getHeaders();
      
      // Default parameters for stocks API
      const stockParams = {
        page: params.page || 1,
        limit: params.limit || 1000,
        include_stock: true,
        ...params
      };

      console.log('🔍 Fetching stocks with params:', stockParams);
      
      const response = await axios.get('/api/stocks', { 
        headers, 
        params: stockParams 
      });

      if (response.data?.success && response.data?.data?.products) {
        const stocksData = response.data;
        setStocksResponse(stocksData);
        
        // Process products into stock items for valuation table
        const processedStockItems = processStockItems(stocksData.data.products);
        setStockItems(processedStockItems);
        
        console.log('✅ Stocks data loaded successfully:', {
          totalProducts: stocksData.data.products.length,
          totalStockItems: processedStockItems.length,
          pagination: stocksData.data.pagination
        });
        
        return stocksData;
      } else {
        throw new Error('Invalid response structure from stocks API');
      }
    } catch (error) {
      console.error('❌ Error fetching stocks:', error);
      setError(error.message);
      setStocksResponse(null);
      setStockItems([]);
      
      toast({
        title: "Error",
        description: "Failed to fetch stock data: " + error.message,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Process products from API into stock items for table display
  const processStockItems = useCallback((products) => {
    if (!Array.isArray(products)) {
      console.log('⚠️ Products is not an array:', products);
      return [];
    }

    const stockItems = [];

    products.forEach(product => {
      // Process each branch stock for the product
      if (product.stocksByBranch && Array.isArray(product.stocksByBranch)) {
        product.stocksByBranch.forEach(branchStock => {
          const quantity = parseInt(branchStock.quantity || 0);
          const minStock = product.minStock || 0;
          const isLowStock = quantity < minStock;
          
          console.log(`🔍 Stock check for ${product.name} (${branchStock.branchName}):`, {
            quantity,
            minStock,
            isLowStock: isLowStock,
            apiLowStock: branchStock.isLowStock
          });
          
          // Price estimation based on category
          let estimatedPrice = 10000; // Default price
          const categoryName = product.category?.name?.toLowerCase() || '';
          
          if (categoryName.includes('oli')) {
            estimatedPrice = 15000; // Oil products
          } else if (categoryName.includes('ban')) {
            estimatedPrice = 50000; // Tires
          } else if (categoryName.includes('sparepart')) {
            estimatedPrice = 25000; // Spare parts
          }

          stockItems.push({
            product_id: product.id,
            product_name: product.name || 'Unknown Product',
            sku: product.sku || '-',
            branch_id: branchStock.branchId,
            branch_name: branchStock.branchName || 'Unknown Branch',
            branch_code: branchStock.branchCode || '-',
            quantity: quantity,
            purchase_price: estimatedPrice,
            stock_value: estimatedPrice * quantity,
            category: product.category?.name || 'Unknown Category',
            brand: product.brand?.name || 'Unknown Brand',
            unit: product.unit || 'Pcs',
            minStock: product.minStock || 0,
            isLowStock: isLowStock,
            hasLowStock: product.hasLowStock || false,
            totalStock: product.totalStock || 0,
            mainImage: product.mainImage
          });
        });
      } else if (product.totalStock !== undefined) {
        // Fallback: use totalStock if no branch breakdown
        const quantity = parseInt(product.totalStock || 0);
        const minStock = product.minStock || 0;
        const isLowStock = quantity < minStock;
        
        console.log(`🔍 Stock check (fallback) for ${product.name}:`, {
          quantity,
          minStock,
          isLowStock: isLowStock
        });
        
        let estimatedPrice = 10000;
        const categoryName = product.category?.name?.toLowerCase() || '';
        
        if (categoryName.includes('oli')) {
          estimatedPrice = 15000;
        } else if (categoryName.includes('ban')) {
          estimatedPrice = 50000;
        } else if (categoryName.includes('sparepart')) {
          estimatedPrice = 25000;
        }

        stockItems.push({
          product_id: product.id,
          product_name: product.name || 'Unknown Product',
          sku: product.sku || '-',
          branch_id: null,
          branch_name: 'All Branches',
          branch_code: 'ALL',
          quantity: quantity,
          purchase_price: estimatedPrice,
          stock_value: estimatedPrice * quantity,
          category: product.category?.name || 'Unknown Category',
          brand: product.brand?.name || 'Unknown Brand',
          unit: product.unit || 'Pcs',
          minStock: product.minStock || 0,
          isLowStock: isLowStock,
          hasLowStock: product.hasLowStock || false,
          totalStock: product.totalStock || 0,
          mainImage: product.mainImage
        });
      }
    });

    // Sort by stock value (highest first)
    return stockItems.sort((a, b) => b.stock_value - a.stock_value);
  }, []);

  // Get stock summary statistics
  const getStockSummary = useCallback(() => {
    if (!stockItems || stockItems.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        uniqueProducts: 0,
        branchCount: 0
      };
    }

    const totalValue = stockItems.reduce((sum, item) => sum + item.stock_value, 0);
    const lowStockCount = stockItems.filter(item => item.isLowStock).length;
    const uniqueProducts = new Set(stockItems.map(item => item.product_id)).size;
    const branchCount = new Set(stockItems.map(item => item.branch_code)).size;

    return {
      totalItems: stockItems.length,
      totalValue,
      lowStockCount,
      uniqueProducts,
      branchCount
    };
  }, [stockItems]);

  // Filter stock items
  const filterStockItems = useCallback((filters = {}) => {
    if (!stockItems || stockItems.length === 0) return [];

    return stockItems.filter(item => {
      // Filter by branch
      if (filters.branchId && filters.branchId !== 'all') {
        if (item.branch_id !== filters.branchId) return false;
      }

      // Filter by category
      if (filters.categoryId && filters.categoryId !== 'all') {
        // Would need category ID mapping, for now use category name
        if (!item.category.toLowerCase().includes(filters.categoryId.toLowerCase())) return false;
      }

      // Filter by low stock only
      if (filters.lowStockOnly) {
        if (!item.isLowStock) return false;
      }

      // Filter by minimum stock value
      if (filters.minStockValue) {
        if (item.stock_value < filters.minStockValue) return false;
      }

      return true;
    });
  }, [stockItems]);

  return {
    // Data
    stocksResponse,
    stockItems,
    
    // States
    loading,
    error,
    
    // Functions
    fetchStocks,
    processStockItems,
    getStockSummary,
    filterStockItems,
    
    // Computed
    stockSummary: getStockSummary()
  };
};

export default useStockData;