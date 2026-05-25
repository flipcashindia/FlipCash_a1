// services/accounts.service.ts
import axios from '../lib/axios';

export interface DeletionRequest {
  id: string;
  user: string;
  user_details: {
    id: string;
    full_name: string;
    mobile_number: string;
    email: string;
    role: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  processed_by_details: {
    id: string;
    full_name: string;
  } | null;
}

export interface DeletionRequestsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DeletionRequest[];
}

export const accountsService = {
  getDeletionRequests: async (params?: Record<string, any>) => {
    const { data } = await axios.get<DeletionRequestsResponse>(
      '/accounts/admin/deletion-requests/',
      { params }
    );
    return data;
  },

  approveDeletionRequest: async (id: string) => {
    const { data } = await axios.post(`/accounts/admin/deletion-requests/${id}/approve/`);
    return data;
  },

  rejectDeletionRequest: async (id: string, reason: string) => {
    const { data } = await axios.post(`/accounts/admin/deletion-requests/${id}/reject/`, { reason });
    return data;
  },
};
