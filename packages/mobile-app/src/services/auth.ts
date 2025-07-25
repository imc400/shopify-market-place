import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

class AuthService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  }

  async getCurrentUser(token: string): Promise<User> {
    const response = await this.api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.user;
  }

  async refreshToken(token: string): Promise<string> {
    const response = await this.api.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.token;
  }
}

export const authService = new AuthService();