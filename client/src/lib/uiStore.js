import { create } from 'zustand';








export const useUiStore = create((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open })
}));