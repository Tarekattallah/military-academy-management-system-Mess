import { create } from 'zustand';

const READ_KEY = 'messops_read_notifications';
const DELETED_KEY = 'messops_deleted_notifications';

function getStoredArray(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStoredArray(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}












export const useNotificationStore = create((set, get) => ({
  readIds: getStoredArray(READ_KEY),
  deletedIds: getStoredArray(DELETED_KEY),

  markAsRead: (id) => {
    const current = get().readIds;
    if (!current.includes(id)) {
      const next = [...current, id];
      setStoredArray(READ_KEY, next);
      set({ readIds: next });
    }
  },

  markAllAsRead: (ids) => {
    const current = get().readIds;
    const nextSet = new Set([...current, ...ids]);
    const next = Array.from(nextSet);
    setStoredArray(READ_KEY, next);
    set({ readIds: next });
  },

  deleteNotification: (id) => {
    const current = get().deletedIds;
    if (!current.includes(id)) {
      const next = [...current, id];
      setStoredArray(DELETED_KEY, next);
      set({ deletedIds: next });
    }
  },

  clearAll: (ids) => {
    const current = get().deletedIds;
    const nextSet = new Set([...current, ...ids]);
    const next = Array.from(nextSet);
    setStoredArray(DELETED_KEY, next);
    set({ deletedIds: next });
  },

  isRead: (id) => get().readIds.includes(id),
  isDeleted: (id) => get().deletedIds.includes(id)
}));