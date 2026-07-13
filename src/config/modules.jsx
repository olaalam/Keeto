import { icon, popup } from "leaflet";
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
  TicketPercent,
  BadgePercent,
  FileText,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import keetoImage from "../../public/WhatsApp Image 2026-05-18 at 11.27.30 AM.jpeg";

const KeetoIcon = (props) => (
  <img
    src={keetoImage}
    alt="Keeto"
    className={`object-contain rounded-sm ${props.className || "w-5 h-5"}`}
  />
);
export const modules = [
  {
    name: "Dashboard",
    key: "dashboard",
    icon: LayoutDashboard,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        module: "basiccampaign",
      },
    ],
  },
  {
    name: "Management",
    key: "management",
    icon: UserCog,
    items: [
      { title: "Admins", url: "/admins", icon: UserCog, module: "Admins" },
      {
        title: "Permissions",
        url: "/permissions",
        icon: ShieldCheck,
        module: "Roles",
      },
      { title: "Keeto Users", url: "/users", icon: KeetoIcon, module: "Users" },
      { title: "Policy", url: "/policy", icon: FileText, module: "policy" },
      {
        title: "Reasons",
        url: "/reasons",
        icon: HelpCircle,
        module: "Reasons",
      },
      { title: "Sales", url: "/sales", icon: TrendingUp, module: "Admins" },
    ],
  },
  {
    name: "Location",
    key: "location",
    icon: MapPin,
    items: [
      {
        title: "Countries",
        url: "/countries",
        icon: Globe,
        module: "Countries",
      },
      { title: "Cities", url: "/cities", icon: MapPin, module: "Cities" },
      { title: "Zones", url: "/zones", icon: Map, module: "Zones" },
      {
        title: "Delivery Zones",
        url: "/delivery-zones",
        icon: Truck,
        module: "ZoneDeliveryFees",
      },
      { title: "Branches", url: "/branches", icon: PlusSquare, module: "RestaurantBranches" },
    ],
  },
  {
    name: "Content",
    key: "content",
    icon: Utensils,
    items: [
      {
        title: "Categories",
        url: "/categories",
        icon: Layers,
        module: "Categories",
      },
      {
        title: "SubCategories",
        url: "/sub-categories",
        icon: Library,
        module: "Subcategories",
      },
      {
        title: "Restaurants",
        url: "/restaurants",
        icon: Utensils,
        module: "Restaurants",
      },
      { title: "Foods", url: "/foods", icon: Beef, module: "Food" },
      {
        title: "Cuisines",
        url: "/cuisines",
        icon: ChefHat,
        module: "cuisines",
      },
      { title: "Modifier", url: "/addons", icon: Settings2, module: "Adones" },

      {
        title: "Addon Categories",
        url: "/addons-categories",
        icon: PlusSquare,
        module: "AdonesCategories",
      },
    ],
  },
  {
    name: "Reports",
    key: "business",
    icon: FileBarChart,
    items: [
      {
        title: "Business Plans",
        url: "/business-plans",
        icon: Briefcase,
        module: "BusninessPlan",
      },
      {
        title: "Restaurants Report",
        url: "/restaurants-report",
        icon: FileBarChart,
        module: "reports",
      },
      {
        title: "Financial report",
        url: "/financial-report",
        icon: FileBarChart,
        module: "reports",
      },
      {
        title: "Payment Methods",
        url: "/payment-methods",
        icon: Wallet,
        module: "RestaurantWallets",
      },
      {
        title: "MyKeeto Report",
        url: "/mykeeto",
        icon: KeetoIcon,
        module: "reports",
      },
    ],
  },
  {
    name: "Marketing",
    key: "marketing",
    icon: BadgePercent,
    items: [
      {
        title: "Discounts",
        url: "/discounts",
        icon: BadgePercent,
        module: "Discounts",
      },
      {
        title: "Coupons",
        url: "/coupons",
        icon: TicketPercent,
        module: "Coupons",
      },
      { title: "Popup", url: "/popup", icon: Layers, module: "popup" },
    ],
  },
];
