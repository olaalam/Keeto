import { create } from "zustand";
import { persist } from "zustand/middleware"; // 1. استورد الـ persist

const useSidebarStore = create(
  persist(
    (set) => ({
      activeModule: null,
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: "sidebar-storage", // 2. الاسم اللي هيتحفظ بيه في الـ localStorage
    }
  )
);

export default useSidebarStore;