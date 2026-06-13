import { popup } from "leaflet";
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
  FileBarChart,
  BellRing,
  TicketPercent,
  BadgePercent,
} from "lucide-react";
import keetoImage from "../../public/WhatsApp Image 2026-05-18 at 11.27.30 AM.jpeg";
const KeetoIcon = (props) => (
  <img 
    src={keetoImage} 
    alt="Keeto" 
    className={`object-contain rounded-sm ${props.className || 'w-5 h-5'}`} 
  />
);
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
      { title: "Keeto Users", url: "/users", icon: KeetoIcon },
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
      { title: "Modifier", url: "/addons", icon: Settings2 },
      {
        title: "Addon Categories",
        url: "/addons-categories",
        icon: PlusSquare,
      },
      { title: "Popup", url: "/popup", icon: Layers },
      {title: "Policy", url: "/policy", icon: BellRing},
    ],
  },
  {
    name: "Business",
    key: "business",
    items: [
      { title: "Business Plans", url: "/business-plans", icon: Briefcase },
      {
        title: "Financial report",
        url: "/financial-report",
        icon: FileBarChart,
      },
      { title: "Payment Methods", url: "/payment-methods", icon: Wallet },
      { title: "MyKeeto Report", url: "/mykeeto", icon: KeetoIcon },
    ],
  },
  {
    name: "Marketing",
    key: "marketing",
    items: [
      { title: "Discounts", url: "/discounts", icon: BadgePercent },
      { title: "Coupons", url: "/coupons", icon: TicketPercent },
    ],
  },
];
