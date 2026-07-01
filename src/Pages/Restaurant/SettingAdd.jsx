import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

const SettingAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { data: fullData, isLoading: isFetching } = useQuery({
    queryKey: ["setting", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/restaurantsetting/${id}`);
      return data.data;
    },
    enabled: !!id && !state?.settingData,
  });

  const rawData = state?.settingData || fullData;
  const defaultInitialData = {
    foodManagement: false,
    scheduledDelivery: false,
    reviewsSection: false,
    posSection: true,
    selfDelivery: false,
    homeDelivery: true,
    takeaway: true,
    orderSubscription: false,
    instantOrder: false,
    halalTagStatus: true,
    dineIn: true,
    isTemporarilyClosed:true,
    vegType: "BOTH",
    canEditOrder: true,
    minOrderAmount: 50,
    minDeliveryTime: 15,
    maxDeliveryTime: 45,
    isAlwaysOpen: false,
    isSameTimeEveryDay: false,
    schedules: [
      {
        dayOfWeek: 0,
        isOffDay: false,
        openingTime: "09:00",
        closingTime: "23:00",
      },
      {
        dayOfWeek: 1,
        isOffDay: false,
        openingTime: "09:00",
        closingTime: "23:00",
      },
      {
        dayOfWeek: 2,
        isOffDay: false,
        openingTime: "09:00",
        closingTime: "23:00",
      },
      {
        dayOfWeek: 3,
        isOffDay: false,
        openingTime: "09:00",
        closingTime: "23:00",
      },
      {
        dayOfWeek: 4,
        isOffDay: false,
        openingTime: "09:00",
        closingTime: "23:00",
      },
      { dayOfWeek: 5, isOffDay: true, openingTime: "", closingTime: "" },
      {
        dayOfWeek: 6,
        isOffDay: false,
        openingTime: "09:00",
        closingTime: "23:00",
      },
    ],
  };
  // تهيئة البيانات والاحتفاظ بـ id المطعم داخلياً داخل الـ form بدون وضعه في الـ URL
  const initialData = React.useMemo(() => {
    if (!rawData) return null;

    // تأمين صيغة الوقت لتكون hh:mm فقط لتناسب حقول الوقت في الـ HTML
    const formattedSchedules = (rawData.schedules || []).map((s) => ({
      dayOfWeek: Number(s.dayOfWeek),
      isOffDay: !!s.isOffDay,
      openingTime: s.openingTime ? s.openingTime.substring(0, 5) : "",
      closingTime: s.closingTime ? s.closingTime.substring(0, 5) : "",
    }));

    return {
      id: rawData.settings?.id || rawData.id,
      foodManagement: rawData.settings?.foodManagement ?? false,
      scheduledDelivery: rawData.settings?.scheduledDelivery ?? false,
      reviewsSection: rawData.settings?.reviewsSection ?? false,
      posSection: rawData.settings?.posSection ?? true,
      selfDelivery: rawData.settings?.selfDelivery ?? false,
      homeDelivery: rawData.settings?.homeDelivery ?? true,
      takeaway: rawData.settings?.takeaway ?? true,
      orderSubscription: rawData.settings?.orderSubscription ?? false,
      instantOrder: rawData.settings?.instantOrder ?? false,
      halalTagStatus: rawData.settings?.halalTagStatus ?? true,
      dineIn: rawData.settings?.dineIn ?? true,
      isTemporarilyClosed:rawData.settings?.isTemporarilyClosed?? true,
      vegType: rawData.settings?.vegType || "BOTH",
      canEditOrder: rawData.settings?.canEditOrder ?? true,
      minOrderAmount: rawData.settings?.minOrderAmount ?? 50,
      minDeliveryTime: rawData.settings?.minDeliveryTime ?? 15,
      maxDeliveryTime: rawData.settings?.maxDeliveryTime ?? 45,
      isAlwaysOpen: rawData.settings?.isAlwaysOpen ?? false,
      isSameTimeEveryDay: rawData.settings?.isSameTimeEveryDay ?? false,
      schedules:
        formattedSchedules.length > 0
          ? formattedSchedules
          : defaultInitialData.schedules,
    };
    // تحويل الكائن لنص بيضمن استقرار الـ useMemo ومنع الـ Infinite Loops تماماً مع الـ Forms
  }, [JSON.stringify(rawData)]);

  const daysOfWeekOptions = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const handleTransformPayload = (data) => {
    return {
      settings: {
        foodManagement: data.foodManagement ?? false,
        scheduledDelivery: data.scheduledDelivery ?? false,
        reviewsSection: data.reviewsSection ?? false,
        posSection: data.posSection ?? true,
        selfDelivery: data.selfDelivery ?? false,
        homeDelivery: data.homeDelivery ?? true,
        takeaway: data.takeaway ?? true,
        orderSubscription: data.orderSubscription ?? false,
        instantOrder: data.instantOrder ?? false,
        halalTagStatus: data.halalTagStatus ?? true,
        dineIn: data.dineIn ?? true,
        vegType: data.vegType || "BOTH",
        canEditOrder: data.canEditOrder ?? true,
        minOrderAmount: Number(data.minOrderAmount) || 50,
        minDeliveryTime: Number(data.minDeliveryTime) || 15,
        maxDeliveryTime: Number(data.maxDeliveryTime) || 45,
        isAlwaysOpen: data.isAlwaysOpen ?? false,
        isTemporarilyClosed:data.isTemporarilyClosed ?? true,
        isSameTimeEveryDay: data.isSameTimeEveryDay ?? false,
      },
      schedules: (data.schedules || []).map((schedule) => ({
        dayOfWeek: Number(schedule.dayOfWeek),
        isOffDay: schedule.isOffDay ?? false,
        openingTime: schedule.isOffDay ? null : schedule.openingTime || null,
        closingTime: schedule.isOffDay ? null : schedule.closingTime || null,
      })),
    };
  };

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title="Store Settings"
      apiUrl={`/api/superadmin/restaurantsetting/${id}`}
      queryKey={["restaurant-settings", id]}
      method="PUT"
      bypassIdInEdit={true} // 💡 إضافة خاصية مخصصة لإخبار AddPage بعدم دمج الـ ID في الرابط
      transformPayload={handleTransformPayload}
      initialData={initialData || defaultInitialData}
      onSuccessAction={() => {
        window.history.back();
      }}
    >
      {(methods) => {
        const { control, register, watch, setValue } = methods;

        const { fields, append, remove } = useFieldArray({
          control,
          name: "schedules",
        });

        const schedulesWatch = watch("schedules") || [];

        return (
          <div className="space-y-8 mt-6 border-t pt-6 col-span-full">
            {/* General Settings Section */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">
                General Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/20 p-4 rounded-lg">
                {[
                  { name: "foodManagement", label: "Food Management" },
                  { name: "scheduledDelivery", label: "Scheduled Delivery" },
                  { name: "reviewsSection", label: "Reviews Section" },
                  { name: "posSection", label: "POS Section" },
                  { name: "selfDelivery", label: "Self Delivery" },
                  { name: "homeDelivery", label: "Home Delivery" },
                  { name: "takeaway", label: "Takeaway" },
                  { name: "orderSubscription", label: "Order Subscription" },
                  { name: "instantOrder", label: "Instant Order" },
                  { name: "halalTagStatus", label: "Halal Tag Status" },
                  { name: "dineIn", label: "Dine In" },
                  { name: "canEditOrder", label: "Can Edit Order" },
                  { name: "isAlwaysOpen", label: "Is Always Open" },
                  { name: "isSameTimeEveryDay", label: "Same Time Every Day" },
                  {name:"isTemporarilyClosed",label:"is Temporarily Closed"}
                ].map((sw) => (
                  <div
                    key={sw.name}
                    className="flex items-center justify-between p-3 border rounded bg-white shadow-sm"
                  >
                    <Label
                      htmlFor={sw.name}
                      className="cursor-pointer font-medium text-sm text-gray-700"
                    >
                      {sw.label}
                    </Label>
                    <Controller
                      name={sw.name}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Switch
                          checked={!!value}
                          onCheckedChange={onChange}
                          id={sw.name}
                        />
                      )}
                    />
                  </div>
                ))}

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Vegetarian Type (Veg Type)
                  </Label>
                  <input
                    {...register("vegType")}
                    className="w-full p-2 border rounded-md text-sm h-10 bg-white"
                    placeholder="BOTH"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Min Order Amount (EGP)
                  </Label>
                  <Input
                    type="number"
                    {...register("minOrderAmount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Min Delivery Time (Minutes)
                  </Label>
                  <Input
                    type="number"
                    {...register("minDeliveryTime", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Max Delivery Time (Minutes)
                  </Label>
                  <Input
                    type="number"
                    {...register("maxDeliveryTime", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            <hr className="my-6" />

            {/* Working Hours (Schedules) Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary">
                  Working Hours (Schedules)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      dayOfWeek: 0,
                      isOffDay: false,
                      openingTime: "09:00",
                      closingTime: "23:00",
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add New Shift
                </button>
              </div>

              <div className="space-y-4 bg-muted/10 p-4 rounded-lg">
                {fields.map((field, index) => {
                  const isOff = schedulesWatch[index]?.isOffDay;
                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-3 border rounded bg-white shadow-sm relative group"
                    >
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-gray-500 md:hidden">
                          Day
                        </Label>
                        <select
                          {...register(`schedules.${index}.dayOfWeek`, {
                            valueAsNumber: true,
                          })}
                          className="w-full p-2 border rounded-md text-sm h-9 bg-white"
                        >
                          {daysOfWeekOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-2 md:pt-0">
                        <Controller
                          name={`schedules.${index}.isOffDay`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Switch
                              checked={!!value}
                              onCheckedChange={(checked) => {
                                onChange(checked);
                                if (checked) {
                                  setValue(
                                    `schedules.${index}.openingTime`,
                                    "",
                                  );
                                  setValue(
                                    `schedules.${index}.closingTime`,
                                    "",
                                  );
                                } else {
                                  setValue(
                                    `schedules.${index}.openingTime`,
                                    "09:00",
                                  );
                                  setValue(
                                    `schedules.${index}.closingTime`,
                                    "23:00",
                                  );
                                }
                              }}
                            />
                          )}
                        />
                        <Label className="text-xs font-medium text-gray-600">
                          Off Day (Closed)
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500 shrink-0">
                          From:
                        </Label>
                        <Input
                          type="time"
                          disabled={isOff}
                          {...register(`schedules.${index}.openingTime`)}
                          className="h-9"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500 shrink-0">
                          To:
                        </Label>
                        <Input
                          type="time"
                          disabled={isOff}
                          {...register(`schedules.${index}.closingTime`)}
                          className="h-9"
                        />
                      </div>

                      <div className="flex justify-end pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Shift"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {fields.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No schedules added. Click "Add New Shift" to configure
                    working hours.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default SettingAdd;
