import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FoodListDialog from "./FoodListDialog";

export default function Restaurant() {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openFoodDialog = (restaurantId) => {
    setSelectedRestaurant(restaurantId);
    setIsDialogOpen(true);
  };

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/restaurants");
      return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
    },
  });

  const columns = [
    {
      accessorKey: "name",
      header: "Restaurant Name",
      cell: ({ row }) => (
        <button
          onClick={() =>
            navigate(`/restaurants/mykeetresturant/${row.original.id}`)
          }
          className="text-blue-600 hover:underline font-medium text-left"
        >
          {row.getValue("name")}
        </button>
      ),
    },
    /*  { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' }, */
    {
      accessorKey: "logo",
      header: "Logo",
      cell: ({ row }) => (
        <div className="w-10 h-10 border rounded-full overflow-hidden">
          <img
            src={row.getValue("logo")}
            alt="logo"
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },

    // { accessorKey: "ownerPhone", header: "Phone" },
     { accessorKey: "likes", header: "Likes" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "view_food",
      header: "Food Menu",
      cell: ({ row }) => (
        <button
          onClick={() => openFoodDialog(row.original.id)}
          className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
        >
          <Eye size={16} />
          View Food
        </button>
      ),
    },

    {
      accessorKey: "transaction",
      header: "Transaction",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`transaction/${row.original.id}`)}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          Transaction
        </button>
      ),
    },
    {
      accessorKey: "setting",
      header: "Settings",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`setting/${row.original.id}`)}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          Settings
        </button>
      ),
    },
    {
      accessorKey: "invoice",
      header: "Invoice",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`invoice/${row.original.id}`)}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          Invoice
        </button>
      ),
    },
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`order/${row.original.id}`)}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          Order
        </button>
      ),
    },
    {
      accessorKey: "wallet",
      header: "Wallet",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`wallet/${row.original.id}`)}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          Wallet
        </button>
      ),
    },

    {
      accessorKey: "status",
      header: "status",
      // 💡 قمنا بحذف الـ cell بالكامل هنا لكي يتولى GenericDataTable توليد الـ Switch تلقائياً
    },
  ];
  const exportToExcel = () => {
    const exportData = restaurants.map((restaurant) => ({
      "Restaurant Name": restaurant.name || "",
      Type: restaurant.type || "",
      "Facebook Page Likes": "",
      "Start Orders": "",
      "Number of Orders": "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // عرض الأعمدة
    worksheet["!cols"] = [
      { wch: 20 }, // Type
      { wch: 35 }, // Restaurant Name
      { wch: 50 }, // Facebook Page Likes
      { wch: 20 }, // Start Orders
      { wch: 20 }, // Number of Orders
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Restaurants");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(file, "Restaurants.xlsx");
  };
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-end mb-4">
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export Excel
        </button>
      </div>
      <GenericDataTable
        title="restaurants"
        columns={columns}
        data={restaurants}
        isLoading={isLoading}
        queryKey="restaurants"
        deleteApiUrl="/api/superadmin/restaurants"
        editApiUrl="/api/superadmin/restaurants"
        onAdd={() => navigate("/restaurants/add")}
        onEdit={(restaurant) => navigate(`/restaurants/edit/${restaurant.id}`)}
      />
      {isDialogOpen && (
        <FoodListDialog
          restaurantId={selectedRestaurant}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
