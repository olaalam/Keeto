import { create } from "zustand";
import { persist } from "zustand/middleware";
import { modules } from "@/config/modules";

const useSidebarStore = create(
  persist(
    (set) => ({
      activeModule: null,
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: "sidebar-storage",
      partialize: (state) => ({
        activeModuleKey: state.activeModule?.key || null,
      }),
      merge: (persistedState, currentState) => {
        const key = persistedState?.activeModuleKey;
        const module = modules.find((m) => m.key === key) || null;
        return {
          ...currentState,
          activeModule: module,
        };
      },
    }
  )
);

export default useSidebarStore;