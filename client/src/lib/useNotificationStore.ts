import { create } from 'zustand';

const READ_KEY = 'messops_read_notifications';
const DELETED_KEY = 'messops_deleted_notifications';

function getStoredArray(key: string): string[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStoredArray(key: string, items: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

interface NotificationStoreState {
  readIds: string[];
  deletedIds: string[];
  markAsRead: (id: string) => void;
  markAllAsRead: (ids: string[]) => void;
  deleteNotification: (id: string) => void;
  clearAll: (ids: string[]) => void;
  isRead: (id: string) => boolean;
  isDeleted: (id: string) => boolean;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  readIds: getStoredArray(READ_KEY),
  deletedIds: getStoredArray(DELETED_KEY),

  markAsRead: (id: string) => {
    const current = get().readIds;
    if (!current.includes(id)) {
      const next = [...current, id];
      setStoredArray(READ_KEY, next);
      set({ readIds: next });
    }
  },

  markAllAsRead: (ids: string[]) => {
    const current = get().readIds;
    const nextSet = new Set([...current, ...ids]);
    const next = Array.from(nextSet);
    setStoredArray(READ_KEY, next);
    set({ readIds: next });
  },

  deleteNotification: (id: string) => {
    const current = get().deletedIds;
    if (!current.includes(id)) {
      const next = [...current, id];
      setStoredArray(DELETED_KEY, next);
      set({ deletedIds: next });
    }
  },

  clearAll: (ids: string[]) => {
    const current = get().deletedIds;
    const nextSet = new Set([...current, ...ids]);
    const next = Array.from(nextSet);
    setStoredArray(DELETED_KEY, next);
    set({ deletedIds: next });
  },

  isRead: (id: string) => get().readIds.includes(id),
  isDeleted: (id: string) => get().deletedIds.includes(id),
}));
