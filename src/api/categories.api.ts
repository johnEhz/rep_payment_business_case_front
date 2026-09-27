import apiClient from './apiClient';
import { Category, Brand } from '../types';

export const categoriesApi = {
  getAll: () => apiClient.get<Category[]>('/categories').then(r => r.data),
};

export const brandsApi = {
  getAll: () => apiClient.get<Brand[]>('/brands').then(r => r.data),
};
