import apiClient from './apiClient';
import { MerchantData } from '../types';

export const paymentsApi = {
  getMerchantData: () =>
    apiClient.get<MerchantData>('/payments/merchant').then(r => r.data),
};
