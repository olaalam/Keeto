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
  Coins,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

export default function DetailedFinancialReport() {
  // 1. Extract date filters and restaurant ID from URL
  const { startDate, endDate, id } = useParams();

  // 2. Fetch the detailed report data using useQuery
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["detailedFinancialReport", startDate, endDate, id],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/report/restaurant/${id}`, {
        params: {
          startDate,
          endDate,
        },
      });
      return res.data?.data?.data || res.data?.data;
    },
  });

  // المابينج الصحيح بناءً على الـ JSON الجديد
  const restaurantInfo = responseData?.restaurant;
  const breakdownBySource = responseData?.breakdownBySource || [];
  const overallSummary = responseData?.overallSummary;

  // 3. تحسين الكروت العلوية لتشمل 3 كروت متناسقة وشكلها احترافي
  const statsCards = [
    {
      title: "Overall Total Revenue",
      value: `${Number(overallSummary?.sales?.totalRevenue ?? 0).toLocaleString()} EGP`,
      icon: ShoppingBag,
      bgIcon: "bg-orange-50 text-orange-600 border border-orange-100",
    },
    {
      title: "Overall Total Orders",
      value: overallSummary?.totalOrders ?? 0,
      icon: Utensils,
      bgIcon: "bg-blue-50 text-blue-600 border border-blue-100",
    },
    {
      title: "Overall Net Balance",
      value: `${Number(overallSummary?.settlement?.netBalance ?? 0).toLocaleString()} EGP`,
      icon: Coins,
      bgIcon: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    },
  ];
  const exportPDF = () => {
    const doc = new jsPDF("landscape");

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 300, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(
      restaurantInfo?.name
        ? `${restaurantInfo.name} Financial Report`
        : "Restaurant Financial Report",
      14,
      16,
    );

    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 35);

    // Summary Cards
    const cards = [
      {
        title: "Revenue",
        value: `${Number(
          overallSummary?.sales?.totalRevenue ?? 0,
        ).toLocaleString()} EGP`,
      },
      {
        title: "Orders",
        value: overallSummary?.totalOrders ?? 0,
      },
      {
        title: "Net Balance",
        value: `${Number(
          overallSummary?.settlement?.netBalance ?? 0,
        ).toLocaleString()} EGP`,
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

    // Settlement Status
    if (overallSummary?.settlement?.actionRequired) {
      let action = overallSummary.settlement.actionRequired
        .replace("⚠️", "")
        .replace("✅", "")
        .replace(/\s+/g, " ")
        .trim();

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Status: ${action}`, 14, 80);
    }

    // Table
    autoTable(doc, {
      startY: 90,
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
        0: { cellWidth: 40 }, // Source
        1: { cellWidth: 20 }, // Orders
        2: { cellWidth: 28 }, // Revenue
        3: { cellWidth: 28 }, // Cash
        4: { cellWidth: 28 }, // Digital
        5: { cellWidth: 35 }, // Extra Fees
        6: { cellWidth: 28 }, // Commission
        7: { cellWidth: 30 }, // Net Balance
      },

      head: [
        [
          "Source",
          "Orders",
          "Revenue",
          "Cash",
          "Digital",
          "Extra Fees",
          "Commission",
          "Net Balance",
        ],
      ],

      body: breakdownBySource.map((item) => {
        const source = (item.source || "").replaceAll("_", " ").toUpperCase();

        const serviceFees = Number(
          item?.restaurantExtraEarnings?.totalServiceFees ?? 0,
        );

        const deliveryFees = Number(
          item?.restaurantExtraEarnings?.totalDeliveryFees ?? 0,
        );

        const net = Number(item?.settlement?.netBalance ?? 0);

        const owes = Number(item?.settlement?.restaurantOwesPlatform ?? 0);

        return [
          source,
          item.ordersCount ?? 0,
          `${Number(item?.sales?.totalRevenue ?? 0).toFixed(2)} EGP`,
          `${Number(item?.sales?.cashRevenue ?? 0).toFixed(2)} EGP`,
          `${Number(item?.sales?.digitalRevenue ?? 0).toFixed(2)} EGP`,
          `${(serviceFees + deliveryFees).toFixed(2)} EGP`,
          item.source === "pos" &&
          Number(item?.keetoDues?.appCommission ?? 0) === 0
            ? "-"
            : `${Number(item?.keetoDues?.appCommission ?? 0).toFixed(2)} EGP`,
          owes > 0 ? `-${owes.toFixed(2)} EGP` : `+${net.toFixed(2)} EGP`,
        ];
      }),
    });

    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      14,
      pageHeight - 10,
    );

    doc.save(`${restaurantInfo?.name || "Restaurant"}_Financial_Report.pdf`);
  };
  // 4. تعديل وتطوير الأعمدة بالـ Keys الصحيحة مع تحسين الفيجوالز
  const columns = [
    {
      accessorKey: "source",
      header: () => (
        <div className="text-left font-bold min-w-[130px]">Order Source</div>
      ),
      cell: ({ row }) => {
        const source = row.getValue("source") || "";
        // تحويل شكل اسم المصدر ليصبح مقروءاً بشكل أفضل (Format code to readable text)
        const formattedSource = source.toUpperCase().replace("_", " ");
        return (
          <div className="text-left">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border">
              {formattedSource}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "ordersCount",
      header: () => <div className="text-center font-bold">Total Orders</div>,
      cell: ({ row }) => (
        <div className="text-center font-bold font-mono text-slate-800">
          {row.getValue("ordersCount") ?? 0}
        </div>
      ),
    },
    {
      accessorKey: "sales.totalRevenue",
      header: () => <div className="text-right font-bold">Revenue</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-slate-700 font-mono">
          {Number(row.original?.sales?.totalRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.cashRevenue",
      header: () => <div className="text-right font-bold">Cash</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-emerald-600 font-mono">
          {Number(row.original?.sales?.cashRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.digitalRevenue",
      header: () => <div className="text-right font-bold">Digital / Visa</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-blue-600 font-mono">
          {Number(row.original?.sales?.digitalRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "restaurantExtraEarnings.totalServiceFees",
      header: () => (
        <div className="text-right font-bold">Extra Fees (Serv/Delv)</div>
      ),
      cell: ({ row }) => {
        const serv = Number(
          row.original?.restaurantExtraEarnings?.totalServiceFees ?? 0,
        ).toFixed(2);
        const delv = Number(
          row.original?.restaurantExtraEarnings?.totalDeliveryFees ?? 0,
        ).toFixed(2);
        return (
          <div className="text-right flex flex-col items-end">
            <span className="font-medium text-slate-700 font-mono text-xs">
              S: {serv} EGP
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              D: {delv} EGP
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "keetoDues.appCommission",
      header: () => <div className="text-right font-bold">App Commission</div>,
      cell: ({ row }) => {
        const commission = Number(row.original?.keetoDues?.appCommission ?? 0);
        const source = row.original?.source;

        return (
          <div className="text-right font-bold text-rose-600 font-mono">
            {source === "pos" && commission === 0
              ? "-"
              : `${commission.toFixed(2)} EGP`}
          </div>
        );
      },
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
  ];

  return (
    <div className="container mx-auto py-8 space-y-8 px-4">
      {/* اسم المطعم العلوي هيدر شيك جداً */}
      {restaurantInfo?.name && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Restaurant Profile
            </span>
            <h1 className="text-3xl font-black text-slate-800 mt-0.5">
              Financials for:{" "}
              <span className="text-orange-600 font-bold">
                {restaurantInfo.name}
              </span>
            </h1>
          </div>
          {overallSummary?.settlement?.actionRequired && (
            <div className="max-w-md">
              {overallSummary.settlement.actionRequired.includes("✅") ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> Settled Accounts
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                  <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />
                  {overallSummary.settlement.actionRequired
                    .replace("⚠️", "")
                    .trim()}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. عرض الـ 3 كروت المحدثة بنظام Grid متناسق */}
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Export PDF
        </button>
      </div>
      {/* 6. كارد الجدول مع كستمايزيشن ممتاز للحواف والنظافة العرضية */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <GenericDataTable
          title="Detailed Financial Report By Source"
          columns={columns}
          data={breakdownBySource}
          isLoading={isLoading}
          queryKey="detailedFinancialReport"
          onEdit={false}
          actions={false}
        />
      </div>
    </div>
  );
}
