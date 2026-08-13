import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BusinessPlanAdd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ["restaurants-list"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/restaurants");
      return res.data?.data?.data || [];
    },
  });

  const { data: planData, isLoading: isFetching } = useQuery({
    queryKey: ["business-plan", id],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/superadmin/businessplans/restaurant/${id}`,
      );
      return data.data.data;
    },
    enabled: isEdit,
  });

  const initialData = React.useMemo(() => {
    if (isEdit && !planData) return null;

    const data = {
      restaurantId: "",
      online_web_commissionRate: "0.00",
      online_web_serviceFee: "0.00",
      online_app_commissionRate: "0.00",
      online_app_serviceFee: "0.00",
      aggregator_commissionRate: "0.00",
      aggregator_serviceFee: "0.00",
      mykeeto_commissionRate: "0.00",
      mykeeto_serviceFee: "0.00",
      isMonthlyActive: false,
      monthlyAmount: "0.00",
      isQuarterlyActive: false,
      quarterlyAmount: "0.00",
      isAnnuallyActive: false,
      annuallyAmount: "0.00",
    };

    if (planData) {
      // The restaurant-scoped endpoint returns one row per platformType
      // (online_order_web, online_order_app, food_aggregator, mykeeto, pos),
      // so normalize to an array.
      const plans = Array.isArray(planData) ? planData : [planData];

      data.restaurantId =
        String(id) || plans[0]?.restaurantId || plans[0]?.restaurant?.id || "";

      plans.forEach((plan) => {
        const pType = (plan.platformType || "").toLowerCase();

        if (pType === "online_order_web") {
          data.online_web_id = plan.id;
          data.online_web_commissionRate = plan.commissionRate || "0.00";
          data.online_web_serviceFee = plan.serviceFee || "0.00";
        } else if (pType === "online_order_app") {
          data.online_app_id = plan.id;
          data.online_app_commissionRate = plan.commissionRate || "0.00";
          data.online_app_serviceFee = plan.serviceFee || "0.00";
        } else if (pType === "food_aggregator") {
          data.aggregator_id = plan.id;
          data.aggregator_commissionRate = plan.commissionRate || "0.00";
          data.aggregator_serviceFee = plan.serviceFee || "0.00";
        } else if (pType === "mykeeto") {
          data.mykeeto_id = plan.id;
          data.mykeeto_commissionRate = plan.commissionRate || "0.00";
          data.mykeeto_serviceFee = plan.serviceFee || "0.00";
        } else if (pType === "") {
          // The subscription/POS row carries an empty platformType in the API.
          data.pos_id = plan.id;
        }

        // Subscription / fixed-fee settings are shared across platforms for a
        // restaurant, so any row carrying them is sufficient to populate the form.
        if (
          plan.isMonthlyActive ||
          plan.isQuarterlyActive ||
          plan.isAnnuallyActive
        ) {
          data.isMonthlyActive = !!plan.isMonthlyActive;
          data.monthlyAmount = plan.monthlyAmount || "0.00";
          data.isQuarterlyActive = !!plan.isQuarterlyActive;
          data.quarterlyAmount = plan.quarterlyAmount || "0.00";
          data.isAnnuallyActive = !!plan.isAnnuallyActive;
          data.annuallyAmount = plan.annuallyAmount || "0.00";
        }
      });

      // AddPage decides Edit vs Add from `initialData?.id`, and builds the
      // update URL from that same id (initialData?.id || data?.id in its
      // onSubmit). We want that to be an actual business-plan row id — not
      // the restaurant id — so pick the first available platform's plan id.
      data.id =
        data.online_web_id ||
        data.online_app_id ||
        data.aggregator_id ||
        data.mykeeto_id ||
        data.pos_id ||
        undefined;
    }

    return data;
  }, [planData, isEdit, id]);

  if ((isEdit && isFetching) || isRestaurantsLoading) return <LoadingSpinner />;

  return (
    <AddPage
      title="Business Plan"
      apiUrl="/api/superadmin/businessplans"
      queryKey="business-plans"
      fields={[]}
      initialData={initialData}
      onSuccessAction={() => navigate("/business-plans")}
      customSubmit={
        isEdit
          ? async (updates) => {
              // updates is the array returned by transformPayload below:
              // [{ id, payload }, ...] — one flat PUT per existing platform row.
              return Promise.all(
                updates.map((u) =>
                  api.put(`/api/superadmin/businessplans/${u.id}`, u.payload),
                ),
              );
            }
          : undefined
      }
      transformPayload={(data) => {
        const formatAmount = (val) => {
          if (val === undefined || val === null || String(val).trim() === "") {
            return "0.00";
          }
          return String(val);
        };

        // 1. EDIT MODE: Build one flat payload per platform row that already
        // exists for this restaurant. The API's PUT endpoint only understands
        // a flat body per row (it builds its SQL SET clause straight from the
        // top-level keys) — it does not accept a nested businessPlans array.
        // customSubmit (below) fires one PUT per entry.
        if (isEdit) {
          const buildFlatPayload = (comm, fee) => ({
            commissionRate: formatAmount(comm),
            commission_rate: formatAmount(comm),
            serviceFee: formatAmount(fee),
            service_fee: formatAmount(fee),

            isMonthlyActive: !!data.isMonthlyActive,
            is_monthly_active: data.isMonthlyActive ? 1 : 0,
            monthlyAmount: data.isMonthlyActive
              ? formatAmount(data.monthlyAmount)
              : "0.00",
            monthly_amount: data.isMonthlyActive
              ? formatAmount(data.monthlyAmount)
              : "0.00",

            isQuarterlyActive: !!data.isQuarterlyActive,
            is_quarterly_active: data.isQuarterlyActive ? 1 : 0,
            quarterlyAmount: data.isQuarterlyActive
              ? formatAmount(data.quarterlyAmount)
              : "0.00",
            quarterly_amount: data.isQuarterlyActive
              ? formatAmount(data.quarterlyAmount)
              : "0.00",

            isAnnuallyActive: !!data.isAnnuallyActive,
            is_annually_active: data.isAnnuallyActive ? 1 : 0,
            annuallyAmount: data.isAnnuallyActive
              ? formatAmount(data.annuallyAmount)
              : "0.00",
            annually_amount: data.isAnnuallyActive
              ? formatAmount(data.annuallyAmount)
              : "0.00",
          });

          const updates = [
            {
              id: data.online_web_id,
              payload: buildFlatPayload(
                data.online_web_commissionRate,
                data.online_web_serviceFee,
              ),
            },
            {
              id: data.online_app_id,
              payload: buildFlatPayload(
                data.online_app_commissionRate,
                data.online_app_serviceFee,
              ),
            },
            {
              id: data.aggregator_id,
              payload: buildFlatPayload(
                data.aggregator_commissionRate,
                data.aggregator_serviceFee,
              ),
            },
            {
              id: data.mykeeto_id,
              payload: buildFlatPayload(
                data.mykeeto_commissionRate,
                data.mykeeto_serviceFee,
              ),
            },
            {
              id: data.pos_id,
              payload: buildFlatPayload("0.00", "0.00"),
            },
          ].filter((u) => u.id); // only rows that already exist can be PUT

          return updates;
        }

        // 2. CREATE MODE: Return nested array structure for bulk platform creation
        const subscriptionFields = {
          isMonthlyActive: !!data.isMonthlyActive,
          monthlyAmount: data.isMonthlyActive
            ? formatAmount(data.monthlyAmount)
            : "0.00",
          isQuarterlyActive: !!data.isQuarterlyActive,
          quarterlyAmount: data.isQuarterlyActive
            ? formatAmount(data.quarterlyAmount)
            : "0.00",
          isAnnuallyActive: !!data.isAnnuallyActive,
          annuallyAmount: data.isAnnuallyActive
            ? formatAmount(data.annuallyAmount)
            : "0.00",
        };

        const businessPlans = [
          {
            platformType: "online_order_web",
            commissionRate: formatAmount(data.online_web_commissionRate),
            serviceFee: formatAmount(data.online_web_serviceFee),
            ...subscriptionFields,
          },
          {
            platformType: "online_order_app",
            commissionRate: formatAmount(data.online_app_commissionRate),
            serviceFee: formatAmount(data.online_app_serviceFee),
            ...subscriptionFields,
          },
          {
            platformType: "food_aggregator",
            commissionRate: formatAmount(data.aggregator_commissionRate),
            serviceFee: formatAmount(data.aggregator_serviceFee),
            ...subscriptionFields,
          },
          {
            platformType: "mykeeto",
            commissionRate: formatAmount(data.mykeeto_commissionRate),
            serviceFee: formatAmount(data.mykeeto_serviceFee),
            ...subscriptionFields,
          },
          {
            platformType: "",
            commissionRate: "0.00",
            serviceFee: "0.00",
            isOn: true,
            ...subscriptionFields,
          },
        ];

        return {
          restaurantId: data.restaurantId,
          businessPlans: businessPlans,
        };
      }}
    >
      {(methods) => {
        const {
          register,
          control,
          watch,
          formState: { errors },
        } = methods;

        const watchMonthly = watch("isMonthlyActive");
        const watchQuarterly = watch("isQuarterlyActive");
        const watchAnnually = watch("isAnnuallyActive");

        return (
          <div className="space-y-8 mt-4">
            <div className="p-4 border rounded-lg bg-white space-y-4">
              <div className="space-y-2 w-full md:w-1/2">
                <Label>Restaurant *</Label>
                <Controller
                  name="restaurantId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.restaurantId && (
                  <span className="text-xs text-red-500">
                    This field is required
                  </span>
                )}
              </div>

              {/* Multi-Platform Table */}
              <div className="border rounded-lg overflow-hidden bg-white text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 font-semibold text-gray-600 w-1/5">
                        Platform
                      </th>
                      <th className="p-3 font-semibold text-gray-700 text-center border-l">
                        Online Order (Web)
                      </th>
                      <th className="p-3 font-semibold text-gray-700 text-center border-l">
                        Online Order (App)
                      </th>
                      <th className="p-3 font-semibold text-gray-700 text-center border-l">
                        Aggregator
                      </th>
                      <th className="p-3 font-semibold text-gray-700 text-center border-l">
                        Mykeeto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium text-gray-600 bg-gray-50/50">
                        Commission Rate (%)
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("online_web_commissionRate")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("online_app_commissionRate")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("aggregator_commissionRate")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("mykeeto_commissionRate")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-gray-600 bg-gray-50/50">
                        Service Fee
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("online_web_serviceFee")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("online_app_serviceFee")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("aggregator_serviceFee")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-l">
                        <Input
                          type="number"
                          step="0.01"
                          {...register("mykeeto_serviceFee")}
                          className="h-8 text-center"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subscriptions / Fixed Fees */}
            <div className="border rounded-lg p-4 bg-gray-50/30 space-y-4">
              <div className="text-xs font-bold text-gray-700 border-b pb-2 uppercase tracking-wider">
                Subscriptions & Fixed Fees (POS)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly */}
                <div className="bg-white p-4 border rounded-md flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700">
                      Monthly
                    </Label>
                    <Controller
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
                    className={`space-y-2 transition-opacity ${watchMonthly ? "opacity-100" : "opacity-40"}`}
                  >
                    <Label className="text-xs text-gray-500">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      disabled={!watchMonthly}
                      {...register("monthlyAmount")}
                      className="h-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Quarterly */}
                <div className="bg-white p-4 border rounded-md flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700">
                      Quarterly
                    </Label>
                    <Controller
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
                    className={`space-y-2 transition-opacity ${watchQuarterly ? "opacity-100" : "opacity-40"}`}
                  >
                    <Label className="text-xs text-gray-500">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      disabled={!watchQuarterly}
                      {...register("quarterlyAmount")}
                      className="h-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Annually */}
                <div className="bg-white p-4 border rounded-md flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700">
                      Annually
                    </Label>
                    <Controller
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
                    className={`space-y-2 transition-opacity ${watchAnnually ? "opacity-100" : "opacity-40"}`}
                  >
                    <Label className="text-xs text-gray-500">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      disabled={!watchAnnually}
                      {...register("annuallyAmount")}
                      className="h-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default BusinessPlanAdd;
