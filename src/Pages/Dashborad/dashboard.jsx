import { useState, useMemo } from "react";
import { useGet } from "../../hooks/useGet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";
import {
  Utensils,
  CheckCircle,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  Star,
  EyeOff,
  Zap,
  AlertTriangle,
} from "lucide-react";

// دالة مساعدة لتنسيق قيم العملات بالجنيه المصري
const formatCurrency = (val) => {
  const num = parseFloat(val);
  return isNaN(num)
    ? "0.00 EGP"
    : `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;
};

// الـ Label المخصص لداخل الـ Pie Chart (يظهر فقط للقيم الأكبر من صفر لمنع التداخل)
const CancellationLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percentage,
  value,
}) => {
  if (!value || value === 0) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#1e293b"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="700"
    >
      {`${percentage}%`}
    </text>
  );
};

// دالة مخصصة لتهذيب وقص أسماء المطاعم الطويلة
const renderCustomAxisTick = ({ x, y, payload }) => {
  const name = payload.value;
  const truncatedName = name.length > 12 ? `${name.substring(0, 10)}...` : name;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-10}
        y={4}
        dy={0}
        textAnchor="end"
        fill="#94a3b8"
        fontSize={12}
        fontWeight="500"
      >
        {truncatedName}
      </text>
    </g>
  );
};

// مكون الـ Gauge النصف دائري - يقرأ الآن القيم الحقيقية من الداتا
const PerformanceGauge = ({
  title,
  subTitle,
  value,
  targetText,
  percentage,
  color,
  maxVal,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-between border border-slate-100 shadow-sm min-h-[220px]">
      <div className="text-center w-full">
        <h4 className="text-base font-bold text-slate-700">{title}</h4>
        <p className="text-xs text-slate-400 mt-0.5">{subTitle}</p>
      </div>

      <div className="relative w-40 h-20 overflow-hidden flex items-end justify-center mt-4">
        <div className="w-40 h-40 rounded-full border-[14px] border-slate-100 absolute top-0 left-0"></div>
        <div
          className="w-40 h-40 rounded-full border-[14px] absolute top-0 left-0 border-b-transparent border-r-transparent transition-transform duration-500"
          style={{
            transform: `rotate(${(percentage > 100 ? 100 : percentage) * 1.8 - 45}deg)`,
            borderColor: color,
          }}
        ></div>

        <div className="absolute text-center bottom-1">
          <span
            className="text-2xl font-bold block tracking-tight"
            style={{ color: color }}
          >
            {value}
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
            {title.split(" ")[1] || title}
          </span>
        </div>
      </div>

      <div className="w-full flex justify-between px-4 text-[11px] text-slate-300 font-semibold mt-1">
        <span>0</span>
        <span>{maxVal}</span>
      </div>

      <div className="text-center mt-3">
        <p className="text-sm font-bold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 font-medium">{targetText}</p>
      </div>
    </div>
  );
};

export default function KeetoDashboard() {
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-12-31");
  const [appliedFrom, setAppliedFrom] = useState("2026-01-01");
  const [appliedTo, setAppliedTo] = useState("2026-12-31");
  const [filterMsg, setFilterMsg] = useState("");

  const {
    data: response,
    isLoading,
    isError,
  } = useGet("superadminDashboard", "/api/superadmin/report/dashboard", {
    from_date: appliedFrom,
    to_date: appliedTo,
  });

  const dashboardData = response?.data?.data || {};
  const cards = dashboardData.cards || {};
  const charts = dashboardData.charts || {};

  const [activeCity, setActiveCity] = useState("");

  // 1. معالجة وتجميع بيانات المدن والمناطق ديناميكياً
  const cityZonesData = useMemo(() => {
    const locations = charts.ordersByLocation || [];
    const grouped = {};

    locations.forEach((loc) => {
      const city = loc.city || "Other";
      if (!grouped[city]) {
        grouped[city] = { total: 0, items: [] };
      }
      grouped[city].items.push({ name: loc.zone, orders: loc.orders });
      grouped[city].total += loc.orders;
    });

    const result = {};
    Object.keys(grouped).forEach((city) => {
      const cityTotal = grouped[city].total;
      result[city] = {
        chart: grouped[city].items,
        cards: grouped[city].items.map((item) => ({
          name: item.name,
          count: item.orders.toLocaleString(),
          ratio:
            cityTotal > 0 ? Math.round((item.orders / cityTotal) * 100) : 0,
        })),
      };
    });

    const cities = Object.keys(result);
    if (cities.length > 0 && !activeCity) {
      setActiveCity(cities[0]);
    }

    return result;
  }, [charts.ordersByLocation, activeCity]);

  // 2. أعلى 5 مطاعم يتم استخراجها ديناميكياً من الـ ranking القادم في الـ Response
  const top5RestaurantsData = useMemo(() => {
    const matrix = charts.performanceMatrix || [];

    return [...matrix]
      .sort((a, b) => (b.orders || 0) - (a.orders || 0))
      .slice(0, 5)
      .map((item) => ({
        name: item.restaurantName,
        orders: item.orders,
      }));
  }, [charts.performanceMatrix]);
  // 2.2 أعلى 5 مطاعم من حيث الاستحواذ على المستخدمين (التعديل الجديد)
  const top5AcquisitionData = useMemo(() => {
    const matrix = charts.performanceMatrix || [];
    return [...matrix]
      .sort((a, b) => (b.customers || 0) - (a.customers || 0))
      .slice(0, 5)
      .map((item) => ({
        name: item.restaurantName || item.name,
        acquisition: item.customers || 0,
      }));
  }, [charts.performanceMatrix]);

  // 3. تجهيز بيانات الـ Segmentation من الـ Response
  const segmentationData = useMemo(() => {
    const seg = charts.restaurantSegmentation || {};
    const total =
      (seg.high || 0) +
      (seg.medium || 0) +
      (seg.low || 0) +
      (seg.inactive || 0);
    const rawData = [
      { name: "High Revenue", value: seg.high || 0, color: "#facc15" },
      { name: "Medium Revenue", value: seg.medium || 0, color: "#f97316" },
      { name: "Low Revenue", value: seg.low || 0, color: "#cbd5e1" },
      { name: "Inactive", value: seg.inactive || 0, color: "#94a3b8" },
    ];
    return rawData.map((item) => ({
      ...item,
      percentage:
        total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : "0%",
    }));
  }, [charts.restaurantSegmentation]);

  // 4. تجهيز بيانات الإلغاء
  const cancellationData = useMemo(() => {
    const cancel = charts.cancellationRate || {};
    const total =
      (cancel.user || 0) + (cancel.restaurant || 0) + (cancel.system || 0);
    const rawData = [
      { name: "Cancelled by User", value: cancel.user || 0, color: "#facc15" },

      {
        name: "Cancelled by Restaurant",
        value: cancel.system || 0,
        color: "#cbd5e1",
      },
    ];

    return rawData.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [charts.cancellationRate]);

  // 5. حسابات الـ Gauges بناءً على القيم الحقيقية للـ Response الحالي
  const gaugeMetrics = useMemo(() => {
    const totalOrders = cards.totalOrders || 0;
    const totalCustomers = cards.totalCustomers || 0;
    const totalRestaurants = cards.totalRestaurants || 0;
    const activeRestaurants = cards.activeRestaurants || 0;

    return {
      orders: {
        value: totalOrders,
        percentage: Math.min(Math.round((totalOrders / 200) * 100), 100),
        targetText: `${Math.min(Math.round((totalOrders / 200) * 100), 100)}% of month target`,
      },
      customers: {
        value: totalCustomers,
        percentage: Math.min(Math.round((totalCustomers / 100) * 100), 100),
        targetText: `${Math.min(Math.round((totalCustomers / 100) * 100), 100)}% of conversion`,
      },
      restaurants: {
        value: totalRestaurants,
        percentage:
          totalRestaurants > 0
            ? Math.round((activeRestaurants / totalRestaurants) * 100)
            : 0,
        targetText: `${activeRestaurants} active out of ${totalRestaurants}`,
      },
    };
  }, [cards]);

  // 6. تجهيز مصادر الطلبات
  const sourceData = useMemo(() => {
    const sources = charts.ordersBySource || [];
    const total = sources.reduce((acc, curr) => acc + (curr.orders || 0), 0);
    const colorMap = {
      online_order: { label: "Website", color: "#facc15" },
      food_aggregator: { label: "Restaurant App", color: "#f97316" },
      mykeeto: { label: "My Keeto", color: "#c084fc" },
    };

    return sources.map((item) => {
      const meta = colorMap[item.source] || {
        label: item.source,
        color: "#cbd5e1",
      };
      return {
        name: meta.label,
        value: item.orders,
        color: meta.color,
        percentage:
          total > 0 ? `${((item.orders / total) * 100).toFixed(1)}%` : "0%",
      };
    });
  }, [charts.ordersBySource]);

  const mainCards = [
    {
      title: "Total Restaurants",
      value: cards.totalRestaurants || 0,
      icon: Utensils,
    },
    {
      title: "Active Restaurants",
      value: cards.activeRestaurants || 0,
      icon: CheckCircle,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(cards.totalRevenue),
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: (cards.totalOrders || 0).toLocaleString(),
      icon: ShoppingBag,
    },
    {
      title: "Monthly Growth",
      value: `+ ${cards.monthlyGrowthPercentage || 0}%`,
      icon: TrendingUp,
    },
    {
      title: "Total Customers",
      value: (cards.totalCustomers || 0).toLocaleString(),
      icon: Users,
    },
  ];

  const handleApply = () => {
    if (fromDate > toDate) {
      setFilterMsg("⚠️ 'From' date must be before 'To' date.");
      return;
    }
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    const fmt = (d) =>
      new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    setFilterMsg(`Showing data from ${fmt(fromDate)} to ${fmt(toDate)}`);
  };

  const CustomMatrixTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white text-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 text-xs font-sans leading-relaxed">
          <p className="font-bold border-b border-slate-100 pb-1 mb-1 text-orange-600">
            {data.restaurantName}
          </p>
          <p>
            <span className="text-slate-400">Customers:</span> {data.customers}
          </p>
          <p>
            <span className="text-slate-400">Orders:</span> {data.orders}
          </p>
          <p>
            <span className="text-slate-400">Revenue:</span>{" "}
            {formatCurrency(data.revenue)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 font-sans font-semibold">
        🔄 Loading Dashboard Data...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-rose-500 font-sans font-semibold">
        ⚠️ Failed to load dashboard. Please try again later.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-700 p-6 font-sans">
      {/* BANNER */}
      <div className="bg-[#facc15] rounded-xl p-6 md:p-8 shadow-sm mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-950 tracking-tight">
          Restaurant Dashboard
        </h1>
        <p className="text-slate-900 font-medium text-sm mt-1">
          Overview of all restaurant performance
        </p>
      </div>

      {/* DATE RANGE FILTER */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold shrink-0">
            <Calendar className="text-[#facc15] w-5 h-5" />
            <span>Filter by Date Range</span>
          </div>

          <div className="flex flex-wrap items-end gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setFilterMsg("");
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15] text-slate-800 bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setFilterMsg("");
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15] text-slate-800 bg-white"
              />
            </div>

            <button
              onClick={handleApply}
              className="flex items-center gap-2 bg-[#facc15] hover:bg-[#eab308] text-slate-950 font-semibold text-sm px-5 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Filter className="w-4 h-4" />
              Apply Filter
            </button>
          </div>
        </div>
        {filterMsg && (
          <p
            className={`mt-3 text-xs font-medium ${filterMsg.startsWith("⚠️") ? "text-rose-500" : "text-emerald-600"}`}
          >
            {filterMsg}
          </p>
        )}
      </div>

      {/* PERFORMANCE GAUGES SECTION */}

      <div className="mb-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              Performance Gauges
            </h3>
            <p className="text-xs text-slate-400">
              Real-time metrics tracking vs platform capacity
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PerformanceGauge
              title="Total Orders"
              subTitle="Cumulative completed orders"
              value={gaugeMetrics.orders.value}
              targetText={gaugeMetrics.orders.targetText}
              percentage={gaugeMetrics.orders.percentage}
              color="#facc15"
              maxVal="200"
            />
            <PerformanceGauge
              title="Total Customers"
              subTitle="Registered user segments"
              value={gaugeMetrics.customers.value}
              targetText={gaugeMetrics.customers.targetText}
              percentage={gaugeMetrics.customers.percentage}
              color="#f97316"
              maxVal="100"
            />
            <PerformanceGauge
              title="Total Restaurants"
              subTitle="Onboarded brand locations"
              value={gaugeMetrics.restaurants.value}
              targetText={gaugeMetrics.restaurants.targetText}
              percentage={gaugeMetrics.restaurants.percentage}
              color="#a78bfa"
              maxVal="50"
            />
          </div>
        </div>
      </div>
      {/* FINANCIAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#fff1f2] border border-rose-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Payable to Restaurants
            </p>
            <h3 className="text-3xl font-bold text-[#e11d48] mt-1">
              {formatCurrency(cards.payableToRestaurant)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Amount owed to restaurant partners
            </p>
          </div>
          <div className="bg-[#f43f5e] p-3 rounded-xl text-white shadow-sm">
            <ArrowUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#f0fdf4] border border-emerald-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Receivable from Restaurants
            </p>
            <h3 className="text-3xl font-bold text-[#16a34a] mt-1">
              {formatCurrency(cards.receivableFromRestaurants)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Amount due from restaurant partners
            </p>
          </div>
          <div className="bg-[#10b981] p-3 rounded-xl text-white shadow-sm">
            <ArrowDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 6 OPERATIONAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {mainCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <div className="bg-[#facc15]/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                {card.title}
              </p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">
                {card.value}
              </h4>
            </div>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* التشارت السابق: TOP 5 RESTAURANTS BY REVENUE */}
        <div className="lg:col-span-12 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            Top Restaurants by Orders
          </h3>

          <p className="text-xs text-slate-400 mb-6">
            Restaurants ranked by completed orders
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={top5RestaurantsData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                tickLine={false}
                fontSize={12}
              />
              <YAxis stroke="#94a3b8" tickLine={false} fontSize={11} />
              <Tooltip formatter={(value) => [value, "Orders"]} />
              <Bar
                dataKey="orders"
                fill="#facc15"
                radius={[6, 6, 0, 0]}
                barSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* التعديل الجديد: TOP 5 RESTAURANTS BY USER ACQUISITION */}
        <div className="lg:col-span-12 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            Top 5 Restaurants by User Acquisition
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Number of users per restaurant (+100 base)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={top5AcquisitionData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                tickLine={false}
                fontSize={12}
              />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                fontSize={11}
                tickFormatter={(v) => `+${v}`}
              />
              <Tooltip formatter={(value) => [value, "Users Acquired"]} />
              <Bar
                dataKey="acquisition"
                fill="#facc15"
                radius={[6, 6, 0, 0]}
                barSize={45}
              >
                {top5AcquisitionData.map((entry, index) => {
                  const opacities = [1, 0.85, 0.75, 0.6, 0.45];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill="#facc15"
                      fillOpacity={opacities[index] || 0.5}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 1. Revenue Ranking */}
        <div className="lg:col-span-12 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            Restaurant Revenue Ranking
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Total revenue per restaurant
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              layout="vertical"
              data={charts.restaurantsRanking || []}
              margin={{ left: 30, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="#94a3b8"
                tickFormatter={(v) => `${v} EGP`}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                tickLine={false}
                width={120}
                tick={renderCustomAxisTick}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value.toLocaleString()} EGP`,
                  `Revenue (${props.payload.name})`,
                ]}
              />
              <Bar
                dataKey="revenue"
                fill="#facc15"
                radius={[0, 6, 6, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Revenue Trend */}
        <div className="lg:col-span-12 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            Platform Revenue Trend
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Monthly overall revenue timeline
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis
                stroke="#94a3b8"
                tickFormatter={(v) => `${parseFloat(v).toLocaleString()} EGP`}
              />
              <Tooltip
                formatter={(value) => [
                  `${parseFloat(value).toLocaleString()} EGP`,
                  "Revenue",
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#eab308"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Segmentation */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            Restaurant Segmentation
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Distribution by revenue tier
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={segmentationData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {segmentationData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm w-full sm:w-auto">
              {segmentationData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-8 border-b border-slate-100 pb-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-slate-600 font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-slate-400">
                    {item.value} • {item.percentage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Cancellation Rate */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800">
            Cancellation Profile
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Distribution of cancelled orders
          </p>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={cancellationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  dataKey="value"
                  labelLine={false}
                  label={<CancellationLabel />}
                >
                  {cancellationData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {cancellationData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-1.5"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {item.value} ({item.percentage}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Orders by Source */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Orders by Source</h3>
          <p className="text-xs text-slate-400 mb-4">Channels distribution</p>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={sourceData}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sourceData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm w-full sm:w-auto">
              {sourceData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-6 border-b border-slate-100 pb-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-slate-600 font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-slate-400">
                    {item.value} • {item.percentage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 8. Performance Matrix */}
        <div className="lg:col-span-12 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Restaurant Performance Matrix
              </h3>
              <p className="text-xs text-slate-400">
                X: Customers • Y: Orders • Bubble size: Revenue
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500 mt-1 sm:mt-0">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{" "}
                Stars
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-purple-400" /> Sleeping
                Giants
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-orange-500" /> Niche /
                High-Freq
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />{" "}
                Underperformers
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={350} minWidth={600}>
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              >
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="customers"
                  name="Customers"
                  stroke="#94a3b8"
                  domain={[0, "auto"]}
                />
                <YAxis
                  type="number"
                  dataKey="orders"
                  name="Orders"
                  stroke="#94a3b8"
                  domain={[0, "auto"]}
                />
                <ZAxis type="number" dataKey="revenue" range={[150, 900]} />
                <Tooltip
                  content={<CustomMatrixTooltip />}
                  cursor={{ strokeDasharray: "3 3" }}
                />

                <ReferenceLine x={2} stroke="#cbd5e1" strokeDasharray="4 4" />
                <ReferenceLine y={2} stroke="#cbd5e1" strokeDasharray="4 4" />

                <Scatter
                  data={charts.performanceMatrix || []}
                  fill="#f97316"
                  opacity={0.85}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 9. Orders by City & Zone */}
        {Object.keys(cityZonesData).length > 0 && (
          <div className="lg:col-span-12 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Orders by City & Zone
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distribution across geographic zones
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(cityZonesData).map((city) => (
                  <button
                    key={city}
                    onClick={() => setActiveCity(city)}
                    className={`px-5 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      activeCity === city
                        ? "bg-[#facc15] text-slate-950 border-[#facc15] shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {activeCity && cityZonesData[activeCity] && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={cityZonesData[activeCity].chart}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tickLine={false}
                        fontSize={11}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Bar
                        dataKey="orders"
                        fill="#facc15"
                        radius={[5, 5, 0, 0]}
                        barSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  {cityZonesData[activeCity].cards.map((zone, idx) => (
                    <div
                      key={idx}
                      className="bg-[#fffbeb] border border-amber-100 rounded-xl p-4"
                    >
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        {zone.name}
                      </p>
                      <h5 className="text-2xl font-bold text-slate-800 mb-2">
                        {zone.count}
                      </h5>
                      <div className="w-full bg-amber-100 h-1 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full bg-[#facc15]"
                          style={{ width: `${zone.ratio}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {zone.ratio}% of city
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
