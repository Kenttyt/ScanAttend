import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

const PH_TZ = 'Asia/Manila';

function getPHDate() {
  const now = new Date();
  const phDate = new Date(now.toLocaleString('en-US', { timeZone: PH_TZ }));
  return `${phDate.getFullYear()}-${String(phDate.getMonth() + 1).padStart(2, '0')}-${String(phDate.getDate()).padStart(2, '0')}`;
}

function getPHTimestamp() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  return parts.map(p => p.value).join('');
}

export const useAttendanceStore = create((set, get) => ({
  records: [],
  loading: false,

  fetchRecords: async (classId, date) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (date) params.set('date', date);
      const data = await apiClient(`/attendance?${params.toString()}`);
      set({ records: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markPresent: async (classId, studentId, markedBy) => {
    const data = await apiClient('/attendance', {
      method: 'POST',
      body: JSON.stringify({ classId, studentId, status: 'present', markedBy }),
    });
    set(state => {
      const existing = state.records.find(r => r.classId === classId && r.studentId === studentId && r.date === data.date);
      if (existing) {
        return { records: state.records.map(r => r.id === existing.id ? data : r) };
      }
      return { records: [...state.records, data] };
    });
    return false;
  },

  markAbsent: async (classId, studentId, markedBy) => {
    const data = await apiClient('/attendance', {
      method: 'POST',
      body: JSON.stringify({ classId, studentId, status: 'absent', markedBy }),
    });
    set(state => {
      const existing = state.records.find(r => r.classId === classId && r.studentId === studentId && r.date === data.date);
      if (existing) {
        return { records: state.records.map(r => r.id === existing.id ? data : r) };
      }
      return { records: [...state.records, data] };
    });
  },

  markLate: async (classId, studentId, markedBy) => {
    const data = await apiClient('/attendance', {
      method: 'POST',
      body: JSON.stringify({ classId, studentId, status: 'late', markedBy }),
    });
    set(state => {
      const existing = state.records.find(r => r.classId === classId && r.studentId === studentId && r.date === data.date);
      if (existing) {
        return { records: state.records.map(r => r.id === existing.id ? data : r) };
      }
      return { records: [...state.records, data] };
    });
  },
}));
