import apiClient from './client';

export const authService = {
  register: async (userData: any) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
  },
  verifyOTP: async (email: string, otp: string) => {
    const response = await apiClient.post('/register/verify', { email, otp });
    return response.data;
  },
  login: async (credentials: any) => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },
  getProfile: async () => {
    const response = await apiClient.get('/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const isFormData = data instanceof FormData;
    const response = await apiClient.put('/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },
};
