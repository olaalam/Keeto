import {
    LayoutDashboard,
    UserCog,
    Globe,
    MapPin,
    Map,
    Layers,
    Library,
    Utensils,
    PlusSquare,
    Settings2,
    Truck,
    Beef,
    ChefHat,
    Briefcase,
    ShieldCheck,
    LogOut,

} from "lucide-react";

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
import { Link } from "react-router-dom"

const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Admins", url: "/admins", icon: UserCog }, // تغيير من Users لـ UserCog (إدارة)
    { title: "Countries", url: "/countries", icon: Globe }, // أيقونة العالم للبلاد
    { title: "Cities", url: "/cities", icon: MapPin }, // دبوس الخريطة للمدن
    { title: "Zones", url: "/zones", icon: Map }, // خريطة للمناطق
    { title: "Categories", url: "/categories", icon: Layers }, // طبقات للتصنيفات
    { title: "SubCategories", url: "/sub-categories", icon: Library }, // مكتبة أو تفريعة
    { title: "Restaurants", url: "/restaurants", icon: Utensils }, // شوكة وسكينة (أنظف)
    { title: "Addon Categories", url: "/addons-categories", icon: PlusSquare }, // إضافة تصنيف
    { title: "Modifier", url: "/addons", icon: Settings2 }, // إعدادات الإضافات
    { title: "Delivery Zones", url: "/delivery-zones", icon: Truck }, // سيارة شحن للتوصيل
    { title: "Foods", url: "/foods", icon: Beef }, // أيقونة طعام (لحم/برجر)
    { title: "Cuisines", url: "/cuisines", icon: ChefHat }, // قبعة طباخ لأنواع المطبخ
    { title: "Business Plans", url: "/business-plans", icon: Briefcase }, // حقيبة عمل للخطط
    { title: "Permissions", url: "/permissions", icon: ShieldCheck }, // درع للصلاحيات
    { title: "Payment Methods", url: "/payment-methods", icon: ShieldCheck }, // درع للصلاحيات
];

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
                                        <Link to={item.url} className="flex items-center gap-3">
                                            <item.icon size={20} />
                                            {/* لو حابب تخفي الكتابة في حالة القفل وتظهر الـ Tooltip بس */}
                                            {open && <span>{item.title}</span>}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Logout"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <button
                                onClick={setLogout}
                                className="flex items-center w-full"
                            >
                                <LogOut size={20} className="shrink-0" />
                                {/* لن يظهر النص إلا إذا كان الـ Sidebar مفتوحاً، مما يمنع خروج الحرف عن الإطار */}
                                {open && <span className="ml-3 font-medium">Logout</span>}
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}