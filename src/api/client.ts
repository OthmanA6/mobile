import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use EXPO_PUBLIC_API_URL for dynamic configuration via .env file, fallback to localhost for web
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.171.240.68:5000/api'; // Update fallback to your actual IPv4 if not using .env

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
    }
    return Promise.reject(error);
  }
);

export default apiClient;
