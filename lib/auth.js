import { authAPI } from './api';

// Utility functions for managing authentication cookies
export const setCookie = (name, value, days = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }
};

export const getCookie = (name) => {
  if (typeof document !== 'undefined') {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

export const deleteCookie = (name) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
  }
};

export const setAuthToken = (accessToken, refreshToken = null) => {
  localStorage.setItem('token', accessToken);
  setCookie('authToken', accessToken);
  
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
    setCookie('refreshToken', refreshToken, 30); // refresh token 30 days
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  deleteCookie('authToken');
  deleteCookie('refreshToken');
};

// Enhanced authentication utilities
export const auth = {
  // Login user
  async login(credentials) {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.accessToken) {
        // Store tokens
        setAuthToken(response.accessToken, response.refreshToken);
        
        // Get and store user profile
        try {
          const userProfile = await authAPI.getCurrentUser();
          if (userProfile) {
            localStorage.setItem('user', JSON.stringify(userProfile));
          }
          return { success: true, user: userProfile };
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          return { success: true, user: null };
        }
      }
      
      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  // Logout user
  async logout() {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      removeAuthToken();
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!getAuthToken();
  },

  // Get current user from localStorage
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Get current token
  getToken() {
    return getAuthToken();
  },

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      const response = await authAPI.refresh(refreshToken);
      
      if (response.accessToken) {
        setAuthToken(response.accessToken, response.refreshToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },

  // Check user role
  hasRole(requiredRole) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const roleHierarchy = {
      'ADMIN': 3,
      'BRANCH_MANAGER': 2,
      'CASHIER': 1
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  },

  // Check if user can access admin features
  isAdmin() {
    return this.hasRole('ADMIN');
  },

  // Check if user is branch manager or admin
  isBranchManager() {
    return this.hasRole('BRANCH_MANAGER');
  },

  // Initialize authentication state on app start
  async init() {
    if (!this.isAuthenticated()) return false;

    try {
      // Verify token is still valid by fetching user profile
      const userProfile = await authAPI.getCurrentUser();
      if (userProfile) {
        localStorage.setItem('user', JSON.stringify(userProfile));
        return true;
      }
    } catch (error) {
      console.error('Auth init failed:', error);
      // Clear invalid tokens
      this.logout();
    }
    
    return false;
  }
};