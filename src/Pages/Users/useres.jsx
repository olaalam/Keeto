import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { usePost } from "@/hooks/usePost";

export default function Users() {
  const navigate = useNavigate();

  // State for the restaurant block modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [restaurantId, setRestaurantId] = useState("");
  const [status, setStatus] = useState("blocked");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/keeto-users");
      return res.data.data.data;
    },
  });

  // Restaurants list for the "Restaurant Block" select dropdown
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ["branches-select"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/branches/select");
      return res.data.data.data.restaurant || [];
    },
    enabled: !!selectedUser, // only fetch when the modal is opened
  });

  const { mutate: updateRestaurantBlock, isPending } = usePost(
    "/api/superadmin/keeto-users/restaurant-block",
    "post",
    "users",
  );

  const handleBlockSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !restaurantId) return;

    updateRestaurantBlock(
      {
        userId: selectedUser.id || selectedUser._id,
        restaurantId,
        status, // 'active' | 'blocked'
      },
      {
        onSuccess: () => {
          setSelectedUser(null);
          setRestaurantId("");
        },
      },
    );
  };

  const columns = [
    { accessorKey: "name", header: "name" },

    {
      accessorKey: "photo",
      header: "Image",
      cell: ({ row }) => {
        const imageStr = row.getValue("photo");
        return (
          <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
            {imageStr ? (
              <img
                src={
                  imageStr.startsWith("http")
                    ? imageStr
                    : `https://keetobcknd.keeto.org/${imageStr}`
                }
                alt="user"
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
      accessorKey: "status",
      header: "status",
    },

    {
      id: "restaurantBlock",
      header: "Restaurant Block",
      cell: ({ row }) => {
        const user = row.original;
        const blockedRestaurants = user.blockedByRestaurants || [];

        return (
          <div className="flex flex-col gap-1.5">
            {blockedRestaurants.length > 0 && (
              <div className="flex flex-col gap-1">
                {blockedRestaurants.map((r) => (
                  <div key={r.restaurantId} className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Blocked: {r.restaurantName || r.restaurantId}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateRestaurantBlock({
                          userId: user.id || user._id,
                          restaurantId: r.restaurantId,
                          status: "active",
                        })
                      }
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedUser(user)}
              className="w-fit text-xs px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium transition-colors"
            >
              + Restaurant Block
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Users"
        columns={columns}
        data={users}
        isLoading={isLoading}
        queryKey="users"
        deleteApiUrl="/api/superadmin/keeto-users"
        editApiUrl="/api/superadmin/keeto-users"
        inactiveStatusValue="blocked"
      />

      {/* Modal to Block/Unblock user for a specific Restaurant */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Restaurant Block for {selectedUser.name}
            </h3>

            <form onSubmit={handleBlockSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant
                </label>
                <select
                  required
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  disabled={isRestaurantsLoading}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">
                    {isRestaurantsLoading
                      ? "Loading restaurants..."
                      : "Select a restaurant"}
                  </option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
