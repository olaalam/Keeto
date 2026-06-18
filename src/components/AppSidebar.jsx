import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import useSidebarStore from "@/store/useSidebarStore";
import useAuthStore from "@/store/useAuthStore";
import { hasModulePermission } from "@/lib/permissions";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, HelpCircle, Home } from "lucide-react"; // استيراد الأيقونات الأساسية فقط

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const activeModule = useSidebarStore((s) => s.activeModule);
  const user = useAuthStore((s) => s.user);
  //const setLogout = useAuthStore((state) => state.setLogout);
  const navigate = useNavigate();

  // فلترة items بناءً على permissions اليوزر
  const permittedItems = activeModule?.items?.filter((item) =>
    hasModulePermission(user, item.module)
  ) || [];

  // إذا لم يكن هناك موديول نشط، لا تظهر الـ Sidebar
  if (!activeModule) return null;

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex justify-center py-5">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className={`w-full justify-start gap-3 transition-all duration-200 ${
            !open ? "px-0 justify-center" : "px-3"
          }`}
          title="Back to home"
        >
          <Home size={18} className="shrink-0" />
          {open && <span className="text-sm font-medium">Back to home</span>}
        </Button>

        <h2 className="text-2xl font-black text-primary">
          {/* عرض الاسم كاملاً أو الحرف الأول بناءً على حالة الفتح[cite: 1] */}
          {open ? activeModule.name : activeModule.name?.[0] || ""}
        </h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {permittedItems.map((item) => {
                const active = location.pathname === item.url;

                // هنا نتعامل مع item.icon كـ Component مباشرة وليس كـ string[cite: 1]
                const IconComponent = item.icon;

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
                        {/* رندر الأيقونة مباشرة[cite: 1] */}
                        {IconComponent ? (
                          <IconComponent size={20} />
                        ) : (
                          <HelpCircle size={20} />
                        )}

                        {open && (
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                        )}

                        {active && open && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-white/80" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {/*  <SidebarMenuButton
              asChild
              tooltip="Home"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="w-full">
                <Button
                  onClick={() => navigate("/")}
                  className={`w-full ${!open ? "px-2 justify-center" : ""}`}
                >
                  <Home size={18} />

                  {open && <span className="ml-2">Back to home</span>}
                </Button>
              </div>
            </SidebarMenuButton> */}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
