// services/operations.service.ts
import axios from '../lib/axios';
import { type Dispute, type SupportTicket, type PaginatedResponse, type FilterOptions } from '../types';

export const operationsService = {
  // Disputes
  getDisputes: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Dispute>>('/ops/disputes/', { params: filters });
    return data;
  },

  getDispute: async (id: string) => {
    const { data } = await axios.get<Dispute>(`/ops/disputes/${id}/`);
    return data;
  },

  resolveDispute: async (id: string, resolution: string) => {
    const { data } = await axios.post(`/ops/disputes/${id}/resolve/`, { resolution });
    return data;
  },

  escalateDispute: async (id: string) => {
    const { data } = await axios.post(`/ops/disputes/${id}/escalate/`);
    return data;
  },

  // Support Tickets
  getTickets: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<SupportTicket>>('/ops/tickets/', { params: filters });
    return data;
  },

  getTicket: async (id: string) => {
    const { data } = await axios.get<SupportTicket>(`/ops/tickets/${id}/`);
    return data;
  },

  assignTicket: async (id: string, assigneeId: string) => {
    const { data } = await axios.post(`/ops/tickets/${id}/assign/`, { assigned_to: assigneeId });
    return data;
  },

  closeTicket: async (id: string, resolution: string) => {
    const { data } = await axios.post(`/ops/tickets/${id}/close/`, { resolution });
    return data;
  },

  addTicketMessage: async (id: string, message: string) => {
    const { data } = await axios.post(`/ops/tickets/${id}/messages/`, { message });
    return data;
  },
};