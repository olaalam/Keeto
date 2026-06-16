import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapComponent from "@/components/MapComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Shadcn Search Select (Combobox) UI Components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Controller } from "react-hook-form";
import {
  Search,
  Loader2,
  ChevronsUpDown,
  Check,
  X,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePost } from "@/hooks/usePost";
import { useUpdate } from "@/hooks/useUpdate";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller as RHFController } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteDialog from "@/components/DeleteDialog";

// ─── Platform type label helper ──────────────────────────────────────────────
const PLATFORM_LABELS = {
  online_order: "Online Order",
  food_aggregator: "Food Aggregator",
  mykeeto: "Mykeeto",
  pos: "POS",
};

// ─── Inline Business Plan Tab ────────────────────────────────────────────────
const BusinessPlanTab = ({ restaurantId }) => {
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["business-plans", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const res = await api.get("/api/superadmin/businessplans");
      const all = res.data?.data?.data || res.data?.data || [];
      const arr = Array.isArray(all) ? all : [all];
      const filtered = arr.filter((p) => p.restaurantId === restaurantId);
      // Deduplicate by platformType — keep the most recent per type
      const deduped = Object.values(
        filtered.reduce((acc, p) => {
          const existing = acc[p.platformType];
          if (
            !existing ||
            new Date(p.createdAt) > new Date(existing.createdAt)
          ) {
            acc[p.platformType] = p;
          }
          return acc;
        }, {}),
      );
      return deduped;
    },
  });

  const [editingPlan, setEditingPlan] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);
  const [deletingPlanId, setDeletingPlanId] = React.useState(null);

  const handleDone = () => {
    setShowForm(false);
    setEditingPlan(null);
    queryClient.invalidateQueries({
      queryKey: ["business-plans", restaurantId],
    });
  };

  if (!restaurantId)
    return (
      <p className="text-sm text-gray-400 text-center py-10">
        Save the restaurant first, then come back to manage business plans.
      </p>
    );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Business Plans</h3>
        {!showForm &&
          (() => {
            const existingTypes = plans.map((p) => p.platformType);
            const allAdded = [
              "online_order",
              "food_aggregator",
              "mykeeto",
            ].every((t) => existingTypes.includes(t));
            if (allAdded) return null;
            return (
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingPlan(null);
                  setShowForm(true);
                }}
              >
                <Save className="h-4 w-4 mr-1" /> Add Plan
              </Button>
            );
          })()}
      </div>

      {/* existing plans list */}
      {!showForm && (
        <div className="space-y-2">
          {plans.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              No business plans yet.
            </p>
          )}
          {plans.map((plan) => {
            const isPOS = plan.platformType === "pos";
            // Skip pos records and any unknown platform types from the list
            if (
              !PLATFORM_LABELS[plan.platformType] ||
              plan.platformType === "pos"
            )
              return null;
            return (
              <Card key={plan.id} className="border shadow-none">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {PLATFORM_LABELS[plan.platformType] || plan.platformType}
                    </p>
                    {!isPOS && (
                      <p className="text-xs text-gray-500">
                        Commission: {plan.commissionRate}% · Service Fee:{" "}
                        {plan.serviceFee}
                      </p>
                    )}
                    {(plan.isMonthlyActive ||
                      plan.isQuarterlyActive ||
                      plan.isAnnuallyActive) && (
                      <p className="text-xs text-gray-400">
                        {plan.isMonthlyActive &&
                          `Monthly: ${plan.monthlyAmount}`}
                        {plan.isMonthlyActive &&
                          (plan.isQuarterlyActive || plan.isAnnuallyActive) &&
                          " · "}
                        {plan.isQuarterlyActive &&
                          `Quarterly: ${plan.quarterlyAmount}`}
                        {plan.isQuarterlyActive &&
                          plan.isAnnuallyActive &&
                          " · "}
                        {plan.isAnnuallyActive &&
                          `Annually: ${plan.annuallyAmount}`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingPlan(plan);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600 hover:border-red-300"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingPlanId(plan.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <BusinessPlanForm
          restaurantId={restaurantId}
          plan={editingPlan}
          existingPlans={plans}
          onDone={handleDone}
        />
      )}

      <DeleteDialog
        isOpen={!!deletingPlanId}
        onClose={() => {
          setDeletingPlanId(null);
          queryClient.invalidateQueries({
            queryKey: ["business-plans", restaurantId],
          });
        }}
        apiUrl="/api/superadmin/businessplans"
        id={deletingPlanId}
        title="Delete Business Plan?"
      />
    </div>
  );
};

const BusinessPlanForm = ({
  restaurantId,
  plan,
  existingPlans = [],
  onDone,
}) => {
  const isEdit = !!plan?.id;
  // Platforms already saved — hide their columns in add mode
  const existingTypes = existingPlans.map((p) => p.platformType);
  const showOnline = isEdit || !existingTypes.includes("online_order");
  const showAggregator = isEdit || !existingTypes.includes("food_aggregator");
  const showMykeeto = isEdit || !existingTypes.includes("mykeeto");
  const postMutation = usePost("/api/superadmin/businessplans", "post");
  const updateMutation = useUpdate(`/api/superadmin/businessplans`);

  // In edit mode, we only edit the single platform record
  // In add mode, we collect all platforms in one form and send 4 separate requests
  const getInitialValues = () => {
    if (isEdit) {
      return {
        online_commissionRate:
          plan.platformType === "online_order" ? plan.commissionRate || "" : "",
        online_serviceFee:
          plan.platformType === "online_order" ? plan.serviceFee || "" : "",
        aggregator_commissionRate:
          plan.platformType === "food_aggregator"
            ? plan.commissionRate || ""
            : "",
        aggregator_serviceFee:
          plan.platformType === "food_aggregator" ? plan.serviceFee || "" : "",
        mykeeto_commissionRate:
          plan.platformType === "mykeeto" ? plan.commissionRate || "" : "",
        mykeeto_serviceFee:
          plan.platformType === "mykeeto" ? plan.serviceFee || "" : "",
        // These exist on every plan record regardless of platformType
        isMonthlyActive: plan.isMonthlyActive || false,
        monthlyAmount: plan.monthlyAmount || "",
        isQuarterlyActive: plan.isQuarterlyActive || false,
        quarterlyAmount: plan.quarterlyAmount || "",
        isAnnuallyActive: plan.isAnnuallyActive || false,
        annuallyAmount: plan.annuallyAmount || "",
        pos_isOn: plan.isOn !== undefined ? plan.isOn : true,
      };
    }
    return {
      online_commissionRate: "",
      online_serviceFee: "",
      aggregator_commissionRate: "",
      aggregator_serviceFee: "",
      mykeeto_commissionRate: "",
      mykeeto_serviceFee: "",
      isMonthlyActive: false,
      monthlyAmount: "",
      isQuarterlyActive: false,
      quarterlyAmount: "",
      isAnnuallyActive: false,
      annuallyAmount: "",
      pos_isOn: true,
    };
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: getInitialValues() });

  const watchMonthly = watch("isMonthlyActive");
  const watchQuarterly = watch("isQuarterlyActive");
  const watchAnnually = watch("isAnnuallyActive");

  const onSubmit = async (data) => {
    if (isEdit) {
      // Update the single platform record — always include subscription fields
      const fieldPrefix =
        plan.platformType === "online_order"
          ? "online"
          : plan.platformType === "food_aggregator"
            ? "aggregator"
            : plan.platformType === "mykeeto"
              ? "mykeeto"
              : null;

      const platformEntry = {
        platformType: plan.platformType,
        // commission/fee fields only for non-pos platforms
        ...(fieldPrefix && {
          commissionRate: String(
            data[`${fieldPrefix}_commissionRate`] || "0.00",
          ),
          serviceFee: String(data[`${fieldPrefix}_serviceFee`] || "0.00"),
        }),
        // subscription fields exist on every plan record
        isMonthlyActive: data.isMonthlyActive,
        monthlyAmount: data.isMonthlyActive
          ? String(data.monthlyAmount || "0.00")
          : "0.00",
        isQuarterlyActive: data.isQuarterlyActive,
        quarterlyAmount: data.isQuarterlyActive
          ? String(data.quarterlyAmount || "0.00")
          : "0.00",
        isAnnuallyActive: data.isAnnuallyActive,
        annuallyAmount: data.isAnnuallyActive
          ? String(data.annuallyAmount || "0.00")
          : "0.00",
        ...(plan.platformType === "pos" && { isOn: data.pos_isOn }),
      };

      // PUT expects a flat object — no platforms wrapper
      updateMutation.mutate(
        { id: plan.id, payload: { restaurantId, ...platformEntry } },
        { onSuccess: onDone },
      );
    } else {
      // Add mode: send all 4 platforms as separate requests
      // Subscription fields are shared across all platform records
      const subscriptionFields = {
        isMonthlyActive: data.isMonthlyActive,
        monthlyAmount: data.isMonthlyActive
          ? String(data.monthlyAmount || "0.00")
          : "0.00",
        isQuarterlyActive: data.isQuarterlyActive,
        quarterlyAmount: data.isQuarterlyActive
          ? String(data.quarterlyAmount || "0.00")
          : "0.00",
        isAnnuallyActive: data.isAnnuallyActive,
        annuallyAmount: data.isAnnuallyActive
          ? String(data.annuallyAmount || "0.00")
          : "0.00",
      };

      const requests = [
        showOnline && {
          platformType: "online_order",
          commissionRate: String(data.online_commissionRate || "0.00"),
          serviceFee: String(data.online_serviceFee || "0.00"),
          ...subscriptionFields,
        },
        showAggregator && {
          platformType: "food_aggregator",
          commissionRate: String(data.aggregator_commissionRate || "0.00"),
          serviceFee: String(data.aggregator_serviceFee || "0.00"),
          ...subscriptionFields,
        },
        showMykeeto && {
          platformType: "mykeeto",
          commissionRate: String(data.mykeeto_commissionRate || "0.00"),
          serviceFee: String(data.mykeeto_serviceFee || "0.00"),
          ...subscriptionFields,
        },
        showFixedFees &&
          !existingTypes.includes("pos") && {
            platformType: "pos",
            isOn: data.pos_isOn,
            ...subscriptionFields,
          },
      ].filter(Boolean);

      try {
        for (const platformEntry of requests) {
          await postMutation.mutateAsync({
            restaurantId,
            platforms: [platformEntry],
          });
        }
        onDone();
      } catch (e) {
        console.error("Failed to save business plan", e);
      }
    }
  };

  const isPending = postMutation.isPending || updateMutation.isPending;
  const editingPlatformType = isEdit ? plan.platformType : null;
  const [showFixedFees, setShowFixedFees] = React.useState(false);

  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">
          {isEdit
            ? `Edit — ${PLATFORM_LABELS[plan.platformType] || plan.platformType}`
            : "New Business Plan"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-6">
        {/* ── Variable Commission Table (online_order / food_aggregator / mykeeto) ── */}
        {(showOnline || showAggregator || showMykeeto) && (
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 font-semibold text-gray-600 w-1/4"></th>
                  {showOnline && (
                    <th className="p-3 font-semibold text-gray-700 text-center border-l">
                      Online Order
                    </th>
                  )}
                  {showAggregator && (
                    <th className="p-3 font-semibold text-gray-700 text-center border-l">
                      Aggregator
                    </th>
                  )}
                  {showMykeeto && (
                    <th className="p-3 font-semibold text-gray-700 text-center border-l">
                      Mykeeto
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Fees Order row */}
                <tr className="border-b">
                  <td className="p-3 font-medium text-gray-600 bg-gray-50/50">
                    Fees Order (%)
                  </td>
                  {showOnline && (
                    <td className="p-2 border-l">
                      <Input
                        type="number"
                        step="0.01"
                        {...register("online_commissionRate")}
                        className="h-8 text-center"
                        placeholder="0.00"
                      />
                    </td>
                  )}
                  {showAggregator && (
                    <td className="p-2 border-l">
                      <Input
                        type="number"
                        step="0.01"
                        {...register("aggregator_commissionRate")}
                        className="h-8 text-center"
                        placeholder="0.00"
                      />
                    </td>
                  )}
                  {showMykeeto && (
                    <td className="p-2 border-l">
                      <Input
                        type="number"
                        step="0.01"
                        {...register("mykeeto_commissionRate")}
                        className="h-8 text-center"
                        placeholder="0.00"
                      />
                    </td>
                  )}
                </tr>
                {/* Commission row */}
                <tr>
                  <td className="p-3 font-medium text-gray-600 bg-gray-50/50">
                    Service Fee
                  </td>
                  {showOnline && (
                    <td className="p-2 border-l">
                      <Input
                        type="number"
                        step="0.01"
                        {...register("online_serviceFee")}
                        className="h-8 text-center"
                        placeholder="0.00"
                      />
                    </td>
                  )}
                  {showAggregator && (
                    <td className="p-2 border-l">
                      <Input
                        type="number"
                        step="0.01"
                        {...register("aggregator_serviceFee")}
                        className="h-8 text-center"
                        placeholder="0.00"
                      />
                    </td>
                  )}
                  {showMykeeto && (
                    <td className="p-2 border-l">
                      <Input
                        type="number"
                        step="0.01"
                        {...register("mykeeto_serviceFee")}
                        className="h-8 text-center"
                        placeholder="0.00"
                      />
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── Fixed Fees / POS Subscriptions ── */}
        {!isEdit && (
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFixedFees((v) => !v);
              }}
            >
              {showFixedFees ? "Hide" : "Show"} Fixed Fees & Subscriptions (POS)
            </Button>
          </div>
        )}
        {(isEdit || showFixedFees) && (
          <div className="border rounded-lg p-4 bg-gray-50/30 space-y-4">
            <div className="text-xs font-bold text-gray-700 border-b pb-2 uppercase tracking-wider">
              Fixed Fees & Subscriptions (POS)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Monthly */}
              <div className="bg-white p-3 border rounded-md flex flex-col justify-between space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-700">
                    Monthly
                  </Label>
                  <RHFController
                    name="isMonthlyActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div
                  className={`space-y-1 transition-opacity ${watchMonthly ? "opacity-100" : "opacity-40"}`}
                >
                  <Label className="text-[11px] text-gray-500">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={!watchMonthly}
                    {...register("monthlyAmount")}
                    className="h-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {/* Quarterly */}
              <div className="bg-white p-3 border rounded-md flex flex-col justify-between space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-700">
                    Quarterly
                  </Label>
                  <RHFController
                    name="isQuarterlyActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div
                  className={`space-y-1 transition-opacity ${watchQuarterly ? "opacity-100" : "opacity-40"}`}
                >
                  <Label className="text-[11px] text-gray-500">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={!watchQuarterly}
                    {...register("quarterlyAmount")}
                    className="h-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {/* Annually */}
              <div className="bg-white p-3 border rounded-md flex flex-col justify-between space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-700">
                    Annually
                  </Label>
                  <RHFController
                    name="isAnnuallyActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div
                  className={`space-y-1 transition-opacity ${watchAnnually ? "opacity-100" : "opacity-40"}`}
                >
                  <Label className="text-[11px] text-gray-500">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={!watchAnnually}
                    {...register("annuallyAmount")}
                    className="h-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDone();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isEdit ? "Update Plan" : "Save Plan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
const RestaurantAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: selectData, isLoading: isLoadingSelect } = useQuery({
    queryKey: ["restaurantSelectData"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/restaurants/select");
      return res.data.data.data;
    },
  });

  const { data: fetchedData, isLoading: isFetching } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/restaurants/${id}`);
      const raw = data.data.data;

      // ✅ FIXED: Parse dynamic backend cuisine arrays into internal string lists
      let initialCuisineIds = [];
      if (Array.isArray(raw.cuisineId)) {
        initialCuisineIds = raw.cuisineId.map(String);
      } else if (Array.isArray(raw.cuisines)) {
        initialCuisineIds = raw.cuisines.map((c) => String(c.id));
      } else if (raw.cuisineId) {
        initialCuisineIds = [String(raw.cuisineId)];
      }

      return {
        ...raw,
        cuisineId: initialCuisineIds, // توحيد الكي هنا ليكون cuisineId متوافق مع الفورم والباكيند
        zoneId: String(raw.zoneId),
        tags: Array.isArray(raw.tags) ? raw.tags.join(", ") : raw.tags,
        deliveryTimeUnit: raw.deliveryTimeUnit || "Minutes",
        status: raw.status || "active",
      };
    },
    enabled: !!id && !state?.restaurantData,
  });

  const initialData = state?.restaurantData || fetchedData;

  if (id && (isFetching || isLoadingSelect)) return <LoadingSpinner />;

  return (
    <AddPage
      title="Restaurant"
      apiUrl="/api/superadmin/restaurants"
      queryKey="restaurants"
      fields={[]}
      initialData={initialData}
      onSuccessAction={() => navigate(-1)}
      beforeSubmit={(data) => {
        const formattedData = {
          ...data,
          tags:
            typeof data.tags === "string"
              ? data.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t !== "")
              : data.tags,
          minDeliveryTime: String(data.minDeliveryTime),
          maxDeliveryTime: String(data.maxDeliveryTime),
          cuisineId: Array.isArray(data.cuisineId)
            ? data.cuisineId.map(String)
            : [],
        };

        if (isEdit) {
          if (!formattedData.password) {
            delete formattedData.password;
            delete formattedData.confirmPassword;
          }
        }

        return formattedData;
      }}
    >
      {(methods) => {
        const {
          register,
          control,
          setValue,
          watch,
          getValues,
          formState: { errors },
        } = methods;

        const selectedCuisines = watch("cuisineId") || [];

        const handleFileToBase64 = (e, fieldName) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            setValue(fieldName, reader.result, { shouldDirty: true });
          };
          reader.readAsDataURL(file);
        };

        return (
          <Tabs defaultValue="basic" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="basic">General Info</TabsTrigger>
              {/*  <TabsTrigger value="location">Location & Map</TabsTrigger> */}
              <TabsTrigger value="business">Business Details</TabsTrigger>
              <TabsTrigger value="images">Identity & Media</TabsTrigger>
              <TabsTrigger value="business-plan">Business Plan</TabsTrigger>
            </TabsList>

            {/* 1. General Info */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name (EN) *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="Restaurant Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (AR) *</Label>
                  <Input
                    {...register("nameAr", { required: true })}
                    placeholder="الاسم بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (FR) *</Label>
                  <Input
                    {...register("nameFr", { required: true })}
                    placeholder="Nom en français"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    {...register("email", { required: true })}
                  />
                </div>

                {!isEdit && (
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      {...register("password", { required: true })}
                    />
                  </div>
                )}

                {/* Cuisine Types */}
                <div className="space-y-2 flex flex-col justify-end">
                  <Label>Cuisine Types *</Label>
                  <Controller
                    name="cuisineId"
                    control={control}
                    rules={{ required: true }}
                    defaultValue={[]}
                    render={({ field }) => {
                      const handleSelectChange = (cuisineId) => {
                        const currentValues = field.value || [];
                        if (currentValues.includes(cuisineId)) {
                          field.onChange(
                            currentValues.filter((id) => id !== cuisineId),
                          );
                        } else {
                          field.onChange([...currentValues, cuisineId]);
                        }
                      };

                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between font-normal text-left h-10 px-3 text-sm rounded-md"
                            >
                              <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden truncate">
                                {selectedCuisines.length > 0 ? (
                                  selectData?.allCuisines
                                    ?.filter((c) =>
                                      selectedCuisines.includes(String(c.id)),
                                    )
                                    ?.map((c) => (
                                      <Badge
                                        variant="secondary"
                                        key={c.id}
                                        className="text-[11px] font-normal px-1 h-5 flex items-center gap-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectChange(String(c.id));
                                        }}
                                      >
                                        {c.name}
                                        <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                                      </Badge>
                                    ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    Select Cuisines
                                  </span>
                                )}
                              </div>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search cuisines..."
                                className="h-9 text-xs"
                              />
                              <CommandList>
                                <CommandEmpty className="p-2 text-xs text-center text-gray-500">
                                  No cuisines found.
                                </CommandEmpty>
                                <CommandGroup>
                                  {selectData?.allCuisines?.map((c) => (
                                    <CommandItem
                                      key={c.id}
                                      value={c.name}
                                      className="text-xs py-1.5 px-2 cursor-pointer"
                                      onSelect={() =>
                                        handleSelectChange(String(c.id))
                                      }
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3.5 w-3.5",
                                          selectedCuisines.includes(
                                            String(c.id),
                                          )
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {c.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  {errors.cuisineId && (
                    <span className="text-xs text-red-500">
                      This field is required
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  {...register("tags")}
                  placeholder="Pizza, Burger, Fast Food..."
                />
              </div>
            </TabsContent>

            {/* 2. Location & Map */}

            {/* 3. Business Details */}
            <TabsContent value="business" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Owner First Name *</Label>
                  <Input {...register("ownerFirstName", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Owner Last Name *</Label>
                  <Input {...register("ownerLastName", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Owner Phone *</Label>
                  <Input {...register("ownerPhone", { required: true })} />
                </div>

                {isEdit && (
                  <>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        placeholder="Leave blank to keep current"
                        {...register("password")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input
                        type="password"
                        placeholder="Repeat new password"
                        {...register("confirmPassword", {
                          validate: (val) => {
                            const pwd = getValues("password");
                            if (!pwd) return true;
                            return val === pwd || "Passwords do not match";
                          },
                        })}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Min Delivery Time *</Label>
                  <Input
                    type="number"
                    {...register("minDeliveryTime", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Delivery Time *</Label>
                  <Input
                    type="number"
                    {...register("maxDeliveryTime", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Unit *</Label>
                  <Controller
                    name="deliveryTimeUnit"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Minutes">Minutes</SelectItem>
                          <SelectItem value="Hours">Hours</SelectItem>
                          <SelectItem value="Days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tax Number</Label>
                  <Input {...register("taxNumber")} />
                </div>
                <div className="space-y-2">
                  <Label>Tax Expire Date</Label>
                  <Input type="date" {...register("taxExpireDate")} />
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            {/* 4. Identity & Media */}
            <TabsContent value="images" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg space-y-2">
                  <Label className="text-blue-600 font-bold">
                    Restaurant Logo *
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileToBase64(e, "logo")}
                  />
                  {watch("logo") && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={watch("logo")}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                        Current
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <Label className="text-blue-600 font-bold">
                    Cover Image *
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileToBase64(e, "cover")}
                  />
                  {watch("cover") && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={watch("cover")}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                        Current
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-2 col-span-full">
                  <Label className="text-blue-600 font-bold">
                    Tax Certificate (PDF or Image)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileToBase64(e, "taxCertificate")}
                  />
                  {watch("taxCertificate") &&
                    !watch("taxCertificate").includes("application/pdf") && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={watch("taxCertificate")}
                          alt="Certificate Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                          Current
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </TabsContent>

            {/* 5. Business Plan */}
            <TabsContent value="business-plan">
              <BusinessPlanTab restaurantId={id} />
            </TabsContent>
          </Tabs>
        );
      }}
    </AddPage>
  );
};

export default RestaurantAdd;
