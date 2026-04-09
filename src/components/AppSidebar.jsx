import {
    LayoutDashboard,
    Users,
    UtensilsCrossed,
    Settings,
    LogOut,
} from "lucide-react"

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
    useSidebar, // 1. لازم تستورد الـ Hook ده
} from "@/components/ui/sidebar"
import useAuthStore from "@/store/useAuthStore"

const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Admins", url: "/admins", icon: Users },
    { title: "Restaurants", url: "/restaurants", icon: UtensilsCrossed },
    { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
    const setLogout = useAuthStore((state) => state.setLogout);

    // 2. لازم تعرف المتغير open من الـ Hook هنا
    const { open } = useSidebar();

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="flex items-center justify-center p-4">
                {/* الآن open ستعمل بشكل صحيح */}
                {open ? (
                    <h2 className="text-2xl font-black text-primary transition-all">Keeto</h2>
                ) : (
                    <h2 className="text-2xl font-black text-primary transition-all">K</h2>
                )}
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url} className="flex items-center gap-3">
                                            <item.icon size={20} />
                                            {/* لو حابب تخفي الكتابة في حالة القفل وتظهر الـ Tooltip بس */}
                                            {open && <span>{item.title}</span>}
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="flex items-center justify-center p-4">
                <button
                    onClick={setLogout}
                    className="flex items-center gap-3 md:px-3 md:py-2 sm:px-1 sm:py-1 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors w-full"
                >
                    <LogOut size={20} />
                    {open ? (
                        <span>Logout</span>
                    ) : (
                        <span className="text-2xl font-black text-primary transition-all">L</span>
                    )}
                </button>
            </SidebarFooter>
        </Sidebar>
    )
}