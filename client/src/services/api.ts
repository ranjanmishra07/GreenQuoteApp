import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { AuthResponse, Quote, QuoteListResponse, QuoteListParams, LoginRequest, User, CreateQuoteRequest } from '@/types';
import { config } from '@/config';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/users/login', credentials);
    return response.data;
  }


  async getProfile(): Promise<User> {
    const response: AxiosResponse<{ success: boolean; data: User }> = await this.api.get('/users/profile');
    return response.data.data;
  }

  // Quote endpoints
  async getQuotes(params: QuoteListParams = {}): Promise<QuoteListResponse> {
    const { page = 1, limit = 10, view, searchName, searchEmail } = params;
    
    const queryParams: any = { page, limit };
    if (view) queryParams.view = view;
    if (searchName) queryParams.searchName = searchName;
    if (searchEmail) queryParams.searchEmail = searchEmail;
    
    const response: AxiosResponse<QuoteListResponse> = await this.api.get('/quotes', {
      params: queryParams,
    });
    return response.data;
  }

  async getQuoteById(id: string): Promise<Quote> {
    const response: AxiosResponse<Quote> = await this.api.get(`/quotes/${id}`);
    return response.data;
  }

  async createQuote(quoteData: CreateQuoteRequest): Promise<Quote> {
    const response: AxiosResponse<Quote> = await this.api.post('/quotes', quoteData);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
