import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

export const useStudentStore = create((set, get) => ({
  students: [],
  loading: false,

  fetchStudents: async (classId) => {
    set({ loading: true });
    try {
      const params = classId ? `?classId=${classId}` : '';
      const data = await apiClient(`/students${params}`);
      set({ students: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addStudent: async (student) => {
    const data = await apiClient('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
    set(state => ({ students: [...state.students, data] }));
    return data.id;
  },

  removeStudent: async (id) => {
    await apiClient(`/students/${id}`, { method: 'DELETE' });
    set(state => ({ students: state.students.filter(s => s.id !== id) }));
  },

  updateStudent: async (id, updates) => {
    const data = await apiClient(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    set(state => ({
      students: state.students.map(s => s.id === id ? data : s),
    }));
  },

  getStudentsByClass: (classId) => {
    return get().students.filter(s => s.classId === classId);
  },
}));
