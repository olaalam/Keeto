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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DeliveryZoneAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  // 1. جلب بيانات الـ Zones لتعبئة القائمة
  const { data: DeliveryZone = [], isLoading } = useQuery({
    queryKey: ["DeliveryZone"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/zone-delivery-fees/all");
      return Array.isArray(res.data.data.data) ? res.data.data.data : [];
    },
  });

  // 2. جلب بيانات التعديل إن وجدت
  const { data: zoneDeliveryData, isLoading: isFetching } = useQuery({
    queryKey: ["DeliveryZone", id],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/superadmin/zone-delivery-fees/${id}`,
      );
      return data.data.data;
    },
    enabled: !!id && !state?.zoneDeliveryData,
  });

  const rawData = state?.zoneDeliveryData || zoneDeliveryData;

  const initialData = React.useMemo(() => {
    if (!rawData) return null;

    return {
      ...rawData,
      fromZoneId: rawData.fromZoneId
        ? String(rawData.fromZoneId)
        : String(rawData.fromZone?.id || ""),
      toZoneId: rawData.toZoneId
        ? String(rawData.toZoneId)
        : String(rawData.toZone?.id || ""),
      fee: rawData.fee,
    };
  }, [rawData]);

  if (isLoading || (id && isFetching)) return <LoadingSpinner />;

  return (
    <AddPage
      title="DeliveryZone"
      apiUrl="/api/superadmin/zone-delivery-fees"
      queryKey="DeliveryZone"
      fields={[]} // نتركها فارغة لأننا سنقوم ببناء التصميم يدوياً بالأسفل
      initialData={initialData}
      onSuccessAction={() => {
        window.history.back();
      }}
    >
      {(methods) => {
        const {
          register,
          control,
          formState: { errors },
        } = methods;

        return (
          <div className="space-y-4 mt-4 max-w-xl">
            {/* 1. From Zone Search Select */}
            <div className="space-y-2 flex flex-col w-full">
              <Label className="text-xs font-medium">From Zone *</Label>
              <Controller
                name="fromZoneId"
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
                          ? DeliveryZone.find(
                              (z) => String(z.id) === field.value,
                            )?.name
                          : "Select From Zone"}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command className="text-xs">
                        <CommandInput
                          placeholder="Search zone..."
                          className="h-8 text-xs"
                        />
                        <CommandList>
                          <CommandEmpty className="p-2 text-xs text-center text-gray-500">
                            No results found.
                          </CommandEmpty>
                          <CommandGroup>
                            {DeliveryZone.map((z) => (
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
              {errors.fromZoneId && (
                <span className="text-[11px] text-red-500">
                  From Zone field is required
                </span>
              )}
            </div>

            {/* 2. To Zone Search Select */}
            <div className="space-y-2 flex flex-col w-full">
              <Label className="text-xs font-medium">To Zone *</Label>
              <Controller
                name="toZoneId"
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
                          ? DeliveryZone.find(
                              (z) => String(z.id) === field.value,
                            )?.name
                          : "Select To Zone"}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command className="text-xs">
                        <CommandInput
                          placeholder="Search zone..."
                          className="h-8 text-xs"
                        />
                        <CommandList>
                          <CommandEmpty className="p-2 text-xs text-center text-gray-500">
                            No results found.
                          </CommandEmpty>
                          <CommandGroup>
                            {DeliveryZone.map((z) => (
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
              {errors.toZoneId && (
                <span className="text-[11px] text-red-500">
                  To Zone field is required
                </span>
              )}
            </div>

            {/* 3. Delivery Fee Field */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Fee *</Label>
              <Input
                type="number"
                {...register("fee", { required: true })}
                placeholder="0.00"
                className="h-9 text-xs rounded-md"
              />
              {errors.fee && (
                <span className="text-[11px] text-red-500">
                  Fee field is required
                </span>
              )}
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default DeliveryZoneAdd;
