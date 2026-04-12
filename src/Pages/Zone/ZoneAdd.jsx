import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { usePost } from '@/hooks/usePost';
import { useUpdate } from '@/hooks/useUpdate';

// استيراد مكونات Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, MapPin } from "lucide-react";
import LoadingSpinner from '@/components/LoadingSpinner';

// استيراد مكونات الخريطة
import MapComponent from '@/components/MapComponent'; // تأكدي من مسار الاستيراد

const ZoneAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const formMethods = useForm();
    const { register, handleSubmit, reset, control, setValue, watch, formState: { errors, dirtyFields } } = formMethods;
    const navigate = useNavigate();
    const isEdit = !!id;

    // جلب قائمة المدن لاستخدامها في الـ Select
    const { data: cities = [], isLoading: isLoadingCities } = useQuery({
        queryKey: ['cities'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/zones/cities/active'); // عدلي الـ Endpoint حسب الـ API الخاص بك
            return res.data.data.data;
        }
    });

    // جلب بيانات الـ Zone في حالة التعديل
    const { data: fetchedZoneData, isLoading: isFetching } = useQuery({
        queryKey: ['zone', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/zones/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.zoneData,
    });

    const rawData = state?.zoneData || fetchedZoneData;

    const initialData = useMemo(() => {
        if (!rawData) return null;
        return {
            ...rawData,
            cityId: rawData.cityId ? String(rawData.cityId) : (rawData.city?.id ? String(rawData.city.id) : ""),
            lat: rawData.lat ? String(rawData.lat) : "",
            lng: rawData.lng ? String(rawData.lng) : "",
        };
    }, [rawData]);

    // إعدادات الـ Form

    const postMutation = usePost('/api/superadmin/zones', 'post', 'zones');
    const updateMutation = useUpdate('/api/superadmin/zones', 'zones');

    // إعدادات الخريطة (تم تعيين الإحداثيات الافتراضية)
    const [selectedLocation, setSelectedLocation] = useState({
        lat: 31.2001,
        lng: 29.9187
    });
    const [locationName, setLocationName] = useState("");

    // تحديث البيانات عند فتح صفحة التعديل
    useEffect(() => {
        if (initialData && !isFetching) {
            // استخراج الإحداثيات والتأكد من تحويلها لأرقام للخريطة
            if (initialData.lat && initialData.lng) {
                const lat = parseFloat(initialData.lat);
                const lng = parseFloat(initialData.lng);
                
                setSelectedLocation({ lat, lng });

                // إعداد بيانات الفورم مع توفير address افتراضي إذا تم توفيره أو استخدام الإحداثيات
                const dataForForm = {
                    ...initialData,
                    address: initialData.name || `${lat}, ${lng}`
                };

                reset(dataForForm);
                setLocationName(dataForForm.address);
            } else {
                // في حالة الإضافة أو عدم وجود إحداثيات
                reset(initialData);
            }
        }
    }, [initialData, isFetching, reset]);

    // دوال التعامل مع الخريطة
    const updateFormCoordinates = (lat, lng) => {
        const latStr = String(lat);
        const lngStr = String(lng);

        setSelectedLocation({ lat, lng });

        // تحديث قيم react-hook-form المخفية
        setValue('lat', latStr, { shouldDirty: true, shouldValidate: true });
        setValue('lng', lngStr, { shouldDirty: true, shouldValidate: true });

        // أهم خطوة: تحديث الـ address عشان يظهر في الـ Input بتاع الـ MapComponent
        const coordsString = `${latStr}, ${lngStr}`;
        setValue('address', coordsString, { shouldDirty: true });
        setLocationName(coordsString);
    };

    const handleMapClick = (e) => {
        updateFormCoordinates(e.latlng.lat, e.latlng.lng);
    };

    const onMarkerDragEnd = (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        updateFormCoordinates(position.lat, position.lng);
    };

    const onSubmit = (data) => {
        // التأكد من وجود الإحداثيات
        if (!data.lat || !data.lng) {
            data.lat = String(selectedLocation.lat);
            data.lng = String(selectedLocation.lng);
        }

        if (isEdit) {
            // تجميع الحقول التي تم تعديلها فقط
            const changedData = Object.keys(dirtyFields).reduce((acc, key) => {
                acc[key] = data[key];
                return acc;
            }, {});

            if (Object.keys(changedData).length === 0) return navigate(-1);

            updateMutation.mutate(
                { id: initialData.id, payload: changedData },
                { onSuccess: () => navigate(-1) }
            );
        } else {
            postMutation.mutate(data, {
                onSuccess: () => navigate(-1)
            });
        }
    };

    const isSubmitting = postMutation.isPending || updateMutation.isPending;

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <Card className="mx-auto shadow-lg border-none max-w-5xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight capitalize">
                    {isEdit ? 'Edit Zone' : 'Add New Zone'}
                </CardTitle>
                <CardDescription>
                    Fill in the zone details and select its coordinates on the map.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* الحقول النصية والقوائم */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. alex"
                                {...register('name', { required: true })}
                                className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && <p className="text-destructive text-xs">This field is required</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="displayName" className={errors.displayName ? "text-destructive" : ""}>
                                Display Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="displayName"
                                placeholder="e.g. sssssssssss"
                                {...register('displayName', { required: true })}
                                className={errors.displayName ? "border-destructive" : ""}
                            />
                            {errors.displayName && <p className="text-destructive text-xs">This field is required</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cityId" className={errors.cityId ? "text-destructive" : ""}>
                                City <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="cityId"
                                control={control}
                                rules={{ required: true }}
                                render={({ field: { onChange, value } }) => (
                                    <Select onValueChange={onChange} value={value ? String(value) : ""}>
                                        <SelectTrigger className={errors.cityId ? "border-destructive" : ""}>
                                            <SelectValue placeholder={isLoadingCities ? "Loading cities..." : "Select a city"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cities.map((city) => (
                                                <SelectItem key={city.id} value={String(city.id)}>
                                                    {city.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.cityId && <p className="text-destructive text-xs">This field is required</p>}
                        </div>
                    </div>

                    {/* قسم الخريطة */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <MapPin className="text-primary w-5 h-5" />
                            <h3 className="text-lg font-semibold">Zone Location</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Click on the map or drag the marker to set the zone's exact location.</p>

                        {/* حقول مخفية لتسجيل الإحداثيات في الفورم */}
                        <input type="hidden" {...register("lat", { required: true })} />
                        <input type="hidden" {...register("lng", { required: true })} />

                        <div className="border rounded-xl p-1 shadow-sm">
                            <MapComponent
                                selectedLocation={selectedLocation}
                                locationName={locationName}
                                setLocationName={setLocationName}
                                handleMapClick={handleMapClick}
                                onMarkerDragEnd={onMarkerDragEnd}
                                isMapClickEnabled={true}
                                // نمرر كائن form وهمي لتجنب أخطاء MapComponent إذا كان يعتمد على watch
                                form={formMethods}
                            />
                        </div>
                        {(errors.lat || errors.lng) && (
                            <p className="text-destructive text-sm font-medium">Please select a location on the map.</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full md:w-32">
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> {isEdit ? 'Update' : 'Save'}</>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ZoneAdd;