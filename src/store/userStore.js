import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

export const useUserStore = create((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const data = await apiClient('/users');
      set({ users: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addUser: async (user) => {
    const data = await apiClient('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    set(state => ({ users: [...state.users, data] }));
    return data.id;
  },

  updateUser: async (id, updates) => {
    const data = await apiClient(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    set(state => ({
      users: state.users.map(u => u.id === id ? data : u),
    }));
    return data;
  },

  deleteUser: async (id) => {
    await apiClient(`/users/${id}`, { method: 'DELETE' });
    set(state => ({
      users: state.users.filter(u => u.id !== id),
    }));
  },

  getUserByEmail: (email) => {
    return get().users.find(u => u.email === email);
  },
}));
