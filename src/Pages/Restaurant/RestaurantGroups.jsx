import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";

const safeJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function RestaurantGroupsPage() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState(null);

  const { data: groupsResponse, isLoading: isGroupsLoading } = useGet(
    "restaurant-groups",
    "/api/superadmin/restaurant-groups",
  );

  const groupData = useMemo(() => {
    const payload = groupsResponse?.data?.data || groupsResponse?.data || groupsResponse || [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, [groupsResponse]);

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "nameAr", header: "Arabic Name" },
    { accessorKey: "nameFr", header: "French Name" },
    { accessorKey: "coverageType", header: "Coverage Type" },
    { accessorKey: "customRadiusKm", header: "Radius KM" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "restaurantsCount",
      header: "Restaurants Count",
      cell: ({ row }) => {
        const parsed = safeJsonArray(row.original.restaurants);
        const count = Number(row.original.restaurantsCount || parsed.length || 0);
        return <span>{count}</span>;
      },
    },
    {
      id: "viewRestaurants",
      header: "View",
      cell: ({ row }) => (
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
          onClick={() => setSelectedGroup(row.original)}
        >
          View
        </button>
      ),
    },
  ];

  const restaurantsForSelectedGroup = selectedGroup?.restaurantsDetails?.length
    ? selectedGroup.restaurantsDetails
    : safeJsonArray(selectedGroup?.restaurants).map((restaurantId) => ({ id: restaurantId, name: restaurantId }));

  return (
    <div className="container mx-auto py-8">
      <GenericDataTable
        title="Restaurant Groups"
        columns={columns}
        data={groupData}
        isLoading={isGroupsLoading}
        queryKey="restaurant-groups"
        onAdd={() => navigate("/restaurant-groups/add")}
        onEdit={(group) => navigate(`/restaurant-groups/edit/${group.id}`)}
        deleteApiUrl="/api/superadmin/restaurant-groups"
        editApiUrl="/api/superadmin/restaurant-groups"
      />

      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedGroup.name}</h3>
                <p className="text-xs text-slate-500">Restaurant List</p>
              </div>
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                onClick={() => setSelectedGroup(null)}
              >
                Close
              </button>
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Restaurant</th>
                    <th className="px-4 py-3 text-left">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurantsForSelectedGroup.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-4 py-3 text-slate-500">No restaurants found</td>
                    </tr>
                  )}
                  {restaurantsForSelectedGroup.map((restaurant) => (
                    <tr key={restaurant.id || restaurant.name} className="border-t">
                      <td className="px-4 py-3">{restaurant.name || restaurant.restaurantName || restaurant.title || "Restaurant"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{restaurant.id || restaurant.restaurantId || restaurant.uuid || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
