import { useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { Button } from "@/components/ui/button";
import { useGet } from "@/hooks/useGet";

export default function ShippingCompanies() {
  const navigate = useNavigate();
  const {
    data: companiesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGet("shipping-companies", "/api/superadmin/shipping-companies");
  const companies = companiesResponse?.data?.data;

  const columns = [
    {
      accessorKey: "logo",
      header: "Logo",
      cell: ({ row }) =>
        row.original.logo ? (
          <img
            src={row.original.logo}
            alt={`${row.original.name || "Shipping company"} logo`}
            className="mx-auto h-10 w-10 rounded-lg border object-cover"
          />
        ) : (
          <span className="text-xs text-slate-400">No logo</span>
        ),
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "nameAr", header: "Arabic name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    {
      id: "restaurants",
      header: "Restaurants",
      cell: ({ row }) => {
        const restaurantIds = row.original.restaurantIds || row.original.restaurants || [];
        const restaurants = Array.isArray(restaurantIds)
          ? restaurantIds
          : typeof restaurantIds === "string"
            ? restaurantIds.split(",").filter(Boolean)
            : [];
        return <span>{restaurants.length}</span>;
      },
    },
    { accessorKey: "status", header: "Status" },
  ];

  if (isError || (companiesResponse && !Array.isArray(companies))) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to load shipping companies.";

    return (
      <div className="container mx-auto py-10">
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p>{errorMessage}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Shipping Companies"
        columns={columns}
        data={companies}
        isLoading={isLoading}
        queryKey="shipping-companies"
        deleteApiUrl="/api/superadmin/shipping-companies"
        editApiUrl="/api/superadmin/shipping-companies"
        onAdd={() => navigate("/shipping-companies/add")}
        onEdit={(company) =>
          navigate(`/shipping-companies/edit/${company.id}`)
        }
      />
    </div>
  );
}
