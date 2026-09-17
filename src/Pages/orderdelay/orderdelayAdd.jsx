import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Controller } from "react-hook-form";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

// 🔽 مكون Select قابل للبحث ومتعدد الاختيار (AddPage مفيهوش النوع ده جاهز،
// فبنبنيه هنا بنفس أسلوب الـ combobox الأصلي وبنمرره عن طريق children)
const SearchableMultiSelect = ({
  control,
  name,
  label,
  options,
  required,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const filteredOptions = searchVal.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchVal.toLowerCase()),
      )
    : options;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        defaultValue={[]}
        rules={{ required }}
        render={({ field: { onChange, value = [] } }) => {
          const safeValue = Array.isArray(value) ? value : [];

          const toggleOption = (optionValue) => {
            const stringValue = String(optionValue);
            const updated = safeValue.includes(stringValue)
              ? safeValue.filter((v) => v !== stringValue)
              : [...safeValue, stringValue];
            onChange(updated);
          };

          return (
            <div className="space-y-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal text-left h-10 bg-white border-input",
                      error ? "border-destructive text-destructive" : "",
                    )}
                  >
                    {safeValue.length > 0
                      ? `${safeValue.length} selected`
                      : `Select ${label}...`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder={`Search ${label}...`}
                      value={searchVal}
                      onValueChange={setSearchVal}
                    />
                    <CommandList>
                      <CommandEmpty>No results found</CommandEmpty>
                      <CommandGroup>
                        {filteredOptions?.map((option) => {
                          const isSelected = safeValue.includes(
                            String(option.value),
                          );
                          return (
                            <CommandItem
                              key={option.value}
                              value={String(option.value)}
                              onSelect={() => toggleOption(option.value)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {safeValue.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30">
                  {safeValue.map((val) => {
                    const option = options.find(
                      (o) => String(o.value) === String(val),
                    );
                    return (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-sm shadow-sm"
                      >
                        {option ? option.label : val}
                        <button
                          type="button"
                          onClick={() => toggleOption(val)}
                          className="hover:bg-primary-foreground/20 rounded-full w-3 h-3 inline-flex items-center justify-center text-[10px] font-bold"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }}
      />
      {error && <p className="text-destructive text-xs">required</p>}
    </div>
  );
};

const OrderDelayAlertAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const { data: OrderDelayAlert, isLoading: isFetching } = useQuery({
    queryKey: ["order-delay-alerts", id],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/superadmin/order-delay-alerts/${id}`,
      );
      return data.data.data;
    },
    enabled: !!id && !state?.OrderDelayAlert,
  });

  // 🔽 جلب قائمة المطاعم (id + name فقط) لاستخدامها كـ options في restaurantIds
  const { data: restaurants = [], isLoading: isFetchingRestaurants } = useQuery(
    {
      queryKey: ["restaurants-select-data"],
      queryFn: async () => {
        const { data } = await api.get(
          "/api/superadmin/restaurants/select-data",
        );
        return data.data.data;
      },
    },
  );

  const restaurantOptions = restaurants.map((r) => ({
    label: r.name,
    value: r.id,
  }));

  // 👈 نفس فكرة الأصل: نضمن إن الـ initialData تكون Flat ومفيهاش أوبجكتس متداخلة
  const rawData = state?.OrderDelayAlert || OrderDelayAlert;

  const initialData = rawData
    ? {
        id: rawData.id,
        isSuperAdmin:
          typeof rawData.isSuperAdmin === "boolean"
            ? rawData.isSuperAdmin
            : true,
        name:
          typeof rawData.name === "object" ? rawData.name.name : rawData.name,
        emails: Array.isArray(rawData.emails) ? rawData.emails.join(", ") : "",
        allRestaurants:
          typeof rawData.allRestaurants === "boolean"
            ? rawData.allRestaurants
            : false,
        restaurantIds: Array.isArray(rawData.restaurantIds)
          ? rawData.restaurantIds
          : [],
        maxDelayMinutes: rawData.maxDelayMinutes || "",
        orderStatus: Array.isArray(rawData.orderStatus)
          ? rawData.orderStatus
          : [],
        isActive:
          typeof rawData.isActive === "boolean" ? rawData.isActive : true,
      }
    : undefined;

  const orderDelayAlertFields = [
    {
      name: "name",
      label: "Name",
      required: true,
    },
    {
      name: "isSuperAdmin",
      label: "Super Admin Alert",
      type: "switch",
      required: false,
    },
    {
      // AddPage مفيهاش نوع حقل خاص بقوائم النصوص (tags)، فبنستخدم حقل نص عادي
      // ونكتب الإيميلات مفصولة بفاصلة، وبنحولها لمصفوفة في transformPayload قبل الإرسال
      name: "emails",
      label: "Emails (comma separated)",
      required: true,
      placeholder: "admin@example.com, alerts@example.com",
    },
    {
      name: "allRestaurants",
      label: "All Restaurants",
      type: "switch",
      required: false,
    },
    {
      name: "maxDelayMinutes",
      label: "Max Delay (Minutes)",
      type: "number",
      required: true,
    },
    {
      name: "orderStatus",
      label: "Order Status",
      type: "multi-select",
      required: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Preparing", value: "preparing" },
        { label: "Out For Delivery", value: "out_for_delivery" },
      ],
    },
    {
      name: "isActive",
      label: "Active",
      type: "switch",
      required: false,
    },
  ];

  if (id && (isFetching || isFetchingRestaurants)) return <LoadingSpinner />;

  // 🔽 بنحول قيمة emails من نص (comma separated) لمصفوفة زي ما الـ API محتاجها
  const transformPayload = (data) => ({
    ...data,
    emails:
      typeof data.emails === "string"
        ? data.emails
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : data.emails,
  });

  return (
    <AddPage
      title="Order Delay Alert"
      apiUrl="/api/superadmin/order-delay-alerts"
      queryKey="order-delay-alerts"
      fields={orderDelayAlertFields}
      initialData={initialData}
      transformPayload={transformPayload}
      onSuccessAction={() => {
        window.history.back();
      }}
    >
      {({ control, formState: { errors } }) => (
        <SearchableMultiSelect
          control={control}
          name="restaurantIds"
          label="Restaurants"
          options={restaurantOptions}
          required={false}
          error={errors?.restaurantIds}
        />
      )}
    </AddPage>
  );
};

export default OrderDelayAlertAdd;
