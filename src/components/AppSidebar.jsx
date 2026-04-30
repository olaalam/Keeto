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
  Wallet,
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
  useSidebar,
} from "@/components/ui/sidebar";

import useAuthStore from "@/store/useAuthStore";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

const items = [
  {
    group: "Main",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Management",
    items: [
      { title: "Admins", url: "/admins", icon: UserCog },
      { title: "Permissions", url: "/permissions", icon: ShieldCheck },
      { title: "Payment Methods", url: "/payment-methods", icon: Wallet },
    ],
  },
  {
    group: "Location",
    items: [
      { title: "Countries", url: "/countries", icon: Globe },
      { title: "Cities", url: "/cities", icon: MapPin },
      { title: "Zones", url: "/zones", icon: Map },
      { title: "Delivery Zones", url: "/delivery-zones", icon: Truck },
    ],
  },
  {
    group: "Content",
    items: [
      { title: "Categories", url: "/categories", icon: Layers },
      { title: "SubCategories", url: "/sub-categories", icon: Library },
      { title: "Restaurants", url: "/restaurants", icon: Utensils },
      { title: "Foods", url: "/foods", icon: Beef },
      { title: "Cuisines", url: "/cuisines", icon: ChefHat },
    ],
  },
  {
    group: "Business",
    items: [
      {
        title: "Addon Categories",
        url: "/addons-categories",
        icon: PlusSquare,
      },
      { title: "Modifier", url: "/addons", icon: Settings2 },
      { title: "Business Plans", url: "/business-plans", icon: Briefcase },
    ],
  },
];

export function AppSidebar() {
  const setLogout = useAuthStore((state) => state.setLogout);
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      {/* HEADER */}
      <SidebarHeader className="flex items-center justify-center py-5">
        <h2 className="text-2xl font-black text-primary tracking-tight transition-all">
          {open ? "Keeto" : "K"}
        </h2>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className=" space-y-4">
        {items.map((group) => (
          <SidebarGroup key={group.group}>
            {open && (
              <p className="text-xs uppercase text-gray-400 px-3 mb-2 tracking-widest">
                {group.group}
              </p>
            )}

            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const active = location.pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          to={item.url}
                          className={clsx(
                            "flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200",
                            active
                              ? "bg-primary text-white shadow-md"
                              : "text-gray-600 hover:bg-gray-300",
                          )}
                        >
                          <item.icon size={20} />
                          {open && (
                            <span className="text-sm font-medium">
                              {item.title}
                            </span>
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
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <button
                onClick={setLogout}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={20} className="-ml-0.5" />
                {open && <span className="text-sm font-semibold">Logout</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
