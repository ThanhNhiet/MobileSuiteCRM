import { CLIENT_ID, CLIENT_SECRET } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LOCALHOST_IP } from '../utils/localhost';

// Axios instance configuration
const axiosInstance = axios.create({
    baseURL: LOCALHOST_IP
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add request interceptor
axiosInstance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    const isTokenEndpoint = config.url?.includes('/Api/access_token');

    if (!isTokenEndpoint && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const isTokenEndpoint = originalRequest.url?.includes('/Api/access_token');

    // Don't retry token endpoints
    if (isTokenEndpoint) {
      return Promise.reject(error);
    }

    // Handle 401 errors with automatic token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Send request to get new token
        const tokenResponse = await axios.post(`${LOCALHOST_IP}/Api/access_token`, {
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
        });

        const newAccessToken = tokenResponse.data.access_token;
        const newRefreshToken = tokenResponse.data.refresh_token;

        if (!newAccessToken) {
          throw new Error('No access token received');
        }

        // Save new tokens
        await AsyncStorage.setItem('token', newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }

        // Process queued requests
        processQueue(null, newAccessToken);

        // Attach new access token to original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn('Refresh token failed:', refreshError);
        
        // Clear invalid tokens
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
        
        // Process queued requests with error
        processQueue(refreshError, null);
        
        // Return the original 401 error instead of refresh error
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;