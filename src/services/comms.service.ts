// services/comms.service.ts
import axios from '../lib/axios';
import { type Notification, type FAQ, type Banner, type PaginatedResponse, type FilterOptions } from '../types';

export const commsService = {
  // Notifications
  getNotifications: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Notification>>('/comms/notifications/', { params: filters });
    return data;
  },

  createNotification: async (notificationData: Partial<Notification>) => {
    const { data } = await axios.post('/comms/notifications/', notificationData);
    return data;
  },

  sendNotification: async (id: string) => {
    const { data } = await axios.post(`/comms/notifications/${id}/send/`);
    return data;
  },

  // FAQs
  getFAQs: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<FAQ>>('/comms/faqs/', { params: filters });
    return data;
  },

  createFAQ: async (faqData: Partial<FAQ>) => {
    const { data } = await axios.post('/comms/faqs/', faqData);
    return data;
  },

  updateFAQ: async (id: string, faqData: Partial<FAQ>) => {
    const { data } = await axios.patch(`/comms/faqs/${id}/`, faqData);
    return data;
  },

  deleteFAQ: async (id: string) => {
    await axios.delete(`/comms/faqs/${id}/`);
  },

  // Banners
  getBanners: async (filters?: FilterOptions) => {
    const { data } = await axios.get<PaginatedResponse<Banner>>('/comms/banners/', { params: filters });
    return data;
  },

  createBanner: async (bannerData: FormData) => {
    const { data } = await axios.post('/comms/banners/', bannerData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateBanner: async (id: string, bannerData: FormData) => {
    const { data } = await axios.patch(`/comms/banners/${id}/`, bannerData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteBanner: async (id: string) => {
    await axios.delete(`/comms/banners/${id}/`);
  },
};