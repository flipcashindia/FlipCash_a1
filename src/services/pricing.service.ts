// // services/pricing.service.ts
// import axios from '../lib/axios';
// import { type PricingRule, type PaginatedResponse, type FilterOptions } from '../types';

// export const pricingService = {
//   getRules: async (filters?: FilterOptions) => {
//     const { data } = await axios.get<PaginatedResponse<PricingRule>>('/pricing/rules/', { params: filters });
//     return data;
//   },

//   getRule: async (id: string) => {
//     const { data } = await axios.get<PricingRule>(`/pricing/rules/${id}/`);
//     return data;
//   },

//   createRule: async (ruleData: Partial<PricingRule>) => {
//     const { data } = await axios.post('/pricing/rules/', ruleData);
//     return data;
//   },

//   updateRule: async (id: string, ruleData: Partial<PricingRule>) => {
//     const { data } = await axios.patch(`/pricing/rules/${id}/`, ruleData);
//     return data;
//   },

//   deleteRule: async (id: string) => {
//     await axios.delete(`/pricing/rules/${id}/`);
//   },

//   calculatePrice: async (estimateData: any) => {
//     const { data } = await axios.post('/pricing/estimate/', estimateData);
//     return data;
//   },

//   simulatePrice: async (simulationData: any) => {
//     const { data } = await axios.post('/pricing/calculate-fees/', simulationData);
//     return data;
//   },
// };


import axios from '../lib/axios';

export interface PriceEstimatePayload {
  device_model: string;
  storage?: string;
  ram?: string;
  condition_inputs: Record<string, string>;
}

export const pricingService = {
  calculatePrice: async (payload: PriceEstimatePayload) => {
    const { data } = await axios.post('/pricing/estimate/', payload);
    return data;
  },

  getMyEstimates: async () => {
    const { data } = await axios.get('/pricing/my-estimates/');
    return data;
  },

  getEstimateDetail: async (id: string) => {
    const { data } = await axios.get(`/pricing/estimates/${id}/`);
    return data;
  },

  simulateFees: async (simulationData: { device_model: string; amount: number }) => {
    const { data } = await axios.post('/pricing/calculate-fees/', simulationData);
    return data;
  }
};