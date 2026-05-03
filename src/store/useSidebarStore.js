import { create } from "zustand";

const useSidebarStore = create((set) => ({
  activeModule: null,
  setActiveModule: (module) => set({ activeModule: module }),
}));

export default useSidebarStore;
