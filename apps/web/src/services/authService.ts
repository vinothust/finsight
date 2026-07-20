import { apiFetch } from '@/lib/api';
import type { User } from '@/types';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.user;
  },

  logout: async (): Promise<void> => {
    await apiFetch('/auth/logout', { method: 'POST' });
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiFetch<{ user: User }>('/auth/me');
    return response.user;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiFetch('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },
};
