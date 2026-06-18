import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ShoppingBag,
  Utensils,
  BadgeDollarSign,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

export default function DetailedFinancialReport() {
  // 1. Extract date filters from URL if available
  const { startDate, endDate } = useParams();

  // 2. Fetch the detailed report data using useQuery
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["detailedFinancialReport", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report/detailed", {
        params: {
          startDate,
          endDate,
        },
      });
      return res.data?.data?.data || res.data?.data;
    },
  });

  // Safe extraction based on new API shape
  const summary = responseData?.summary;
  const restaurantsList = responseData?.restaurants || [];
  const exportPDF = () => {
    const doc = new jsPDF("landscape");

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 300, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Detailed Financial Report", 14, 16);

    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 35);

    // Summary Cards
    const cards = [
      {
        title: "System Sales",
        value: `${Number(
          summary?.grandTotalSystemSales ?? 0,
        ).toLocaleString()} EGP`,
      },
      {
        title: "Commission",
        value: `${Number(
          summary?.grandTotalKeetoCommission ?? 0,
        ).toLocaleString()} EGP`,
      },
      {
        title: "Restaurants",
        value: summary?.totalRestaurantsActive ?? 0,
      },
    ];

    let x = 14;

    cards.forEach((card) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, 45, 80, 25, 3, 3, "F");

      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.text(card.title, x + 4, 53);

      doc.setTextColor(30);
      doc.setFontSize(14);
      doc.text(String(card.value), x + 4, 64);

      x += 90;
    });

    // Main Table
    autoTable(doc, {
      startY: 85,
      theme: "grid",

      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },

      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [51, 65, 85],
        valign: "middle",
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },

      styles: {
        overflow: "linebreak",
      },

      columnStyles: {
        0: { cellWidth: 45 }, // Restaurant
        1: { cellWidth: 15 }, // Orders
        2: { cellWidth: 15 }, // Cash
        3: { cellWidth: 15 }, // Digital
        4: { cellWidth: 30 }, // Revenue
        5: { cellWidth: 30 }, // Commission
        6: { cellWidth: 30 }, // Net Balance
        7: { cellWidth: 80 }, // Status
      },

      head: [
        [
          "Restaurant",
          "Orders",
          "Cash",
          "Digital",
          "Revenue",
          "Commission",
          "Net Balance",
          "Status",
        ],
      ],

      body: restaurantsList.map((restaurant) => {
        const net = Number(restaurant?.settlement?.netBalance ?? 0);

        const owes = Number(
          restaurant?.settlement?.restaurantOwesPlatform ?? 0,
        );

        let action = restaurant?.settlement?.actionRequired || "";

        // تنظيف النص
        action = action
          .replace("⚠️", "")
          .replace("✅", "")
          .replace(/\s+/g, " ")
          .trim();

        return [
          restaurant.restaurantName,
          restaurant.ordersCount?.total ?? 0,
          restaurant.ordersCount?.cash ?? 0,
          restaurant.ordersCount?.digital ?? 0,
          `${Number(restaurant.sales?.totalRevenue ?? 0).toFixed(2)} EGP`,
          `${Number(restaurant.platformDues?.totalAppCommission ?? 0).toFixed(
            2,
          )} EGP`,
          owes > 0 ? `-${owes.toFixed(2)} EGP` : `+${net.toFixed(2)} EGP`,
          action,
        ];
      }),
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      14,
      pageHeight - 10,
    );

    doc.save(
      `Detailed_Financial_Report_${startDate || ""}_${endDate || ""}.pdf`,
    );
  };
  // 3. Updated Stats Cards with 3 metrics to fill the layout beautifully
  const statsCards = [
    {
      title: "Grand Total System Sales",
      value: `${Number(summary?.grandTotalSystemSales ?? 0).toLocaleString()} EGP`,
      icon: ShoppingBag,
      bgIcon: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    },
    {
      title: "Total Keeto Commission",
      value: `${Number(summary?.grandTotalKeetoCommission ?? 0).toLocaleString()} EGP`,
      icon: BadgeDollarSign,
      bgIcon: "bg-amber-50 text-amber-600 border border-amber-100",
    },
    {
      title: "Total Active Restaurants",
      value: summary?.totalRestaurantsActive ?? 0,
      icon: Utensils,
      bgIcon: "bg-blue-50 text-blue-600 border border-blue-100",
    },
  ];

  // 4. Refactored Columns to match exactly the incoming API structure
  const columns = [
    {
      accessorKey: "restaurantName",
      header: () => (
        <div className="text-left font-bold min-w-[140px]">Restaurant</div>
      ),
      cell: ({ row }) => (
        <div className="text-left font-semibold text-slate-900">
          {row.getValue("restaurantName")}
        </div>
      ),
    },
    {
      accessorKey: "ordersCount.total",
      header: () => <div className="text-center font-bold">Orders (C / D)</div>,
      cell: ({ row }) => {
        const total = row.original?.ordersCount?.total ?? 0;
        const cash = row.original?.ordersCount?.cash ?? 0;
        const digital = row.original?.ordersCount?.digital ?? 0;
        return (
          <div className="text-center flex flex-col justify-center items-center">
            <span className="font-bold text-slate-800 font-mono text-base">
              {total}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {cash} Cash | {digital} Dig
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "sales.totalRevenue",
      header: () => <div className="text-right font-bold">Total Revenue</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-slate-800 font-mono">
          {Number(row.original?.sales?.totalRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.cashInRestaurantDrawer",
      header: () => (
        <div className="text-right font-bold">Cash (In-Drawer)</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium text-emerald-600 font-mono">
          {Number(row.original?.sales?.cashInRestaurantDrawer ?? 0).toFixed(2)}{" "}
          EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.digitalInPlatformBank",
      header: () => (
        <div className="text-right font-bold">Digital (In-Bank)</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium text-blue-600 font-mono">
          {Number(row.original?.sales?.digitalInPlatformBank ?? 0).toFixed(2)}{" "}
          EGP
        </div>
      ),
    },
    {
      accessorKey: "platformDues.totalAppCommission",
      header: () => <div className="text-right font-bold">App Commission</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-rose-600 font-mono">
          {Number(row.original?.platformDues?.totalAppCommission ?? 0).toFixed(
            2,
          )}{" "}
          EGP
        </div>
      ),
    },
    {
      accessorKey: "settlement.netBalance",
      header: () => (
        <div className="text-right font-bold min-w-[130px]">Net Balance</div>
      ),
      cell: ({ row }) => {
        const net = Number(row.original?.settlement?.netBalance ?? 0);
        const owesPlatform = Number(
          row.original?.settlement?.restaurantOwesPlatform ?? 0,
        );

        if (net === 0 && owesPlatform === 0) {
          return (
            <div className="text-right text-slate-400 font-medium font-mono">
              0.00 EGP
            </div>
          );
        }

        // لو المنصة اللي هتحول للمطعم بيكون netBalance موجب، لو المطعم عليه فلوس بيظهر في owesPlatform
        return (
          <div
            className={`text-right font-bold font-mono ${owesPlatform > 0 ? "text-red-600" : "text-emerald-600"}`}
          >
            {owesPlatform > 0
              ? `-${owesPlatform.toFixed(2)}`
              : `+${net.toFixed(2)}`}{" "}
            EGP
          </div>
        );
      },
    },
    {
      accessorKey: "settlement.actionRequired",
      header: () => (
        <div className="text-left font-bold min-w-[280px] pl-4">
          Status & Action Required
        </div>
      ),
      cell: ({ row }) => {
        const action = row.original?.settlement?.actionRequired ?? "";
        const isSettled = action.includes("✅");

        return (
          <div className="pl-4 text-left">
            {isSettled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Settled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-sm whitespace-normal max-w-[320px]">
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {action.replace("⚠️", "").trim()}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8 px-4">
      {/* 5. Enhanced Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex items-center justify-between transition-all hover:shadow-md"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </p>
                <h2 className="text-2xl font-black text-slate-800 font-mono">
                  {card.value}
                </h2>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgIcon}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end p-4">
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Export PDF
        </button>
      </div>
      {/* 6. Main Table View wrapped in a styled container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <GenericDataTable
          title="Detailed Financial Report"
          columns={columns}
          data={restaurantsList}
          isLoading={isLoading}
          queryKey="detailedFinancialReport"
          onEdit={false}
          actions={false}
        />
      </div>
    </div>
  );
}
