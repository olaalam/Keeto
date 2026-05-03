import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import useSidebarStore from "@/store/useSidebarStore"; // ✅ default import

export function AppSidebar() {
  const { open } = useSidebar(); // ✅ Shadcn hook
  const location = useLocation(); // ✅ for active link
  const activeModule = useSidebarStore((s) => s.activeModule); // ✅ Zustand

  if (!activeModule)
    return null; // ✅ safe

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex justify-center py-5">
        <h2 className="text-2xl font-black text-primary">
          {open ? activeModule.name : activeModule.name[0]} {/* ✅ safe */}
        </h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="space-y-1 px-2">
          {activeModule.items.map((item) => {
            const active = location.pathname === item.url; // ✅ works now

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <item.icon size={20} />
                    {open && (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                    {active && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
