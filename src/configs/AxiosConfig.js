import { CLIENT_ID, CLIENT_SECRET } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LOCALHOST_IP } from '../utils/localhost';

//Axios instance configuration
const axiosInstance = axios.create({
    baseURL: LOCALHOST_IP
});

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

    // Nếu lỗi là 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) throw new Error('No refresh token');

        // Gửi request để lấy token mới
        const tokenResponse = await axios.post(`${LOCALHOST_IP}/Api/access_token`, {
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
        });

        const newAccessToken = tokenResponse.data.access_token;
        const newRefreshToken = tokenResponse.data.refresh_token;

        // Lưu lại
        await AsyncStorage.setItem('token', newAccessToken || '');
        await AsyncStorage.setItem('refreshToken', newRefreshToken || '');

        // Gắn access token mới vào request gốc
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Gửi lại request gốc
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        // Xử lý logout tại đây nếu cần
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

