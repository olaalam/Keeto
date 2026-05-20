import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch"; // تأكدي من مسار الـ Switch في مشروعك
import { useUpdate } from "@/hooks/useUpdate"; // تأكدي من تغيير المسار لمكان الـ hook الصح عندك

export default function Popup() {
  const navigate = useNavigate();

  // جلب البيانات
  const { data: popup = [], isLoading } = useQuery({
    queryKey: ["popup"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/popup");
      return res.data.data.data;
    },
  });

  // استخدام الـ Custom Hook المخصص لتحديث الـ status
  // الـ API المطلوب: /api/superadmin/popup/:id/status
  const updateStatusMutation = useUpdate("/api/superadmin/popup", "popup");

  // دالة مساعدة لتنسيق الوقت والتاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const columns = [
    { accessorKey: "Title", header: "name" },
    { accessorKey: "TitleAr", header: "nameAr" },
    { accessorKey: "TitleFr", header: "nameFr" },
    {
      accessorKey: "Image",
      header: "Image",
      cell: ({ row }) => {
        const imageStr = row.getValue("Image");
        return (
          <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
            {imageStr ? (
              <img
                src={imageStr}
                alt="category"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                No Image
              </div>
            )}
          </div>
        );
      },
    },
    { accessorKey: "description", header: "description" },
    { accessorKey: "descriptionAr", header: "descriptionAr" },
    { accessorKey: "descriptionFr", header: "descriptionFr" },
    { accessorKey: "type", header: "type" },

    {
      accessorKey: "startDate",
      header: "startDate",
      cell: ({ row }) => formatDate(row.getValue("startDate")),
    },
    {
      accessorKey: "endDate",
      header: "endDate",
      cell: ({ row }) => formatDate(row.getValue("endDate")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const currentStatus = row.original.status;
        const id = row.original.id;

        // التحقق مما إذا كان هذا الصف بالتحديد قيد التحديث حالياً
        const isPending =
          updateStatusMutation.isPending &&
          updateStatusMutation.variables?.id === `${id}/status`;

        const handleToggle = () => {
          const newStatus = currentStatus === "active" ? "inactive" : "active";
          
          // بنبعت لـ useUpdate الـ id مدموج معاه كلمة status علشان يروح للرابط: /api/superadmin/popup/:id/status
          updateStatusMutation.mutate({
            id: `${id}/status`,
            payload: { status: newStatus },
          });
        };

        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={currentStatus === "active"}
              onCheckedChange={handleToggle}
              disabled={isPending}
            />
            <span
              className={`text-xs font-medium ${
                currentStatus === "active" ? "text-green-600" : "text-gray-400"
              } ${isPending ? "opacity-50" : ""}`}
            >
              {isPending ? "..." : currentStatus}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="popup"
        columns={columns}
        data={popup}
        isLoading={isLoading}
        queryKey="popup"
        deleteApiUrl="/api/superadmin/popup"
        onAdd={() => navigate("/popup/add")}
        onEdit={(popup) => navigate(`/popup/edit/${popup.id}`)}
      />
    </div>
  );
}