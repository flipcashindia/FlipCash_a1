import axios from '../lib/axios';
import { type Dispute, type SupportTicket as Ticket, type PaginatedResponse, type FilterOptions } from '../types';
export const opsService = {
  // Disputes
  getDisputes: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Dispute>>('/ops/admin/disputes/', { params: filters });
    return data;
  },

  getDispute: async (id: string) => {
    const { data } = await axios.get<Dispute>(`/ops/admin/disputes/${id}/`);
    return data;
  },

  resolveDispute: async (id: string, resolution: string) => {
    const { data } = await axios.post(`/ops/admin/disputes/${id}/resolve/`, { resolution });
    return data;
  },

  assignDispute: async (id: string, assignedTo: string) => {
    const { data } = await axios.post(`/ops/admin/disputes/${id}/assign/`, { assigned_to: assignedTo });
    return data;
  },

  // Support Tickets
  getTickets: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Ticket>>('/ops/admin/tickets/', { params: filters });
    return data;
  },

  getTicket: async (id: string) => {
    const { data } = await axios.get<Ticket>(`/ops/admin/tickets/${id}/`);
    return data;
  },

  updateTicket: async (id: string, ticketData: Partial<Ticket>) => {
    const { data } = await axios.put(`/ops/admin/tickets/${id}/`, ticketData);
    return data;
  },

  closeTicket: async (id: string, resolution: string) => {
    const { data } = await axios.post(`/ops/admin/tickets/${id}/close/`, { resolution });
    return data;
  },

  assignTicket: async (id: string, assignedTo: string) => {
    const { data } = await axios.post(`/ops/admin/tickets/${id}/assign/`, { assigned_to: assignedTo });
    return data;
  },
};