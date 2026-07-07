import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

// Use EXPO_PUBLIC_API_URL for dynamic configuration via .env file, fallback to localhost for web
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.171.240.72:5000/api'; // Update fallback to your actual IPv4 if not using .env

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request Interceptor to add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for handling global errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., logout user)
      await AsyncStorage.removeItem('userToken');
      DeviceEventEmitter.emit('auth.unauthorized');
      
      // If the request was NOT the login endpoint, return a pending promise to 
      // swallow the error and prevent "Unhandled Promise Rejection" spam in Promise.all 
      // since the user is being redirected to the login screen anyway.
      if (error.config && error.config.url !== '/login') {
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
