import {
  LayoutDashboard,
  UserCog,
  Globe,
  MapPin,
  ShieldCheck,
  Map,
  Truck,
  Layers,
  Library,
  Beef,
  ChefHat,
  Utensils,
  Wallet,
  PlusSquare,
  Settings2,
Briefcase,
} from "lucide-react";

export const modules = [
  {
    name: "Dashboard",
    key: "dashboard",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    name: "Management",
    key: "management",
    items: [
      { title: "Admins", url: "/admins", icon: UserCog },
      { title: "Permissions", url: "/permissions", icon: ShieldCheck },
      { title: "Payment Methods", url: "/payment-methods", icon: Wallet },
    ],
  },
  {
    name: "Location",
    key: "location",
    items: [
      { title: "Countries", url: "/countries", icon: Globe },
      { title: "Cities", url: "/cities", icon: MapPin },
      { title: "Zones", url: "/zones", icon: Map },
      { title: "Delivery Zones", url: "/delivery-zones", icon: Truck },
    ],
  },
  {
    name: "Content",
    key: "content",
    items: [
      { title: "Categories", url: "/categories", icon: Layers },
      { title: "SubCategories", url: "/sub-categories", icon: Library },
      { title: "Restaurants", url: "/restaurants", icon: Utensils },
      { title: "Foods", url: "/foods", icon: Beef },
      { title: "Cuisines", url: "/cuisines", icon: ChefHat },
    ],
  },
    {
    name: "Business",
    key: "business",
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
