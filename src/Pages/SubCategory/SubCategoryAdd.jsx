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

const SubCategoryAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  // جلب قائمة التصنيفات والمطاعم من الـ الـ API المحدد
  const { data: selectData = {}, isLoading } = useQuery({
    queryKey: ["subcategoriesSelectData"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/subcategories/select");
      // مطابقة كاملة لمسار الـ JSON الراجع: res.data.data.data
      return res.data?.data?.data || {};
    },
  });

  // استخراج المصفوفات بشكل صحيح بناءً على مفاتيح الـ الـ JSON (categories و restaurants)
  const categories = Array.isArray(selectData.categories)
    ? selectData.categories
    : [];
  const restaurants = Array.isArray(selectData.restaurants)
    ? selectData.restaurants
    : [];

  // جلب بيانات التعديل إن وجدت
  const { data: subcategoryData, isLoading: isFetching } = useQuery({
    queryKey: ["subcategory", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/subcategories/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.subcategoryData,
  });

  const rawData = state?.subcategoryData || subcategoryData;

  // تجهيز البيانات الابتدائية وتحويل الـ IDs لنصوص منعاً للمشاكل
  const initialData = React.useMemo(() => {
    if (!rawData) return null;

    // التحقق من كلا الحالتين للاحتياط أثناء التعديل (تحسباً لو كان الـ API القديم يعيد المفتاح القديم)
    const exactRestaurantId =
      rawData.restaurantId || rawData.restaurantid || "";

    return {
      ...rawData,
      categoryId: rawData.categoryId
        ? String(rawData.categoryId)
        : String(rawData.category?.id || ""),
      restaurantId: exactRestaurantId ? String(exactRestaurantId) : "",
    };
  }, [rawData]);

  if (isLoading || (id && isFetching)) return <LoadingSpinner />;

  return (
    <AddPage
      title="subcategory"
      apiUrl="/api/superadmin/subcategories"
      queryKey="subcategories"
      fields={[]} // رسم الحقول يدوياً بالأسفل
      initialData={initialData}
      onSuccessAction={() => {
        window.history.back();
      }}
      beforeSubmit={(data) => ({
        ...data,
        categoryId: data.categoryId ? String(data.categoryId) : "",
        restaurantId: data.restaurantId ? String(data.restaurantId) : "",
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

            {/* 4. Restaurant Search Select */}
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
                      className="w-[var(--radix-popover-trigger-width)] p-0"
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

            {/* 5. Category Search Select */}
            <div className="space-y-2 flex flex-col w-full">
              <Label className="text-xs font-medium">Category *</Label>
              <Controller
                name="categoryId"
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
                          ? categories.find((c) => String(c.id) === field.value)
                              ?.name
                          : "Select Category"}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command className="text-xs">
                        <CommandInput
                          placeholder="Search category..."
                          className="h-8 text-xs"
                        />
                        <CommandList>
                          <CommandEmpty className="p-2 text-xs text-center text-gray-500">
                            No categories found.
                          </CommandEmpty>
                          <CommandGroup>
                            {categories.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                className="text-xs py-1.5 px-2 cursor-pointer"
                                onSelect={() => {
                                  field.onChange(String(c.id));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3.5 w-3.5",
                                    String(c.id) === field.value
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
                )}
              />
              {errors.categoryId && (
                <span className="text-[11px] text-red-500">
                  Category selection is required
                </span>
              )}
            </div>

            {/* 6. Priority Select */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Priority *</Label>
              <Controller
                name="priority"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">
                        Low
                      </SelectItem>
                      <SelectItem value="medium" className="text-xs">
                        Medium
                      </SelectItem>
                      <SelectItem value="high" className="text-xs">
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <span className="text-[11px] text-red-500">
                  Priority field is required
                </span>
              )}
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default SubCategoryAdd;
