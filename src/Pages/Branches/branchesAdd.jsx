import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

// Shadcn UI & Icons Components
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const BranhesAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  // جلب قائمة التصنيفات والمطاعم من الـ الـ API المحدد
  const { data: selectData = {}, isLoading } = useQuery({
    queryKey: ["BranchesSelectData"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/branches/select");

      return res.data?.data?.data || {};
    },
  });

  const selectPayload = React.useMemo(() => {
    if (!selectData || typeof selectData !== "object") return {};

    if (selectData?.data?.data && typeof selectData.data.data === "object") {
      return selectData.data.data;
    }

    if (selectData?.data && typeof selectData.data === "object") {
      return selectData.data;
    }

    return selectData;
  }, [selectData]);

  const restaurants = React.useMemo(() => {
    const list = selectPayload?.restaurant ?? selectPayload?.restaurants ?? [];
    return Array.isArray(list) ? list : [];
  }, [selectPayload]);

  const zones = React.useMemo(() => {
    const list = selectPayload?.zone ?? selectPayload?.zones ?? [];
    return Array.isArray(list) ? list : [];
  }, [selectPayload]);

  const { data: BrancheData, isLoading: isFetching } = useQuery({
    queryKey: ["BranchAdd", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/branches/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.subcategoryData,
  });

  const rawData = state?.BrancheData || BrancheData;

  // تجهيز البيانات الابتدائية وتحويل الـ IDs لنصوص منعاً للمشاكل
  const initialData = React.useMemo(() => {
    if (!rawData) return null;

    const exactRestaurantId =
      rawData.restaurantId || rawData.restaurantid || "";
    const matchedRestaurant =
      restaurants.find(
        (item) => String(item.id) === String(exactRestaurantId),
      ) ||
      (rawData.restaurantName
        ? restaurants.find(
            (item) =>
              normalizeText(item.name) ===
              normalizeText(rawData.restaurantName),
          )
        : null);

    const exactZoneId = rawData.zoneId || rawData.zone?.id || "";

    return {
      ...rawData,
      name: rawData.name ?? "",
      nameAr: rawData.nameAr ?? "",
      nameFr: rawData.nameFr ?? "",
      address: rawData.address ?? "",
      addressAr: rawData.addressAr ?? "",
      addressFr: rawData.addressFr ?? "",
      deliveryRadiusKm:
        rawData.deliveryRadiusKm ?? rawData.deliveryRadius ?? "",
      phoneNumber: rawData.phoneNumber ?? "",
      lat: rawData.lat ?? "",
      lng: rawData.lng ?? "",
      restaurantId: matchedRestaurant
        ? String(matchedRestaurant.id)
        : exactRestaurantId
          ? String(exactRestaurantId)
          : "",
      zoneId: exactZoneId ? String(exactZoneId) : "",
    };
  }, [rawData, normalizeText, restaurants]);

  if (isLoading || (id && isFetching)) return <LoadingSpinner />;

  return (
    <AddPage
      title="Branches"
      apiUrl="/api/superadmin/branches"
      queryKey="BranchAdd"
      fields={[]}
      initialData={initialData}
      onSuccessAction={() => {
        window.history.back();
      }}
      beforeSubmit={(data) => ({
        ...data,
        restaurantId: data.restaurantId ? String(data.restaurantId) : "",
        zoneId: data.zoneId ? String(data.zoneId) : "",
        deliveryRadiusKm: data.deliveryRadiusKm
          ? Number(data.deliveryRadiusKm)
          : 0,
        lat: data.lat ? Number(data.lat) : null,
        lng: data.lng ? Number(data.lng) : null,
        phoneNumber: data.phoneNumber ? String(data.phoneNumber) : "",
      
      })}
    >
      {(methods) => {
        const {
          register,
          control,
          formState: { errors },
        } = methods;

        return (
          <div className="space-y-4 mt-4 max-w-xl">
            {/* 1. Name (EN) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Name *</Label>
              <Input
                {...register("name", { required: true })}
                placeholder="Subcategory Name"
                className="h-9 text-xs rounded-md"
              />
              {errors.name && (
                <span className="text-[11px] text-red-500">
                  Name field is required
                </span>
              )}
            </div>

            {/* 2. Name (AR) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Name (AR) *</Label>
              <Input
                {...register("nameAr", { required: true })}
                placeholder="الاسم بالعربي"
                className="h-9 text-xs rounded-md"
              />
              {errors.nameAr && (
                <span className="text-[11px] text-red-500">
                  Arabic Name field is required
                </span>
              )}
            </div>

            {/* 3. Name (FR) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Name (FR) *</Label>
              <Input
                {...register("nameFr", { required: true })}
                placeholder="Nom en français"
                className="h-9 text-xs rounded-md"
              />
              {errors.nameFr && (
                <span className="text-[11px] text-red-500">
                  French Name field is required
                </span>
              )}
            </div>

            {/* 4. Address */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Address</Label>
              <Input
                {...register("address")}
                placeholder="Enter address"
                className="h-9 text-xs rounded-md"
              />
            </div>

            {/* 5. Address (AR) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Address (AR)</Label>
              <Input
                {...register("addressAr")}
                placeholder="العنوان بالعربي"
                className="h-9 text-xs rounded-md"
              />
            </div>

            {/* 6. Address (FR) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Address (FR)</Label>
              <Input
                {...register("addressFr")}
                placeholder="Adresse en français"
                className="h-9 text-xs rounded-md"
              />
            </div>

            {/* 7. Delivery Radius */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Delivery Radius (KM)
              </Label>
              <Input
                {...register("deliveryRadiusKm")}
                type="number"
                step="0.1"
                placeholder="0.00"
                className="h-9 text-xs rounded-md"
              />
            </div>

            {/* 8. Phone Number */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Phone Number</Label>
              <Input
                {...register("phoneNumber")}
                placeholder="Phone number"
                className="h-9 text-xs rounded-md"
              />
            </div>

         
            {/* 10. Zone Search Select */}
            <div className="space-y-2 flex flex-col w-full">
              <Label className="text-xs font-medium">Zone</Label>
              <Controller
                name="zoneId"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal text-left h-9 px-3 text-xs rounded-md",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? zones.find((z) => String(z.id) === field.value)
                              ?.name
                          : "Select Zone"}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0"
                      align="start"
                    >
                      <Command className="text-xs">
                        <CommandInput
                          placeholder="Search zone..."
                          className="h-8 text-xs"
                        />
                        <CommandList>
                          <CommandEmpty className="p-2 text-xs text-center text-gray-500">
                            No zones found.
                          </CommandEmpty>
                          <CommandGroup>
                            {zones.map((z) => (
                              <CommandItem
                                key={z.id}
                                value={z.name}
                                className="text-xs py-1.5 px-2 cursor-pointer"
                                onSelect={() => {
                                  field.onChange(String(z.id));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3.5 w-3.5",
                                    String(z.id) === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {z.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            {/* 11. Restaurant Search Select */}
            <div className="space-y-2 flex flex-col w-full">
              <Label className="text-xs font-medium">Restaurant *</Label>
              <Controller
                name="restaurantId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal text-left h-9 px-3 text-xs rounded-md",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? restaurants.find(
                              (r) => String(r.id) === field.value,
                            )?.name
                          : "Select Restaurant"}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0"
                      align="start"
                    >
                      <Command className="text-xs">
                        <CommandInput
                          placeholder="Search restaurant..."
                          className="h-8 text-xs"
                        />
                        <CommandList>
                          <CommandEmpty className="p-2 text-xs text-center text-gray-500">
                            No restaurants found.
                          </CommandEmpty>
                          <CommandGroup>
                            {restaurants.map((r) => (
                              <CommandItem
                                key={r.id}
                                value={r.name}
                                className="text-xs py-1.5 px-2 cursor-pointer"
                                onSelect={() => {
                                  field.onChange(String(r.id));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3.5 w-3.5",
                                    String(r.id) === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {r.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.restaurantId && (
                <span className="text-[11px] text-red-500">
                  Restaurant selection is required
                </span>
              )}
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default BranhesAdd;
