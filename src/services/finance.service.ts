// services/finance.service.ts
import axios from '../lib/axios'; // ✅ FIXED: was '../types/api'
import { type PayoutRequest, type Transaction, type Wallet, type PaginatedResponse, type FilterOptions } from '../types';

export const financeService = {
  // Payouts
  getPayoutRequests: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<PayoutRequest>>('/finance/admin/payouts/', { params: filters });
    return data;
  },

  getPayoutRequest: async (id: string) => {
    const { data } = await axios.get<PayoutRequest>(`/finance/admin/payouts/${id}/`);
    return data;
  },

  approvePayoutRequest: async (id: string, remarks?: string) => {
    const { data } = await axios.post(`/finance/admin/payouts/${id}/approve/`, { remarks });
    return data;
  },

  rejectPayoutRequest: async (id: string, reason: string) => {
    const { data } = await axios.post(`/finance/admin/payouts/${id}/reject/`, { reason });
    return data;
  },

  // Transactions
  getTransactions: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Transaction>>('/finance/transactions/', { params: filters });
    return data;
  },

  getTransaction: async (id: string) => {
    const { data } = await axios.get<Transaction>(`/finance/transactions/${id}/`);
    return data;
  },

  // Wallet Management
  getWallet: async (userId: string) => {
    const { data } = await axios.get<Wallet>(`/finance/wallet/`, { 
      params: { user_id: userId } 
    });
    return data;
  },

  creditWallet: async (userId: string, amount: string, description: string) => {
    const { data } = await axios.post('/finance/wallet/credit/', {
      user_id: userId,
      amount,
      description,
    });
    return data;
  },

  debitWallet: async (userId: string, amount: string, description: string) => {
    const { data } = await axios.post('/finance/wallet/debit/', {
      user_id: userId,
      amount,
      description,
    });
    return data;
  },

  // Cashfree Integration
  initiatePayout: async (payoutData: any) => {
    const { data } = await axios.post('/finance/payouts/initiate/', payoutData);
    return data;
  },

  getPayoutStatus: async (transferId: string) => {
    const { data } = await axios.get(`/finance/payouts/status/${transferId}/`);
    return data;
  },
};