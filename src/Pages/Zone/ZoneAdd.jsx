import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Controller } from "react-hook-form";
import { MapPin, Search, Loader2 } from "lucide-react";

const ZoneAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [location, setLocation] = useState({ lat: 30.0444, lng: 31.2357 });

  // حالات خاصة بالبحث على الخريطة
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. جلب قائمة المدن
  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/zones/cities/active");
      return res.data.data.data;
    },
  });

  // 2. جلب بيانات الـ Zone في حالة التعديل
  const { data: fetchedData, isLoading: isFetching } = useQuery({
    queryKey: ["zone", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/zones/${id}`);
      const raw = data.data.data;
      return {
        ...raw,
        cityId: raw.cityId
          ? String(raw.cityId)
          : raw.city?.id
            ? String(raw.city.id)
            : "",
        lat: String(raw.lat || ""),
        lng: String(raw.lng || ""),
      };
    },
    enabled: !!id && !state?.zoneData,
  });

  const initialData = state?.zoneData || fetchedData;

  useEffect(() => {
    if (fetchedData?.lat && fetchedData?.lng) {
      const newLat = parseFloat(fetchedData.lat);
      const newLng = parseFloat(fetchedData.lng);
      setLocation({ lat: newLat, lng: newLng });
    }
  }, [fetchedData]);

  useEffect(() => {
    if (initialData?.lat && initialData?.lng) {
      setLocation({
        lat: parseFloat(initialData.lat),
        lng: parseFloat(initialData.lng),
      });
    }
  }, [initialData]);

  // دالة البحث باستخدام OpenStreetMap Nominatim API
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

  if (id && (isFetching || isLoadingCities)) return <LoadingSpinner />;

  return (
    <AddPage
      title="Zone"
      apiUrl="/api/superadmin/zones"
      queryKey="zones"
      fields={[]} // تركناها فارغة لنستخدم نظام التوزيع المخصص بالداخل
      initialData={initialData}
      onSuccessAction={() => navigate(-1)}
    >
      {(methods) => {
        const {
          register,
          control,
          setValue,
          formState: { errors },
        } = methods;

        return (
          <Tabs defaultValue="basic" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="basic">General Info</TabsTrigger>
              <TabsTrigger value="location">Zone Location & Map</TabsTrigger>
            </TabsList>

            {/* 1. المعلومات الأساسية */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Zone Name (EN) *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="Zone Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zone Name (AR) *</Label>
                  <Input
                    {...register("nameAr", { required: true })}
                    placeholder="الاسم بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zone Name (FR) *</Label>
                  <Input
                    {...register("nameFr", { required: true })}
                    placeholder="Nom en français"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Display Name (EN) *</Label>
                  <Input
                    {...register("displayName", { required: true })}
                    placeholder="Display Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name (AR) *</Label>
                  <Input
                    {...register("displayNameAr", { required: true })}
                    placeholder="اسم العرض بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name (FR) *</Label>
                  <Input
                    {...register("displayNameFr", { required: true })}
                    placeholder="Nom d'affichage"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>City *</Label>
                <Controller
                  name="cityId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.cityId && (
                  <span className="text-xs text-red-500">
                    City selection is required
                  </span>
                )}
              </div>
            </TabsContent>

            {/* 2. الموقع والخريطة */}
            <TabsContent value="location" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                {/* LAT */}
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    {...register("lat")}
                    placeholder="Type or pick from map"
                    className="bg-white font-mono text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue("lat", val, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });

                      if (!isNaN(Number(val))) {
                        setLocation((prev) => ({
                          ...prev,
                          lat: Number(val),
                        }));
                      }
                    }}
                  />
                </div>

                {/* LNG */}
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    {...register("lng")}
                    placeholder="Type or pick from map"
                    className="bg-white font-mono text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue("lng", val, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });

                      if (!isNaN(Number(val))) {
                        setLocation((prev) => ({
                          ...prev,
                          lng: Number(val),
                        }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <MapPin className="text-primary w-5 h-5" />
                <h3 className="text-sm font-semibold">
                  Interactive Map Configuration
                </h3>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                Search for a location, click on the map, or drag the marker to
                set coordinates.
              </p>

              {/* SEARCH */}
              <div className="relative z-50 w-full max-w-md">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search location (e.g. Cairo, Alexandria...)"
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

                          setValue("lat", String(lat), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });

                          setValue("lng", String(lng), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });

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

              {/* MAP */}
              <div className="border rounded-xl p-1 relative h-[350px] overflow-hidden z-10">
                <MapComponent
                  form={methods}
                  selectedLocation={location}
                  isMapClickEnabled={true}
                  handleMapClick={(e) => {
                    const { lat, lng } = e.latlng;

                    setLocation({ lat, lng });

                    setValue("lat", String(lat), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });

                    setValue("lng", String(lng), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  onMarkerDragEnd={(e) => {
                    const { lat, lng } = e.target.getLatLng();

                    setLocation({ lat, lng });

                    setValue("lat", String(lat), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });

                    setValue("lng", String(lng), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        );
      }}
    </AddPage>
  );
};

export default ZoneAdd;
