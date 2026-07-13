import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
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
import { ChevronsUpDown, Check, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const RestaurantAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [showFixedFees, setShowFixedFees] = useState(false);

  // جلب البيانات الخاصة بالقوائم المنسدلة (المطابخ مثلاً)
  const { data: selectData, isLoading: isLoadingSelect } = useQuery({
    queryKey: ["restaurantSelectData"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/restaurants/select");
      return res.data.data.data;
    },
  });

  // جلب بيانات المطعم في حالة التعديل وفرد الـ Business Plans داخل الفورم
  const { data: fetchedData, isLoading: isFetching } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/restaurants/${id}`);
      const raw = data.data.data;

      let initialCuisineIds = [];
      if (Array.isArray(raw.cuisineId)) {
        initialCuisineIds = raw.cuisineId.map(String);
      } else if (Array.isArray(raw.cuisines)) {
        initialCuisineIds = raw.cuisines.map((c) => String(c.id));
      } else if (raw.cuisineId) {
        initialCuisineIds = [String(raw.cuisineId)];
      }

      // قراءة الـ businessPlans القادمة من السيرفر وتوزيعها على الـ Inputs لصفحة الـ Edit
      const plans = raw.businessPlans || [];
      const onlinePlan =
        plans.find((p) => p.platformType === "online_order") || {};
      const aggregatorPlan =
        plans.find((p) => p.platformType === "food_aggregator") || {};
      const mykeetoPlan = plans.find((p) => p.platformType === "mykeeto") || {};
      const posPlan = plans.find((p) => p.platformType === "pos") || {};

      // أخذ قيم الاشتراكات من أي خطة متاحة أو من الـ POS
      const activePlanSource = plans.length > 0 ? plans[0] : {};

      return {
        ...raw,
        cuisineId: initialCuisineIds,
        zoneId: String(raw.zoneId || ""),
        tags: Array.isArray(raw.tags) ? raw.tags.join(", ") : raw.tags,
        deliveryTimeUnit: raw.deliveryTimeUnit || "Minutes",
        status: raw.status || "active",
        type: raw.type || raw.restauranttype || "",

        // ربط قيم الـ Business Plan بالـ inputs المؤقتة بالفورم لتعمل في الـ Edit تلقائياً
        online_commissionRate: onlinePlan.commissionRate || "",
        online_serviceFee: onlinePlan.serviceFee || "",

        aggregator_commissionRate: aggregatorPlan.commissionRate || "",
        aggregator_serviceFee: aggregatorPlan.serviceFee || "",

        mykeeto_commissionRate: mykeetoPlan.commissionRate || "",
        mykeeto_serviceFee: mykeetoPlan.serviceFee || "",

        isMonthlyActive: activePlanSource.isMonthlyActive || false,
        monthlyAmount: activePlanSource.monthlyAmount || "",
        isQuarterlyActive: activePlanSource.isQuarterlyActive || false,
        quarterlyAmount: activePlanSource.quarterlyAmount || "",
        isAnnuallyActive: activePlanSource.isAnnuallyActive || false,
        annuallyAmount: activePlanSource.annuallyAmount || "",
        pos_isOn: posPlan.isOn !== undefined ? posPlan.isOn : true,
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
      transformPayload={(data) => {
        // 1. تنظيف الـ Tags لضمان إرسال Array نظيفة تماماً بدلاً من الصيغ الغريبة
        let formattedTags = [];
        if (typeof data.tags === "string" && data.tags.trim() !== "") {
          if (data.tags.includes("[") || data.tags.includes("]")) {
            formattedTags = [];
          } else {
            formattedTags = data.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t !== "");
          }
        } else if (Array.isArray(data.tags)) {
          formattedTags = data.tags;
        }

        // دالة مساعدة لضمان إرسال القيمة الفاضية كـ "0.00" لتجنب أخطاء الباكيند
        const formatAmount = (val) => {
          if (val === undefined || val === null || String(val).trim() === "") {
            return "0.00";
          }
          return String(val);
        };

        // 2. تجهيز الـ Subscription Fields المشتركة بين كل الخطط
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

        // 3. بناء مصفوفة الـ businessPlans المتكاملة لإدراجها بالطلب الرئيسي
        const businessPlans = [
          {
            platformType: "online_order",
            commissionRate: formatAmount(data.online_commissionRate),
            serviceFee: formatAmount(data.online_serviceFee),
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
            platformType: "pos",
            commissionRate: "0.00",
            serviceFee: "0.00",
            isOn: data.pos_isOn !== undefined ? data.pos_isOn : true,
            ...subscriptionFields,
          },
        ];

        // 4. بناء الكائن النهائي المطابق تماماً للـ API الخاص بك
        const formattedData = {
          ...data,
          tags: formattedTags,
          minDeliveryTime: String(data.minDeliveryTime || "0"),
          maxDeliveryTime: String(data.maxDeliveryTime || "0"),
          cuisineId: Array.isArray(data.cuisineId)
            ? data.cuisineId.map(String)
            : [],
          type: data.type,
          businessPlans: businessPlans, // الـ Array مفرودة هنا وجاهزة للإرسال في الـ Create والـ Edit
        };

        if (isEdit) {
          if (!formattedData.password) {
            delete formattedData.password;
            delete formattedData.confirmPassword;
          }
        }

        // 5. إزالة الحقول المؤقتة لتنظيف الـ Payload المتجه للسيرفر
        const fieldsToRemove = [
          "online_commissionRate",
          "online_serviceFee",
          "aggregator_commissionRate",
          "aggregator_serviceFee",
          "mykeeto_commissionRate",
          "mykeeto_serviceFee",
          "isMonthlyActive",
          "monthlyAmount",
          "isQuarterlyActive",
          "quarterlyAmount",
          "isAnnuallyActive",
          "annuallyAmount",
          "pos_isOn",
        ];
        fieldsToRemove.forEach((f) => delete formattedData[f]);

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
          formState: { errors, submitCount },
        } = methods;

        const selectedCuisines = watch("cuisineId") || [];
        const watchMonthly = watch("isMonthlyActive");
        const watchQuarterly = watch("isQuarterlyActive");
        const watchAnnually = watch("isAnnuallyActive");

        const [activeTab, setActiveTab] = useState("basic");

        // خريطة تربط كل حقل بالتاب الخاص به لمعرفة أين يوجد الخطأ
        const fieldsByTab = {
          basic: [
            "name",
            "nameAr",
            "nameFr",
            "email",
            "password",
            "type",
            "cuisineId",
            "tags",
          ],
          business: [
            "ownerFirstName",
            "ownerLastName",
            "ownerPhone",
            "confirmPassword",
            "minDeliveryTime",
            "maxDeliveryTime",
            "deliveryTimeUnit",
            "taxNumber",
            "taxExpireDate",
            "status",
          ],
          images: ["logo", "cover", "taxCertificate"],
          "business-plan": [
            "online_commissionRate",
            "online_serviceFee",
            "aggregator_commissionRate",
            "aggregator_serviceFee",
            "mykeeto_commissionRate",
            "mykeeto_serviceFee",
            "isMonthlyActive",
            "monthlyAmount",
            "isQuarterlyActive",
            "quarterlyAmount",
            "isAnnuallyActive",
            "annuallyAmount",
            "pos_isOn",
          ],
        };

        const tabHasError = (tabKey) =>
          fieldsByTab[tabKey]?.some((fieldName) => errors[fieldName]);

        // عند فشل الحفظ بسبب حقل مطلوب فاضي في تاب آخر، ننتقل تلقائياً لأول تاب فيه خطأ
        useEffect(() => {
          if (submitCount > 0) {
            const erroredTab = Object.keys(fieldsByTab).find((key) =>
              tabHasError(key),
            );
            if (erroredTab) setActiveTab(erroredTab);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [submitCount, errors]);

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
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mt-4"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger type="button" value="basic" className="relative">
                General Info
                {tabHasError("basic") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger type="button" value="business" className="relative">
                Business Details
                {tabHasError("business") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger type="button" value="images" className="relative">
                Identity & Media
                {tabHasError("images") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger
                type="button"
                value="business-plan"
                className="relative"
              >
                Business Plan
                {tabHasError("business-plan") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* 1. General Info */}
            <TabsContent
              value="basic"
              forceMount
              className="space-y-4 data-[state=inactive]:hidden"
            >
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

                <div className="space-y-2">
                  <Label>Restaurant Type *</Label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mega">
                            <div className="flex justify-between items-center w-full min-w-[180px]">
                              <span>Mega</span>
                              <span className="text-emerald-600 font-semibold">
                                +1M
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="super">
                            <div className="flex justify-between items-center w-full min-w-[180px]">
                              <span>Super</span>
                              <span className="text-emerald-600 font-semibold">
                                +250K
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="A">
                            <div className="flex justify-between items-center w-full min-w-[180px]">
                              <span>A</span>
                              <span className="text-emerald-600 font-semibold">
                                +100K
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="B">
                            <div className="flex justify-between items-center w-full min-w-[180px]">
                              <span>B</span>
                              <span className="text-emerald-600 font-semibold">
                                +25K
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="C">
                            <div className="flex justify-between items-center w-full min-w-[180px]">
                              <span>C</span>
                              <span className="text-emerald-600 font-semibold">
                                +1K
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="C-">
                            <div className="flex justify-between items-center w-full min-w-[180px]">
                              <span>C-</span>
                              <span className="text-red-600 font-semibold">
                                -1K
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="test">
                            <div className="flex justify-between items-center w-full min-w-[180px]">
                              <span>Test</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <span className="text-xs text-red-500">
                      This field is required
                    </span>
                  )}
                </div>

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

            {/* 2. Business Details */}
            <TabsContent
              value="business"
              forceMount
              className="space-y-4 data-[state=inactive]:hidden"
            >
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

            {/* 3. Identity & Media */}
            <TabsContent
              value="images"
              forceMount
              className="space-y-6 data-[state=inactive]:hidden"
            >
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
                      />
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
                      />
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
                        />
                      </div>
                    )}
                </div>
              </div>
            </TabsContent>

            {/* 4. Business Plan Tab المدمجة كلياً وبدون استدعاء أي APIs منفصلة */}
            <TabsContent
              value="business-plan"
              forceMount
              className="space-y-6 data-[state=inactive]:hidden"
            >
              <div className="border rounded-lg overflow-hidden bg-white text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 font-semibold text-gray-600 w-1/4">
                        Platform
                      </th>
                      <th className="p-3 font-semibold text-gray-700 text-center border-l">
                        Online Order
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
                          {...register("online_commissionRate")}
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
                          {...register("online_serviceFee")}
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

              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowFixedFees((v) => !v);
                  }}
                >
                  {showFixedFees ? "Hide" : "Show"} Fixed Fees & Subscriptions
                  (POS)
                </Button>
              </div>

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
                        className={`space-y-1 transition-opacity ${watchMonthly ? "opacity-100" : "opacity-40"}`}
                      >
                        <Label className="text-[11px] text-gray-500">
                          Amount
                        </Label>
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
                        className={`space-y-1 transition-opacity ${watchQuarterly ? "opacity-100" : "opacity-40"}`}
                      >
                        <Label className="text-[11px] text-gray-500">
                          Amount
                        </Label>
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
                        className={`space-y-1 transition-opacity ${watchAnnually ? "opacity-100" : "opacity-40"}`}
                      >
                        <Label className="text-[11px] text-gray-500">
                          Amount
                        </Label>
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
            </TabsContent>
          </Tabs>
        );
      }}
    </AddPage>
  );
};

export default RestaurantAdd;
