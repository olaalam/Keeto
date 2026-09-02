import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { usePost } from "@/hooks/usePost";

export default function BlockedUsers() {
  const navigate = useNavigate();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/keeto-users/blocked");
      return res.data.data.data;
    },
  });

  const { mutate: updateRestaurantBlock } = usePost(
    "/api/superadmin/keeto-users/restaurant-block",
    "post",
    "blocked-users",
  );

  const handleToggleBlock = (userId, restaurantId, status) => {
    updateRestaurantBlock({
      userId,
      restaurantId,
      status, // Must be 'active' or 'blocked'
    });
  };

  const columns = [
    { accessorKey: "name", header: "Name" },

    {
      accessorKey: "photo",
      header: "Image",
      cell: ({ row }) => {
        const imageStr = row.getValue("photo");
        return (
          <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
            {imageStr && imageStr !== "NULL" ? (
              <img
                src={
                  imageStr.startsWith("http")
                    ? imageStr
                    : `https://keetobcknd.keeto.org/${imageStr}`
                }
                alt={row.getValue("name")}
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

    { accessorKey: "email", header: "Email" },

    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ getValue }) => getValue() || "—",
    },

    {
      accessorKey: "blockType",
      header: "Block Source",
      cell: ({ row }) => {
        const userId = row.original.id || row.original._id;
        const isGlobal = row.original.isGloballyBlocked;
        const isRestaurant = row.original.isRestaurantBlocked;
        const restaurants = row.original.blockedByRestaurants || [];

        return (
          <div className="flex flex-col gap-1">
            {isGlobal && (
              <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Blocked by Keeto
              </span>
            )}

            {isRestaurant && restaurants.length > 0 && (
              <div className="flex flex-col gap-1">
                {restaurants.map((r) => (
                  <div key={r.restaurantId} className="flex items-center gap-2">
                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Blocked by: {r.restaurantName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleBlock(userId, r.restaurantId, "active")
                      }
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isGlobal && !isRestaurant && (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        );
      },
    },

    {
      accessorKey: "status",
      header: "Status",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Blocked Users"
        columns={columns}
        data={users}
        isLoading={isLoading}
        queryKey="blocked-users"
        deleteApiUrl="/api/superadmin/keeto-users"
        editApiUrl="/api/superadmin/keeto-users"
      />
    </div>
  );
}
