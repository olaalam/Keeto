import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Controller } from "react-hook-form";
import { Search, Loader2, ChevronDown } from "lucide-react";

const RestaurantAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [location, setLocation] = useState({ lat: 31.2001, lng: 29.9187 });

  // حالات البحث على الخريطة
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

      // تحويل المطابخ المحددة مسبقاً لمصفوفة نصوص لتلائم الـ Form
      const cuisineIds = Array.isArray(raw.cuisines)
        ? raw.cuisines.map((c) => String(c.id))
        : raw.cuisineId
          ? [String(raw.cuisineId)]
          : [];

      return {
        ...raw,
        cuisineIds: cuisineIds,
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

  // دالة البحث عن العناوين باستخدام OpenStreetMap Nominatim
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
      fields={[]} // نتركها فارغة لنستخدم نظام الـ Tabs المخصص بالداخل
      initialData={initialData}
      onSuccessAction={() => navigate(-1)}
      beforeSubmit={(data) => ({
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
        // نمرر مصفوفة المطابخ مباشرة أو نقوم بتحويلها لأرقام حسب متطلبات الـ API الخلفي الخاص بك
        cuisineIds: data.cuisineIds ? data.cuisineIds.map(Number) : [],
      })}
    >
      {(methods) => {
        const {
          register,
          control,
          setValue,
          watch,
          formState: { errors },
        } = methods;
        const selectedCuisines = watch("cuisineIds") || [];

        return (
          <Tabs defaultValue="basic" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="basic">General Info</TabsTrigger>
              <TabsTrigger value="location">Location & Map</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
              <TabsTrigger value="images">Identity & Media</TabsTrigger>
            </TabsList>

            {/* 1. المعلومات الأساسية */}
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

                {/* حقل اختيار متعدد للمطابخ */}
                <div className="space-y-2">
                  <Label>Cuisine Types *</Label>
                  <Controller
                    name="cuisineIds"
                    control={control}
                    rules={{ required: true }}
                    defaultValue={[]}
                    render={({ field }) => {
                      // دالة لتحديث المصفوفة عند الضغط على العناصر
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

                      // استخراج الأسماء المختارة لعرضها كعنوان زر القائمة المنسدلة
                      const selectedLabels = selectData?.allCuisines
                        ?.filter((c) => selectedCuisines.includes(String(c.id)))
                        ?.map((c) => c.name)
                        ?.join(", ");

                      return (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between text-left font-normal"
                            >
                              <span className="truncate">
                                {selectedLabels || "Select Cuisines"}
                              </span>
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                            {selectData?.allCuisines?.map((c) => (
                              <DropdownMenuCheckboxItem
                                key={c.id}
                                checked={selectedCuisines.includes(
                                  String(c.id),
                                )}
                                onCheckedChange={() =>
                                  handleSelectChange(String(c.id))
                                }
                              >
                                {c.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

            {/* 2. الموقع والخريطة والبحث */}
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
                    placeholder="Optional (Click map)"
                    readOnly
                    className="bg-gray-50 font-mono text-xs cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    {...register("lng")}
                    placeholder="Optional (Click map)"
                    readOnly
                    className="bg-gray-50 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-4">
                  <Label>Zone *</Label>
                  <Controller
                    name="zoneId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectData?.allZones?.map((z) => (
                            <SelectItem key={z.id} value={String(z.id)}>
                              {z.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

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

            {/* 3. بيانات العمل والمالك */}
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
                  <Label>Tax Number *</Label>
                  <Input {...register("taxNumber", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Tax Expire Date *</Label>
                  <Input
                    type="date"
                    {...register("taxExpireDate", { required: true })}
                  />
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

            {/* 4. الصور والملفات */}
            <TabsContent value="images" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg space-y-2">
                  <Label className="text-blue-600 font-bold">
                    Restaurant Logo *
                  </Label>
                  <Input
                    type="file"
                    onChange={(e) => setValue("logo", e.target.files[0])}
                  />
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <Label className="text-blue-600 font-bold">
                    Cover Image *
                  </Label>
                  <Input
                    type="file"
                    onChange={(e) => setValue("cover", e.target.files[0])}
                  />
                </div>
                <div className="p-4 border rounded-lg space-y-2 col-span-full">
                  <Label className="text-blue-600 font-bold">
                    Tax Certificate (PDF or Image) *
                  </Label>
                  <Input
                    type="file"
                    onChange={(e) =>
                      setValue("taxCertificate", e.target.files[0])
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        );
      }}
    </AddPage>
  );
};

export default RestaurantAdd;
