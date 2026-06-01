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
import { Search, Loader2, ChevronsUpDown, Check, X, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePost } from "@/hooks/usePost";
import { useUpdate } from "@/hooks/useUpdate";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller as RHFController } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteDialog from "@/components/DeleteDialog";

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
      return arr.filter((p) => p.restaurantId === restaurantId);
    },
  });

  const [editingPlan, setEditingPlan] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);
  const [deletingPlanId, setDeletingPlanId] = React.useState(null);

  const handleDone = () => {
    setShowForm(false);
    setEditingPlan(null);
    queryClient.invalidateQueries({ queryKey: ["business-plans", restaurantId] });
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
        {!showForm && (
          <Button
            size="sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPlan(null); setShowForm(true); }}          >
            <Save className="h-4 w-4 mr-1" /> Add Plan
          </Button>
        )}
      </div>

      {/* Existing plans list */}
      {!showForm && (
        <div className="space-y-2">
          {plans.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              No business plans yet.
            </p>
          )}
          {plans.map((plan) => (
            <Card key={plan.id} className="border shadow-none">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{plan.platformType}</p>
                  <p className="text-xs text-gray-500">
                    Commission: {plan.commissionRate}% · Service Fee:{" "}
                    {plan.serviceFee}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPlan(plan); setShowForm(true); }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600 hover:border-red-300"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingPlanId(plan.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <BusinessPlanForm
          restaurantId={restaurantId}
          plan={editingPlan}
          onDone={handleDone}
        />
      )}

      <DeleteDialog
        isOpen={!!deletingPlanId}
        onClose={() => {
          setDeletingPlanId(null);
          queryClient.invalidateQueries({ queryKey: ["business-plans", restaurantId] });
        }}
        apiUrl="/api/superadmin/businessplans"
        id={deletingPlanId}
        title="Delete Business Plan?"
      />
    </div>
  );
};

const BusinessPlanForm = ({ restaurantId, plan, onDone }) => {
  const isEdit = !!plan?.id;
  const postMutation = usePost("/api/superadmin/businessplans", "post");
  const updateMutation = useUpdate(`/api/superadmin/businessplans`);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: plan
      ? {
          platformType: plan.platformType || "",
          commissionRate: plan.commissionRate || "",
          serviceFee: plan.serviceFee || "",
          isMonthlyActive: plan.isMonthlyActive || false,
          monthlyAmount: plan.monthlyAmount || "",
          isQuarterlyActive: plan.isQuarterlyActive || false,
          isAnnuallyActive: plan.isAnnuallyActive || false,
        }
      : {
          platformType: "",
          commissionRate: "",
          serviceFee: "",
          isMonthlyActive: false,
          monthlyAmount: "",
          isQuarterlyActive: false,
          isAnnuallyActive: false,
        },
  });

  const onSubmit = (data) => {
    const payload = { ...data, restaurantId };
    if (isEdit) {
      updateMutation.mutate({ id: plan.id, payload }, { onSuccess: onDone });
    } else {
      postMutation.mutate(payload, { onSuccess: onDone });
    }
  };

  const isPending = postMutation.isPending || updateMutation.isPending;
  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">
          {isEdit ? "Edit Plan" : "New Business Plan"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Platform Type */}
            <div className="space-y-1">
              <Label className="text-xs">Platform Type *</Label>
              <RHFController
                name="platformType"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={errors.platformType ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food_aggregator">
                        Food Aggregator
                      </SelectItem>
                      <SelectItem value="online_order">Online Order</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Commission Rate */}
            <div className="space-y-1">
              <Label className="text-xs">Commission Rate (%) *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("commissionRate", { required: true })}
                className={errors.commissionRate ? "border-red-500" : ""}
              />
            </div>

            {/* Service Fee */}
            <div className="space-y-1">
              <Label className="text-xs">Service Fee *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("serviceFee", { required: true })}
                className={errors.serviceFee ? "border-red-500" : ""}
              />
            </div>

            {/* Monthly Amount */}
            <div className="space-y-1">
              <Label className="text-xs">Monthly Amount</Label>
              <Input type="number" step="0.01" {...register("monthlyAmount")} />
            </div>

            {/* Switches */}
            <div className="flex items-center gap-3">
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
              <Label className="text-xs">Monthly Active</Label>
            </div>
            <div className="flex items-center gap-3">
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
              <Label className="text-xs">Quarterly Active</Label>
            </div>
            <div className="flex items-center gap-3">
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
              <Label className="text-xs">Annually Active</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" size="sm" disabled={isPending} onClick={handleSubmit(onSubmit)}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {isEdit ? "Update" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDone(); }}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const RestaurantAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [location, setLocation] = useState({ lat: 31.2001, lng: 29.9187 });

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
      if (raw.lat && raw.lng)
        setLocation({ lat: parseFloat(raw.lat), lng: parseFloat(raw.lng) });

      const cuisineIds = Array.isArray(raw.cuisines)
        ? raw.cuisines.map((c) => String(c.id))
        : raw.cuisineId
          ? [String(raw.cuisineId)]
          : [];

      return {
        ...raw,
        cuisineId: cuisineIds,
        zoneId: String(raw.zoneId),
        tags: Array.isArray(raw.tags) ? raw.tags.join(", ") : raw.tags,
        deliveryTimeUnit: raw.deliveryTimeUnit || "Minutes",
        status: raw.status || "active",
        lat: String(raw.lat || ""),
        lng: String(raw.lng || ""),
      };
    },
    enabled: !!id && !state?.restaurantData,
  });

  const initialData = state?.restaurantData || fetchedData;

  const handleMapSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching location:", error);
    } finally {
      setIsSearching(false);
    }
  };

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
          cuisineId: data.cuisineIds ? data.cuisineIds[0] : null,
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

        const selectedCuisines = watch("cuisineIds") || [];

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
              <TabsTrigger value="location">Location & Map</TabsTrigger>
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
                    name="cuisineIds"
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
                  {errors.cuisineIds && (
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
            <TabsContent value="location" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                <div className="space-y-2">
                  <Label>Address (EN) *</Label>
                  <Input
                    {...register("address", { required: true })}
                    placeholder="Address in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address (AR) *</Label>
                  <Input
                    {...register("addressAr", { required: true })}
                    placeholder="العنوان بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    {...register("lat")}
                    placeholder="Type or pick from map"
                    className="font-mono text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue("lat", val);
                      if (!isNaN(Number(val))) {
                        setLocation((prev) => ({ ...prev, lat: Number(val) }));
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    {...register("lng")}
                    placeholder="Type or pick from map"
                    className="font-mono text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue("lng", val);
                      if (!isNaN(Number(val))) {
                        setLocation((prev) => ({ ...prev, lng: Number(val) }));
                      }
                    }}
                  />
                </div>

                {/* Zone Selector */}
                <div className="space-y-2 md:col-span-2 lg:col-span-4 flex flex-col">
                  <Label>Zone *</Label>
                  <Controller
                    name="zoneId"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal text-left h-10 px-3 text-sm rounded-md",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? selectData?.allZones?.find(
                                  (z) => String(z.id) === field.value,
                                )?.name
                              : "Select Zone"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder="Search zone..."
                              className="h-9 text-xs"
                            />
                            <CommandList>
                              <CommandEmpty className="p-2 text-xs text-center text-gray-500">
                                No zones found.
                              </CommandEmpty>
                              <CommandGroup>
                                {selectData?.allZones?.map((z) => (
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
                  {errors.zoneId && (
                    <span className="text-xs text-red-500">
                      Zone field is required
                    </span>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative z-50 w-full max-w-md">
                <Label className="mb-1 block text-sm font-medium">
                  Search Location on Map
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Type city, street, or restaurant name..."
                    value={searchQuery}
                    onChange={handleMapSearch}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </div>
                </div>
                {searchResults.length > 0 && (
                  <ul className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-[9999]">
                    {searchResults.map((result, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          const lat = parseFloat(result.lat);
                          const lng = parseFloat(result.lon);
                          setLocation({ lat, lng });
                          setValue("lat", String(lat), { shouldDirty: true });
                          setValue("lng", String(lng), { shouldDirty: true });
                          setSearchQuery(result.display_name);
                          setSearchResults([]);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer border-b last:border-none truncate text-gray-700"
                      >
                        {result.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Map */}
              <div className="border rounded-xl p-1 relative h-[350px] overflow-hidden z-10">
                <MapComponent
                  form={methods}
                  selectedLocation={location}
                  isMapClickEnabled={true}
                  handleMapClick={(e) => {
                    const { lat, lng } = e.latlng;
                    setLocation({ lat, lng });
                    setValue("lat", String(lat), { shouldDirty: true });
                    setValue("lng", String(lng), { shouldDirty: true });
                  }}
                  onMarkerDragEnd={(e) => {
                    const { lat, lng } = e.target.getLatLng();
                    setLocation({ lat, lng });
                    setValue("lat", String(lat), { shouldDirty: true });
                    setValue("lng", String(lng), { shouldDirty: true });
                  }}
                />
              </div>
            </TabsContent>

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
