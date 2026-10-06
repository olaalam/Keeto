import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDelete } from "@/hooks/useDelete";
import { useGet } from "@/hooks/useGet";
import { usePost } from "@/hooks/usePost";

const EMPTY_LIST = [];

const getList = (response) => {
  const payload =
    response?.data?.data?.data ??
    response?.data?.data ??
    response?.data ??
    EMPTY_LIST;
  return Array.isArray(payload) ? payload : EMPTY_LIST;
};

const getRecord = (response) => {
  const payload =
    response?.data?.data?.data ??
    response?.data?.data ??
    response?.data ??
    response;
  return Array.isArray(payload) ? payload[0] : payload;
};

const getCompanyId = (response) => {
  const company = getRecord(response);
  return (
    company?.id ||
    company?.companyId ||
    company?.company?.id ||
    company?.shippingCompany?.id
  );
};

const parseRestaurants = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(",").filter(Boolean);
    }
  }
  return EMPTY_LIST;
};

function RestaurantAssignment({
  companyId,
  company,
  eligibleRestaurants,
  isEligibleRestaurantsLoading,
  isEligibleRestaurantsError,
  eligibleRestaurantsError,
  refetchEligibleRestaurants,
  onAssign,
  isAssigning,
  onUnassign,
  isUnassigning,
  onSelectionChange,
}) {
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState([]);
  const assignedRestaurants = useMemo(
    () =>
      parseRestaurants(
        company?.restaurantsDetails ||
          company?.restaurants ||
          company?.restaurantIds,
      ),
    [company],
  );
  const assignedIds = new Set(
    assignedRestaurants.map((restaurant) =>
      String(
        restaurant && typeof restaurant === "object"
          ? restaurant.id || restaurant.restaurantId
          : restaurant,
      ),
    ),
  );
  const availableRestaurants = eligibleRestaurants.filter(
    (restaurant) => !assignedIds.has(String(restaurant.id)),
  );

  const toggleRestaurant = (restaurantId, checked) => {
    const updated = checked
      ? [...new Set([...selectedRestaurantIds, restaurantId])]
      : selectedRestaurantIds.filter(
          (selectedId) => selectedId !== restaurantId,
        );
    setSelectedRestaurantIds(updated);
    onSelectionChange?.(updated);
  };

  const handleAssign = () => {
    onAssign(selectedRestaurantIds, {
      onSuccess: () => setSelectedRestaurantIds([]),
    });
  };

  return (
    <div className="space-y-6">
      {companyId && (
        <section className="space-y-4">
        <div>
          <h3 className="font-semibold">
            Assigned restaurants ({assignedRestaurants.length})
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Restaurants currently assigned to this shipping company.
          </p>
        </div>
        {assignedRestaurants.length ? (
          <ul className="divide-y rounded-lg border">
            {assignedRestaurants.map((restaurant, index) => {
              const item =
                restaurant && typeof restaurant === "object"
                  ? restaurant
                  : { id: restaurant };
              const restaurantId = item.id || item.restaurantId;
              return (
                <li
                  key={restaurantId || index}
                  className="flex items-center gap-3 p-3"
                >
                  {item.logo && (
                    <img
                      src={item.logo}
                      alt=""
                      className="h-9 w-9 rounded-md border object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.name || item.nameAr || restaurantId || "Restaurant"}
                    </p>
                    {item.nameAr && item.name && (
                      <p className="truncate text-xs text-slate-500">
                        {item.nameAr}
                      </p>
                    )}
                  </div>
                  {companyId && restaurantId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={isUnassigning}
                      onClick={() => onUnassign(String(restaurantId))}
                      aria-label={`Remove ${item.name || item.nameAr || "restaurant"} assignment`}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            No restaurants are currently assigned.
          </p>
        )}
        </section>
      )}

      <section className="space-y-4 border-t pt-6">
        <div>
          <h3 className="font-semibold">Assign restaurants</h3>
        </div>
        {isEligibleRestaurantsLoading ? (
          <LoadingSpinner />
        ) : isEligibleRestaurantsError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>
              {eligibleRestaurantsError?.response?.data?.message ||
                eligibleRestaurantsError?.message ||
                "Unable to load eligible restaurants."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => refetchEligibleRestaurants()}
            >
              Try again
            </Button>
          </div>
        ) : availableRestaurants.length ? (
          <>
            <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
              {availableRestaurants.map((restaurant) => (
                <li
                  key={restaurant.id}
                  className="flex items-center gap-3 p-3"
                >
                  <Checkbox
                    id={`assign-restaurant-${restaurant.id}`}
                    checked={selectedRestaurantIds.includes(
                      String(restaurant.id),
                    )}
                    onCheckedChange={(checked) =>
                      toggleRestaurant(String(restaurant.id), checked === true)
                    }
                    disabled={isAssigning}
                  />
                  {restaurant.logo && (
                    <img
                      src={restaurant.logo}
                      alt=""
                      className="h-9 w-9 rounded-md border object-cover"
                    />
                  )}
                  <label
                    htmlFor={`assign-restaurant-${restaurant.id}`}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="block truncate text-sm font-medium">
                      {restaurant.name || restaurant.nameAr || restaurant.id}
                    </span>
                    {restaurant.nameAr && restaurant.name && (
                      <span className="block truncate text-xs text-slate-500">
                        {restaurant.nameAr}
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            {companyId && (
              <Button
                type="button"
                disabled={
                  isAssigning || selectedRestaurantIds.length === 0
                }
                onClick={handleAssign}
              >
                {isAssigning
                  ? "Assigning..."
                  : "Assign selected restaurants"}
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">
            No eligible restaurants are available to assign.
          </p>
        )}
      </section>
    </div>
  );
}

export default function ShippingCompanyAdd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRestaurantIdsForCreate, setSelectedRestaurantIdsForCreate] =
    useState([]);
  const {
    data: eligibleRestaurantsResponse,
    isLoading: isEligibleRestaurantsLoading,
    isError: isEligibleRestaurantsError,
    error: eligibleRestaurantsError,
    refetch: refetchEligibleRestaurants,
  } = useGet(
    "shipping-companies-eligible-restaurants",
    "/api/superadmin/shipping-companies/eligible-restaurants",
  );
  const eligibleRestaurants = getList(eligibleRestaurantsResponse);

  const {
    data: companyResponse,
    isLoading: isCompanyLoading,
    isError: isCompanyError,
    error: companyError,
    refetch: refetchCompany,
  } = useQuery({
    queryKey: ["shipping-company-edit", id],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/superadmin/shipping-companies/${id}`,
      );
      return data?.data?.data ?? data?.data ?? data;
    },
    enabled: Boolean(id),
  });
  const company = getRecord(companyResponse);
  const initialData = company
    ? {
        ...company,
        password: "",
      }
    : id
      ? null
      : { status: "active" };

  const {
    mutate: assignRestaurants,
    isPending: isAssigningRestaurants,
  } = usePost(
    `/api/superadmin/shipping-companies/${id}/assign-restaurants`,
    "post",
    "shipping-company-edit",
  );
  const {
    mutate: unassignRestaurant,
    isPending: isUnassigningRestaurant,
  } = useDelete(
    `/api/superadmin/shipping-companies/${id}/restaurants`,
    "shipping-company-edit",
  );

  const fields = useMemo(
    () => [
      { name: "name", label: "Name", required: true },
      { name: "nameAr", label: "Arabic name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      ...(!id
        ? [
            {
              name: "password",
              label: "Password",
              type: "password",
              required: true,
            },
          ]
        : []),
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "address", label: "Address", required: true },
      { name: "logo", label: "Logo URL", type: "url" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ],
    [id],
  );

  const handleCompanySave = async (response) => {
    queryClient.invalidateQueries({ queryKey: ["shipping-companies"] });
    if (!id) {
      const createdId = getCompanyId(response);
      if (createdId) {
        if (selectedRestaurantIdsForCreate.length > 0) {
          try {
            await api.post(
              `/api/superadmin/shipping-companies/${createdId}/assign-restaurants`,
              { restaurantIds: selectedRestaurantIdsForCreate },
            );
            toast.success("Restaurants assigned successfully");
            queryClient.invalidateQueries({
              queryKey: ["shipping-companies-eligible-restaurants"],
            });
          } catch (assignmentError) {
            toast.error(
              assignmentError?.response?.data?.message ||
                "Company created, but restaurant assignment failed.",
            );
          }
        }
        navigate(`/shipping-companies`);
        return;
      }
      toast.error(
        "Company was created, but its ID was missing from the response. Open it from the company list to assign restaurants.",
      );
      navigate("/shipping-companies");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["shipping-company-edit", id] });
    navigate(`/shipping-companies`);
  };

  if (isCompanyLoading) return <LoadingSpinner />;

  if (isCompanyError) {
    const errorMessage =
      companyError?.response?.data?.message ||
      companyError?.message ||
      "Unable to load shipping company.";
    return (
      <div className="container mx-auto py-10">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          <p>{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => refetchCompany()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-10">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/shipping-companies")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to shipping companies
      </Button>
      <AddPage
        title="Shipping Company"
        apiUrl={id ? `/api/superadmin/shipping-companies/${id}` : "/api/superadmin/shipping-companies"}
        queryKey="shipping-companies"
        method={id ? "PUT" : undefined}
        bypassIdInEdit={Boolean(id)}
        fields={fields}
        initialData={initialData}
        transformPayload={(data) =>
          id ? { ...data, password: undefined } : data
        }
        onSuccessAction={handleCompanySave}
      >
        {() => (
          <RestaurantAssignment
            key={id || "new-company"}
            companyId={id}
            company={company}
            eligibleRestaurants={eligibleRestaurants}
            isEligibleRestaurantsLoading={isEligibleRestaurantsLoading}
            isEligibleRestaurantsError={isEligibleRestaurantsError}
            eligibleRestaurantsError={eligibleRestaurantsError}
            refetchEligibleRestaurants={refetchEligibleRestaurants}
            isAssigning={isAssigningRestaurants}
            onAssign={(restaurantIds, callbacks) =>
              assignRestaurants(
                { restaurantIds },
                {
                  ...callbacks,
                  onSuccess: (response) => {
                    callbacks?.onSuccess?.(response);
                    queryClient.invalidateQueries({
                      queryKey: ["shipping-companies"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["shipping-companies-eligible-restaurants"],
                    });
                  },
                },
              )
            }
            isUnassigning={isUnassigningRestaurant}
            onUnassign={(restaurantId) =>
              unassignRestaurant(restaurantId, {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: ["shipping-company-edit", id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["shipping-companies-eligible-restaurants"],
                  });
                },
              })
            }
            onSelectionChange={
              id ? undefined : setSelectedRestaurantIdsForCreate
            }
          />
        )}
      </AddPage>
    </div>
  );
}
