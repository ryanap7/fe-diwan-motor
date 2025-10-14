import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  console.error('Please set NEXT_PUBLIC_API_URL in your .env.local file');
  console.error('Example: NEXT_PUBLIC_API_URL=https://api.diwanmotor.com/api');
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
          if (response.data.accessToken) {
            const newAccessToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshToken;
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

// Authentication APIs berdasarkan DOCAPI/auth.md
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

// Users API berdasarkan DOCAPI/users.md
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
};

// Branches API berdasarkan DOCAPI/branch.md
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

// Products API berdasarkan DOCAPI/product.md
export const productsAPI = {
  async getAll(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async create(productData) {
    const response = await api.post('/products', productData);
    return response.data;
  },

  async update(id, productData) {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  async updateStatus(id, isActive) {
    const response = await api.patch(`/products/${id}/status`, { isActive });
    return response.data;
  },

  async addDiscount(id, discountData) {
    const response = await api.patch(`/products/${id}/discount`, discountData);
    return response.data;
  },

  async removeDiscount(id) {
    const response = await api.delete(`/products/${id}/discount`);
    return response.data;
  },

  async uploadImages(id, formData) {
    const response = await api.post(`/products/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteImage(id, imageUrl) {
    const response = await api.delete(`/products/${id}/images`, {
      data: { imageUrl }
    });
    return response.data;
  },

  async setMainImage(id, imageUrl) {
    const response = await api.patch(`/products/${id}/images/main`, { imageUrl });
    return response.data;
  },
};

// Categories API berdasarkan DOCAPI/category.md
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

  async updateStatus(id, isActive) {
    const response = await api.patch(`/categories/${id}/status`, { isActive });
    return response.data;
  },

  async delete(id, cascade = false) {
    const response = await api.delete(`/categories/${id}`, {
      params: { cascade }
    });
    return response.data;
  },
};

// Brands API berdasarkan DOCAPI/brand.md
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

  async updateStatus(id, isActive) {
    const response = await api.patch(`/brands/${id}/status`, { isActive });
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

// Customers API berdasarkan DOCAPI/customer.md
export const customersAPI = {
  async getAll(params = {}) {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/customers/${id}`);
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

  async updateStatus(id, isActive) {
    const response = await api.patch(`/customers/${id}/status`, { isActive });
    return response.data;
  },
};

// Suppliers API berdasarkan DOCAPI/supplier.md
export const suppliersAPI = {
  async getAll(params = {}) {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/suppliers/${id}`);
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

  async updateStatus(id, isActive) {
    const response = await api.patch(`/suppliers/${id}/status`, { isActive });
    return response.data;
  },
};

// Stock/Inventory API berdasarkan DOCAPI/inventory.md
export const stockAPI = {
  async getAll(params = {}) {
    const response = await api.get('/stocks', { params });
    return response.data;
  },

  async getByProduct(productId) {
    const response = await api.get(`/stocks/product/${productId}`);
    return response.data;
  },

  async transfer(transferData) {
    const response = await api.post('/stocks/transfer', transferData);
    return response.data;
  },

  async adjust(adjustData) {
    const response = await api.post('/stocks/adjust', adjustData);
    return response.data;
  },

  async getMovements(params = {}) {
    const response = await api.get('/stocks/movements', { params });
    return response.data;
  },
};

// Transactions API berdasarkan DOCAPI/transaction.md
export const transactionsAPI = {
  async getAll(params = {}) {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  async getByInvoice(invoiceNo) {
    const response = await api.get(`/transactions/invoice/${invoiceNo}`);
    return response.data;
  },

  async create(transactionData) {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  async updateStatus(id, statusData) {
    const response = await api.patch(`/transactions/${id}/status`, statusData);
    return response.data;
  },

  async getProductsForPOS(params = {}) {
    const response = await api.get('/transactions/products/pos', { params });
    return response.data;
  },

  async searchCustomerByPhone(phone) {
    const response = await api.get(`/transactions/customers/search`, { params: { phone } });
    return response.data;
  },

  async createQuickCustomer(customerData) {
    const response = await api.post('/transactions/customers/quick', customerData);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/transactions/stats/summary');
    return response.data;
  },
};

// Alias for inventory management (using stockAPI)
export const inventoryAPI = stockAPI;

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

// Development token utility function
export const setDevToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token);
      console.log('Dev token set for API testing:', token.substring(0, 20) + '...');
    } else {
      // Default development token if none provided
      const defaultToken = 'dev-token-default';
      localStorage.setItem('token', defaultToken);
      console.log('Default dev token set for API testing');
    }
  }
};

export default api;