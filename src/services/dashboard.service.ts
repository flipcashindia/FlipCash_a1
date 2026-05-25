// services/dashboard.service.ts
import axios from '../lib/axios';
import { type DashboardStats } from '../types';

export const dashboardService = {
  getStats: async () => {
    const { data } = await axios.get<DashboardStats>('/ops/dashboard/');
    return data;
  },

  getLeadTrends: async (period: string = '7d') => {
    const { data } = await axios.get('/ops/reports/leads/', { 
      params: { period } 
    });
    return data;
  },

  getPartnerPerformance: async () => {
    const { data } = await axios.get('/ops/reports/partners/');
    return data;
  },

  getRevenueReport: async (dateFrom?: string, dateTo?: string) => {
    const { data } = await axios.get('/ops/reports/revenue/', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return data;
  },

  getCityWiseAnalytics: async () => {
    const { data } = await axios.get('/ops/analytics/city_wise/');
    return data;
  },

  getConversionFunnel: async () => {
    const { data } = await axios.get('/ops/analytics/conversion/');
    return data;
  },
};