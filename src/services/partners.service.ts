// services/partners.service.ts
import axios from '../lib/axios';
import { type Partner, type PaginatedResponse, type FilterOptions } from '../types';

export const partnersService = {
  getPartners: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Partner>>('/partners/', { params: filters });
    return data;
  },

  getPartner: async (id: string) => {
    const { data } = await axios.get<Partner>(`/partners/${id}/`);
    return data;
  },

  updatePartner: async (id: string, partnerData: Partial<Partner>) => {
    const { data } = await axios.patch(`/partners/${id}/`, partnerData);
    return data;
  },

  approvePartner: async (id: string) => {
    const { data } = await axios.post(`/partners/${id}/approve/`);
    return data;
  },

  rejectPartner: async (id: string, reason: string) => {
    const { data } = await axios.post(`/partners/${id}/reject/`, { reason });
    return data;
  },

  suspendPartner: async (id: string, reason: string) => {
    const { data } = await axios.post(`/partners/${id}/suspend/`, { reason });
    return data;
  },

  activatePartner: async (id: string) => {
    const { data } = await axios.post(`/partners/${id}/activate/`);
    return data;
  },

  getPendingApprovals: async () => {
    const { data } = await axios.get<PaginatedResponse<Partner>>('/partners/', {
      params: { status: 'pending' },
    });
    return data;
  },
};