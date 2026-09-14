import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGet } from "@/hooks/useGet";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Star,
  ShoppingCart,
  CreditCard,
  User,
} from "lucide-react";

// Colors used for the "Orders by Restaurant" dots, cycled per restaurant
const RESTAURANT_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ec4899",
];

// Colors for the Web / Application donut + legend
const SOURCE_COLORS = {
  web: "#3b82f6",
  application: "#8b5cf6",
};

// Order statuses coming back from the API, mapped to badge styles
const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-indigo-100 text-indigo-700",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value) {
  const num = Number(value || 0);
  return `EGP ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// API returns sources as "online_order_web" / "online_order_app"
function isAppSource(source) {
  return (source || "").toLowerCase().includes("app");
}

function sourceLabel(source) {
  return isAppSource(source) ? "Application" : "Web";
}

function SourceBadge({ source }) {
  const isApp = isAppSource(source);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        isApp ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
      }`}
    >
      {sourceLabel(source)}
    </span>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-600";
  const label = (status || "—").replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style}`}
    >
      {label}
    </span>
  );
}

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    isError,
  } = useGet("user-stats", `/api/superadmin/keeto-users/${id}/stats`);

  // API shape: { success, data: { message, data: { user, stats, ... } } }
  const payload =
    response?.data?.data?.data ||
    response?.data?.data ||
    response?.data ||
    response;
  const user = payload?.user;
  const stats = payload?.stats || {
    points: 0,
    totalOrders: 0,
    totalSpendings: "0.00",
  };
  const orderSourceBreakdown = payload?.orderSourceBreakdown || [];
  const restaurants = payload?.restaurants || [];
  const recentOrders = payload?.recentOrders || [];

  const webCount =
    orderSourceBreakdown.find((s) => !isAppSource(s.source))?.count || 0;
  const appCount =
    orderSourceBreakdown.find((s) => isAppSource(s.source))?.count || 0;
  const totalSourceOrders = webCount + appCount;

  const donutData = [
    { name: "Web", value: webCount, color: SOURCE_COLORS.web },
    { name: "Application", value: appCount, color: SOURCE_COLORS.application },
  ];

  const restaurantNames = restaurants.map((r) => r.name).filter(Boolean);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto animate-pulse space-y-5">
          <div className="h-7 w-52 bg-gray-200 rounded" />
          <div className="h-28 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-24 bg-gray-200 rounded-2xl" />
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-8">
        <p className="text-sm text-red-600">
          Couldn't load this customer's profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Customer Profile
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400" />
            Joined: {formatDate(user.createdAt)}
          </div>
        </div>

        {/* User card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center overflow-hidden shrink-0">
              {user.photo && user.photo !== "NULL" && user.photo !== "null" ? (
                <img
                  src={
                    user.photo.startsWith("http")
                      ? user.photo
                      : `https://keetobcknd.keeto.org/${user.photo}`
                  }
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-indigo-500" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">
                {user.name}
              </p>
              <div className="flex flex-col gap-1 mt-1.5 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {user.phone || "—"}
                </span>
                {user.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {user.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                user.status === "active"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  user.status === "active" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {user.status === "active"
                ? "Active Customer"
                : "Blocked Customer"}
            </span>
            <button type="button" className="text-gray-400 hover:text-gray-700">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Points</p>
              <p className="text-xl font-bold text-gray-900">
                {Number(stats.points || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalOrders || 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spendings</p>
              <p className="text-xl font-bold text-gray-900">
                {formatMoney(stats.totalSpendings)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="font-bold text-gray-900">Order Details</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.totalOrders || 0} orders
            {restaurantNames.length > 0 &&
              ` across ${restaurantNames.join(", ")}`}
          </p>

          <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-10">
                No orders yet for this customer.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="py-3 px-4 font-medium">Daily Order #</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Restaurant</th>
                      <th className="py-3 px-4 font-medium">Source</th>
                      <th className="py-3 px-4 font-medium">Type</th>
                      <th className="py-3 px-4 font-medium">Amount</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, idx) => (
                      <tr
                        key={order.orderNumber || idx}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {order.dailyOrderNumber || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {order.restaurant?.name || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <SourceBadge source={order.orderSource} />
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 capitalize">
                          {order.orderType || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {formatMoney(order.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bottom widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
          {/* Orders by Source */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="font-bold text-gray-900">Orders by Source</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Total orders split between Web and Application
            </p>

            {totalSourceOrders === 0 ? (
              <div className="text-center text-sm text-gray-400 py-16">
                No order data yet.
              </div>
            ) : (
              <div className="flex flex-col items-center mt-6">
                <div className="relative">
                  <PieChart width={220} height={220}>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={105}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">
                      {totalSourceOrders}
                    </span>
                    <span className="text-sm text-gray-500">orders</span>
                  </div>
                </div>

                <div className="flex items-center gap-8 mt-6">
                  {donutData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="font-semibold text-gray-900">
                        {d.name}
                      </span>
                      <span className="text-gray-500">
                        {d.value} ·{" "}
                        {totalSourceOrders
                          ? ((d.value / totalSourceOrders) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Orders by Restaurant */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="font-bold text-gray-900">Orders by Restaurant</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Orders and spend per restaurant
            </p>

            {restaurants.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-16">
                No restaurant data yet.
              </div>
            ) : (
              <div className="mt-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={restaurants}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 22, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fontSize: 11, fill: "#475569" }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value} order${value === 1 ? "" : "s"}`,
                        "Orders",
                      ]}
                    />
                    <Bar
                      dataKey="orderCount"
                      name="Orders"
                      radius={[0, 6, 6, 0]}
                      fill="#8b5cf6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
