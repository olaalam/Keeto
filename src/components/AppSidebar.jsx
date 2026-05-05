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
import useSidebarStore from "@/store/useSidebarStore";
import * as LucideIcons from "lucide-react"; // استيراد كافة الأيقونات كـ Object

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const activeModule = useSidebarStore((s) => s.activeModule);

  // إذا لم يكن هناك موديول نشط (مثلاً في صفحة Home)، لا تظهر الـ Sidebar
  if (!activeModule) return null;

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex justify-center py-5">
        <h2 className="text-2xl font-black text-primary">
          {/* تأمين الوصول للاسم في حالة الـ Refresh */}
          {open ? activeModule.name : (activeModule.name ? activeModule.name[0] : "")}
        </h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="space-y-1 px-2">
          {activeModule.items.map((item) => {
            const active = location.pathname === item.url;

            // الحصول على الـ Component الخاص بالأيقونة من الاسم المخزن
            // لو item.icon = "Users"، سيقوم بإرجاع <Users />
            const IconComponent = LucideIcons[item.icon];

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${active
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {/* رندر الأيقونة فقط إذا تم العثور عليها */}
                    {IconComponent ? (
                      <IconComponent size={20} />
                    ) : (
                      <LucideIcons.HelpCircle size={20} /> // أيقونة افتراضية في حال الخطأ
                    )}

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