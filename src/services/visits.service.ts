// services/visits.service.ts
import axios from '../lib/axios';
import { type FilterOptions, type VisitStatusLog, type VerificationChecklist } from '../types';

export const visitsService = {
  getVisits: async (params?: FilterOptions) => {
    // 🔴 OLD (Likely what you have):
    // const response = await axios.get('/visits/', { params }); 

    // 🟢 NEW (Fix): Append 'visits/' to reach the actual list
    // Based on your log, the data is at /visits/visits/
    const response = await axios.get('/visits/visits/', { params }); 
    return response.data;
  },

  getVisit: async (id: string) => {
    // Similarly, individual visits are likely at /visits/visits/:id/
    const response = await axios.get(`/visits/visits/${id}/`);
    return response.data;
  },

  getVisitTimeline: async (id: string): Promise<VisitStatusLog[]> => {
    const response = await axios.get(`/visits/visits/${id}/timeline/`);
    return response.data;
  },

  getVisitChecklist: async (id: string): Promise<VerificationChecklist[]> => {
    const response = await axios.get(`/visits/visits/${id}/checklist/`);
    return response.data;
  },

  // 5. Cancel Visit
  cancelVisit: async (id: string, reason: string) => {
    const response = await axios.post(`/visits/visits/${id}/cancel/`, { reason });
    return response.data;
  },

  // 6. Get Visit Tracking (if applicable)

  getVisitTracking: async (id: string) => {
    const { data } = await axios.get(`/visits/visits/${id}/tracking/`);
    return data;
  },
};