import axios from 'axios';
import { logNgrokInfo } from './ngrok-utils';

// Configure axios defaults for all requests
const setupAxiosDefaults = () => {
  // Log ngrok configuration info
  if (typeof window !== 'undefined') {
    logNgrokInfo();
  }
  // Set default headers for all axios requests
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
  axios.defaults.headers.common['User-Agent'] = 'NextJS-Client/1.0';
  axios.defaults.timeout = 60000; // 60 seconds
  
  // Add request interceptor to all axios instances
  axios.interceptors.request.use(
    (config) => {
      // Ensure ngrok headers are always present
      config.headers['ngrok-skip-browser-warning'] = 'true';
      config.headers['User-Agent'] = 'NextJS-Client/1.0';
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle ngrok errors globally
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Log ngrok specific errors
      if (error.code === 'ERR_NGROK_6024' || error.message?.includes('ngrok')) {
        console.error('Ngrok Error:', {
          code: error.code,
          message: error.message,
          url: error.config?.url,
          timestamp: new Date().toISOString()
        });
      }
      
      return Promise.reject(error);
    }
  );
};

export default setupAxiosDefaults;