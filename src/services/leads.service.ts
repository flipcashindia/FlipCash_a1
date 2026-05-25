// services/leads.service.ts
import axios from '../lib/axios';
import { type Lead, type PaginatedResponse, type FilterOptions } from '../types';

export const leadsService = {
  getLeads: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Lead>>('/leads/', { params: filters });
    return data;
  },

  getLead: async (id: string) => {
    const { data } = await axios.get<Lead>(`/leads/${id}/`);
    return data;
  },

  updateLead: async (id: string, leadData: Partial<Lead>) => {
    const { data } = await axios.patch(`/leads/${id}/`, leadData);
    return data;
  },

  assignPartner: async (leadId: string, partnerId: string) => {
    const { data } = await axios.post(`/leads/${leadId}/assign/`, { partner_id: partnerId });
    return data;
  },

  cancelLead: async (leadId: string, reason: string) => {
    const { data } = await axios.post(`/leads/${leadId}/cancel/`, { reason });
    return data;
  },

  rescheduleLead: async (leadId: string, newDate: string) => {
    const { data } = await axios.post(`/leads/${leadId}/reschedule/`, { preferred_date: newDate });
    return data;
  },

  getLeadStatusHistory: async (leadId: string) => {
    const { data } = await axios.get(`/leads/${leadId}/status-history/`);
    return data;
  },

  getLeadStats: async () => {
    const { data } = await axios.get('/leads/stats/');
    return data;
  },
};