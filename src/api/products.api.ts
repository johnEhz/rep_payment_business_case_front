import apiClient from './apiClient';
import { Product, PaginatedProducts } from '../types';

export interface ProductsQueryFilters {
  categoryId?: string;
  brandId?: string;
  category?: string;
  brand?: string;
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export const productsApi = {
  getAll: (filters?: ProductsQueryFilters) =>
    apiClient.get<PaginatedProducts>('/products', { params: filters }).then((r) => r.data),

  getOne: (id: string) =>
    apiClient.get<Product>(`/products/${id}`).then((r) => r.data),
};
