// services/auth.service.ts
import axios from '../lib/axios';
import { type AuthResponse, type LoginCredentials, type OTPVerification, type PasswordLogin } from '../types';

export const authService = {
  sendOTP: async (credentials: LoginCredentials) => {
    const { data } = await axios.post('/accounts/auth/otp/send/', credentials);
    return data;
  },

  verifyOTP: async (verification: OTPVerification) => {
    const { data } = await axios.post<AuthResponse>('/accounts/auth/otp/verify/', verification);
    return data;
  },

  passwordLogin: async (credentials: PasswordLogin) => {
    const { data } = await axios.post<AuthResponse>('/accounts/admin/auth/login/', credentials);
    return data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await axios.post('/accounts/auth/logout/', { refresh_token: refreshToken });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  refreshToken: async (refresh: string) => {
    const { data } = await axios.post('/accounts/auth/token/refresh/', { refresh });
    return data;
  },
};