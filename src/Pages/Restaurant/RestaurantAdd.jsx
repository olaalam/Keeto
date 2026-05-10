import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import MapComponent from '@/components/MapComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller } from "react-hook-form";

const RestaurantAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [location, setLocation] = useState({ lat: 31.2001, lng: 29.9187 });

    const { data: selectData, isLoading: isLoadingSelect } = useQuery({
        queryKey: ['restaurantSelectData'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/restaurants/select');
            return res.data.data.data;
        }
    });

    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['restaurant', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/restaurants/${id}`);
            const raw = data.data.data;
            if (raw.lat && raw.lng) setLocation({ lat: parseFloat(raw.lat), lng: parseFloat(raw.lng) });
            return {
                ...raw,
                cuisineId: String(raw.cuisineId),
                zoneId: String(raw.zoneId),
                tags: Array.isArray(raw.tags) ? raw.tags.join(', ') : raw.tags,
                deliveryTimeUnit: raw.deliveryTimeUnit || "Minutes",
                status: raw.status || "active",
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
            fields={[]} // نتركها فارغة لنستخدم نظام الـ Tabs
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
            beforeSubmit={(data) => ({
                ...data,
                tags: typeof data.tags === 'string' 
                    ? data.tags.split(',').map(t => t.trim()).filter(t => t !== "") 
                    : data.tags,
                minDeliveryTime: String(data.minDeliveryTime),
                maxDeliveryTime: String(data.maxDeliveryTime),
            })}
        >
            {(methods) => {
                const { register, control, formState: { errors } } = methods;

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
                                    <Input {...register("name", { required: true })} placeholder="Restaurant Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (AR) *</Label>
                                    <Input {...register("nameAr", { required: true })} placeholder="الاسم بالعربي" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (FR) *</Label>
                                    <Input {...register("nameFr", { required: true })} placeholder="Nom en français" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input type="email" {...register("email", { required: true })} />
                                </div>
                                {!isEdit && (
                                    <div className="space-y-2">
                                        <Label>Password *</Label>
                                        <Input type="password" {...register("password", { required: true })} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Cuisine Type *</Label>
                                    <Controller
                                        name="cuisineId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select Cuisine" /></SelectTrigger>
                                                <SelectContent>
                                                    {selectData?.allCuisines?.map(c => (
                                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <Input {...register("tags")} placeholder="Pizza, Burger, Fast Food..." />
                            </div>
                        </TabsContent>

                        {/* 2. الموقع والخريطة */}
                        <TabsContent value="location" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-2">
                                    <Label>Address (EN) *</Label>
                                    <Input {...register("address", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address (AR) *</Label>
                                    <Input {...register("addressAr", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Zone *</Label>
                                    <Controller
                                        name="zoneId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select Zone" /></SelectTrigger>
                                                <SelectContent>
                                                    {selectData?.allZones?.map(z => (
                                                        <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            
                            <div className="border rounded-xl p-1 relative h-[350px] overflow-hidden">
                                <MapComponent
                                    form={methods}
                                    selectedLocation={location}
                                    isMapClickEnabled={true}
                                    handleMapClick={(e) => {
                                        const { lat, lng } = e.latlng;
                                        setLocation({ lat, lng });
                                        methods.setValue('lat', String(lat));
                                        methods.setValue('lng', String(lng));
                                    }}
                                    onMarkerDragEnd={(e) => {
                                        const { lat, lng } = e.target.getLatLng();
                                        setLocation({ lat, lng });
                                        methods.setValue('lat', String(lat));
                                        methods.setValue('lng', String(lng));
                                    }}
                                />
                            </div>
                        </TabsContent>

                        {/* 3. بيانات العمل والمالك */}
                        <TabsContent value="business" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Owner First Name *</Label><Input {...register("ownerFirstName", { required: true })} /></div>
                                <div className="space-y-2"><Label>Owner Last Name *</Label><Input {...register("ownerLastName", { required: true })} /></div>
                                <div className="space-y-2"><Label>Owner Phone *</Label><Input {...register("ownerPhone", { required: true })} /></div>
                                
                                <div className="space-y-2"><Label>Min Delivery Time *</Label><Input type="number" {...register("minDeliveryTime", { required: true })} /></div>
                                <div className="space-y-2"><Label>Max Delivery Time *</Label><Input type="number" {...register("maxDeliveryTime", { required: true })} /></div>
                                <div className="space-y-2">
                                    <Label>Time Unit *</Label>
                                    <Controller
                                        name="deliveryTimeUnit"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Minutes">Minutes</SelectItem>
                                                    <SelectItem value="Hours">Hours</SelectItem>
                                                    <SelectItem value="Days">Days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2"><Label>Tax Number *</Label><Input {...register("taxNumber", { required: true })} /></div>
                                <div className="space-y-2"><Label>Tax Expire Date *</Label><Input type="date" {...register("taxExpireDate", { required: true })} /></div>
                                <div className="space-y-2">
                                    <Label>Status *</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <Label className="text-blue-600 font-bold">Restaurant Logo *</Label>
                                    <Input type="file" onChange={(e) => methods.setValue('logo', e.target.files[0])} />
                                </div>
                                <div className="p-4 border rounded-lg space-y-2">
                                    <Label className="text-blue-600 font-bold">Cover Image *</Label>
                                    <Input type="file" onChange={(e) => methods.setValue('cover', e.target.files[0])} />
                                </div>
                                <div className="p-4 border rounded-lg space-y-2 col-span-full">
                                    <Label className="text-blue-600 font-bold">Tax Certificate (PDF or Image) *</Label>
                                    <Input type="file" onChange={(e) => methods.setValue('taxCertificate', e.target.files[0])} />
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