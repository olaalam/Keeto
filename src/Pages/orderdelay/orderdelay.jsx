import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // ⚠️ تأكدي إن الكومبوننت ده موجود عندك بنفس المسار
import { useUpdate } from "@/hooks/useUpdate"; // تأكدي من تغيير المسار لمكان الـ hook الصح عندك

// 🔽 زرار "View" بيفتح Dialog فيه قائمة العناصر (إيميلات أو مطاعم)
// list: مصفوفة العناصر، renderItem: دالة اختيارية لتنسيق كل عنصر (افتراضياً بيطبع العنصر زي ما هو)
function ViewListButton({ label, items = [], renderItem, emptyLabel = "No items" }) {
  const count = items.length;

  if (count === 0) {
    return <span className="text-slate-400 text-xs">---</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          View ({count})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {count === 0 ? (
            <p className="text-sm text-slate-400">{emptyLabel}</p>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                className="text-sm py-1.5 px-1 border-b last:border-b-0 border-slate-100"
              >
                {renderItem ? renderItem(item) : item}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrderDelayAlerts() {
  const navigate = useNavigate();

  // جلب البيانات
  const { data: orderDelayAlerts = [], isLoading } = useQuery({
    queryKey: ["order-delay-alerts"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/order-delay-alerts");
      return res.data.data.data;
    },
  });

  // 🔽 تحديث حالة isActive مباشرة من الجدول (بره صفحة الإضافة/التعديل)
  // GenericDataTable عندها Switch جاهز بس بيشتغل بس مع عمود اسمه "status"
  // وبيبعت { status: newStatus } - وده مش بيطابق اسم الحقل عندنا (isActive)
  // فبنعمل Switch مخصص هنا وبنستخدم نفس الـ hook (useUpdate) اللي بتستخدمه AddPage
  const updateStatusMutation = useUpdate(
    "/api/superadmin/order-delay-alerts",
    "order-delay-alerts",
  );

  // دالة مساعدة لتنسيق الوقت والتاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // دالة مساعدة لعرض عدد/قائمة العناصر بشكل مختصر
  const formatList = (arr) => {
    if (!arr || arr.length === 0) return "---";
    return arr.join(", ");
  };

  const columns = [
    { accessorKey: "name", header: "Name" },

    // البريد الإلكتروني لأعضاء المجموعة
    {
      accessorKey: "emails",
      header: "Emails",
      cell: ({ row }) => (
        <ViewListButton
          label="Emails"
          items={row.getValue("emails") || []}
        />
      ),
    },

    // الفروع
   /*  {
      accessorKey: "allBranches",
      header: "All Branches",
      cell: ({ row }) => (row.getValue("allBranches") ? "Yes" : "No"),
    },
    {
      accessorKey: "branches",
      header: "Branches",
      cell: ({ row }) => {
        const branches = row.getValue("branches") || [];
        return branches.length > 0
          ? branches.map((b) => b.name || b.nameAr).join(", ")
          : "---";
      },
    }, */

    // المطاعم
    {
      accessorKey: "allRestaurants",
      header: "All Restaurants",
      cell: ({ row }) => (row.getValue("allRestaurants") ? "Yes" : "No"),
    },
    {
      accessorKey: "restaurants",
      header: "Restaurants",
      cell: ({ row }) => (
        <ViewListButton
          label="Restaurants"
          items={row.getValue("restaurants") || []}
          renderItem={(r) => (
            <div className="flex items-center gap-2">
              {r.logo && (
                <img
                  src={r.logo}
                  alt={r.name}
                  className="w-6 h-6 rounded object-cover shrink-0"
                />
              )}
              <span>{r.nameAr || r.name}</span>
            </div>
          )}
        />
      ),
    },

    // إعدادات التأخير
    { accessorKey: "maxDelayMinutes", header: "Max Delay (min)" },
    {
      accessorKey: "orderStatus",
      header: "Order Status",
      cell: ({ row }) => formatList(row.getValue("orderStatus")),
    },

    // التواريخ
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => formatDate(row.getValue("updatedAt")),
    },

    // حالة التفعيل - Switch مخصص بيبعت isActive على /order-delay-alerts/{id}
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => {
        const isActive = !!row.getValue("isActive");
        const rowId = row.original.id;

        return (
          <Switch
            checked={isActive}
            disabled={updateStatusMutation.isPending}
            onCheckedChange={(checked) => {
              updateStatusMutation.mutate({
                id: rowId,
                payload: { isActive: checked },
              });
            }}
          />
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Order Delay Alerts"
        columns={columns}
        data={orderDelayAlerts}
        isLoading={isLoading}
        queryKey="order-delay-alerts"
        deleteApiUrl="/api/superadmin/order-delay-alerts"
        editApiUrl="/api/superadmin/order-delay-alerts"
        onAdd={() => navigate("/order-delay/add")}
        onEdit={(alert) => navigate(`/order-delay/edit/${alert.id}`)}
      />
    </div>
  );
}