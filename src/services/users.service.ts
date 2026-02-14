// services/users.service.ts
import axios from '../lib/axios';
import { type Customer, type PaginatedResponse, type FilterOptions } from '../types';

export const usersService = {
  getCustomers: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Customer>>('/accounts/me/', { 
      params: { ...filters, role: 'consumer' } 
    });
    return data;
  },

  getCustomer: async (id: string) => {
    const { data } = await axios.get<Customer>(`/accounts/me/`);
    return data;
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>) => {
    const { data } = await axios.put(`/accounts/me/`, customerData);
    return data;
  },

  blockCustomer: async (id: string, reason: string) => {
    const { data } = await axios.post(`/accounts/${id}/block/`, { reason });
    return data;
  },

  unblockCustomer: async (id: string) => {
    const { data } = await axios.post(`/accounts/${id}/unblock/`);
    return data;
  },
};