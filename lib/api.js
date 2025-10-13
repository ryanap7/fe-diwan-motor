import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  console.error('Please set NEXT_PUBLIC_API_URL in your .env.local file');
  console.error('Example: NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.dev/api');
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'NextJS-Frontend/1.0'
  },
});

// Add request interceptor to include auth token and ngrok headers
api.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Get token from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Always add ngrok bypass headers for direct API calls
    config.headers['ngrok-skip-browser-warning'] = 'true';
    config.headers['User-Agent'] = 'NextJS-Frontend/1.0';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and refresh token
api.interceptors.response.use(
  (response) => {
    // Log the response for debugging
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Response data:', response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors with retry
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Network timeout error:', error.message);
      if (!originalRequest._retryAttempt) {
        originalRequest._retryAttempt = true;
        // Wait 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          if (response.data.success && response.data.data) {
            const newAccessToken = response.data.data.accessToken;
            const newRefreshToken = response.data.data.refreshToken;
            localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            originalRequest.headers.authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // Clear tokens and redirect to login if refresh fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Authentication APIs berdasarkan API3.md
export const authAPI = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async refresh(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async logout(refreshToken) {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  async logoutAll(refreshToken) {
    const response = await api.post('/auth/logout-all', { refreshToken });
    return response.data;
  },
};

// Users API berdasarkan API3.md
export const usersAPI = {
  async getAll(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async create(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async update(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async changePassword(id, passwordData) {
    const response = await api.put(`/users/${id}/change-password`, passwordData);
    return response.data;
  },
};

// Branches API berdasarkan API3.md
export const branchesAPI = {
  async getAll(params = {}) {
    const response = await api.get('/branches', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },

  async create(branchData) {
    const response = await api.post('/branches', branchData);
    return response.data;
  },

  async update(id, branchData) {
    const response = await api.patch(`/branches/${id}`, branchData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  },

  async assignManager(id, userData) {
    const response = await api.post(`/branches/${id}/assign-manager`, userData);
    return response.data;
  },

  async assignCashier(id, userData) {
    const response = await api.post(`/branches/${id}/assign-cashier`, userData);
    return response.data;
  },

  async activate(id) {
    const response = await api.post(`/branches/${id}/activate`);
    return response.data;
  },

  async deactivate(id, reason) {
    const response = await api.post(`/branches/${id}/deactivate`, { reason });
    return response.data;
  },
};

// Roles API
export const rolesAPI = {
  async getAll() {
    const response = await api.get('/roles');
    return response.data;
  },

  async create(roleData) {
    const response = await api.post('/roles', roleData);
    return response.data;
  },

  async update(id, roleData) {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
};

// Products API (menggunakan /produk sesuai API2.md)
export const productsAPI = {
  async getAll(params = {}) {
    const response = await api.get('/produk', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/produk/${id}`);
    return response.data;
  },

  async create(productData) {
    const response = await api.post('/produk', productData);
    return response.data;
  },

  async update(id, productData) {
    const response = await api.put(`/produk/${id}`, productData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/produk/${id}`);
    return response.data;
  },

  async updateStock(id, stockData) {
    const response = await api.post(`/stok/${id}/tambah`, stockData);
    return response.data;
  },

  async reduceStock(id, stockData) {
    const response = await api.post(`/stok/${id}/kurang`, stockData);
    return response.data;
  },

  async getStock(id) {
    const response = await api.get(`/stok/${id}`);
    return response.data;
  },

  async getStockHistory(id) {
    const response = await api.get(`/stok/${id}/history`);
    return response.data;
  },
};

// Categories API berdasarkan API3_brancategory.md
export const categoriesAPI = {
  async getAll(params = {}) {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  async getRoots() {
    const response = await api.get('/categories/roots');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async create(categoryData) {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  async update(id, categoryData) {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  async updateStatus(id, statusData) {
    const response = await api.patch(`/categories/${id}/status`, statusData);
    return response.data;
  },

  async delete(id, cascade = false) {
    const response = await api.delete(`/categories/${id}`, {
      params: { cascade }
    });
    return response.data;
  },
};

// Brands API berdasarkan API3_brancategory.md
export const brandsAPI = {
  async getAll(params = {}) {
    const response = await api.get('/brands', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },

  async create(brandData) {
    const response = await api.post('/brands', brandData);
    return response.data;
  },

  async update(id, brandData) {
    const response = await api.put(`/brands/${id}`, brandData);
    return response.data;
  },

  async updateStatus(id, statusData) {
    const response = await api.patch(`/brands/${id}/status`, statusData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },
};

// Company API
export const companyAPI = {
  async getProfile() {
    const response = await api.get('/company');
    return response.data;
  },

  async updateProfile(companyData) {
    const response = await api.put('/company', companyData);
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  async getAll() {
    const response = await api.get('/customers');
    return response.data;
  },

  async create(customerData) {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  async update(id, customerData) {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  async toggleActive(id) {
    const response = await api.patch(`/customers/${id}/toggle`);
    return response.data;
  },
};

// Suppliers API
export const suppliersAPI = {
  async getAll() {
    const response = await api.get('/suppliers');
    return response.data;
  },

  async create(supplierData) {
    const response = await api.post('/suppliers', supplierData);
    return response.data;
  },

  async update(id, supplierData) {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },

  async toggleActive(id) {
    const response = await api.patch(`/suppliers/${id}/toggle`);
    return response.data;
  },
};

// Stock API (sesuai API2.md)
export const stockAPI = {
  async getAll(params = {}) {
    const response = await api.get('/stok', { params });
    return response.data;
  },

  async getByProduct(productId) {
    const response = await api.get(`/stok/${productId}`);
    return response.data;
  },

  async addStock(productId, stockData) {
    const response = await api.post(`/stok/${productId}/tambah`, stockData);
    return response.data;
  },

  async reduceStock(productId, stockData) {
    const response = await api.post(`/stok/${productId}/kurang`, stockData);
    return response.data;
  },

  async getHistory(productId) {
    const response = await api.get(`/stok/${productId}/history`);
    return response.data;
  },
};

// Transactions API (sesuai API2.md)
export const transactionsAPI = {
  async getAll(params = {}) {
    const response = await api.get('/transaksi', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/transaksi/${id}`);
    return response.data;
  },

  async create(transactionData) {
    const response = await api.post('/transaksi', transactionData);
    return response.data;
  },

  async update(id, transactionData) {
    const response = await api.put(`/transaksi/${id}`, transactionData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/transaksi/${id}`);
    return response.data;
  },
};

// Inventory API
export const inventoryAPI = {
  async getAll(params = {}) {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  async transfer(transferData) {
    const response = await api.post('/inventory/transfer', transferData);
    return response.data;
  },

  async adjustment(adjustmentData) {
    const response = await api.post('/inventory/adjustment', adjustmentData);
    return response.data;
  },

  async stockOpname(opnameData) {
    const response = await api.post('/inventory/opname', opnameData);
    return response.data;
  },
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  async getAll(params = {}) {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  async create(poData) {
    const response = await api.post('/purchase-orders', poData);
    return response.data;
  },

  async update(id, poData) {
    const response = await api.put(`/purchase-orders/${id}`, poData);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/purchase-orders/${id}/status`, { status });
    return response.data;
  },

  async receiveGoods(id, receiveData) {
    const response = await api.post(`/purchase-orders/${id}/receive`, receiveData);
    return response.data;
  },
};

// Activity Logs API
export const activityLogsAPI = {
  async getAll(params = {}) {
    const response = await api.get('/activity-logs', { params });
    return response.data;
  },

  async create(logData) {
    const response = await api.post('/activity-logs', logData);
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  async getSalesReport(params = {}) {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  async getInventoryReport(params = {}) {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  async getProfitLossReport(params = {}) {
    const response = await api.get('/reports/profit-loss', { params });
    return response.data;
  },

  async getTopProductsReport(params = {}) {
    const response = await api.get('/reports/top-products', { params });
    return response.data;
  },
};

export default api;