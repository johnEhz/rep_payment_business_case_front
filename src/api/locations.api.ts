import apiClient from './apiClient';
import { Country, Department, City } from '../types';

export const locationsApi = {
  getCountries: () =>
    apiClient.get<Country[]>('/locations/countries').then((r) => r.data),

  getDepartments: (countryCode = 'CO') =>
    apiClient.get<Department[]>('/locations/departments', { params: { countryCode } }).then((r) => r.data),

  getCities: (departmentCode = 'ANT') =>
    apiClient.get<City[]>('/locations/cities', { params: { departmentCode } }).then((r) => r.data),
};
