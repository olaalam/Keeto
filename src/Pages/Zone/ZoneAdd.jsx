import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import MapComponent from '@/components/MapComponent';
import { MapPin } from "lucide-react";

const ZoneAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [location, setLocation] = useState({ lat: 30.0444, lng: 31.2357 });

    // 1. جلب قائمة المدن
    const { data: cities = [], isLoading: isLoadingCities } = useQuery({
        queryKey: ['cities'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/zones/cities/active');
            return res.data.data.data;
        }
    });

    // 2. جلب بيانات الـ Zone في حالة التعديل
    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['zone', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/zones/${id}`);
            const raw = data.data.data;
            return {
                ...raw,
                cityId: raw.cityId ? String(raw.cityId) : (raw.city?.id ? String(raw.city.id) : ""),
                lat: String(raw.lat || ""),
                lng: String(raw.lng || ""),
            };
        },
        enabled: !!id && !state?.zoneData,
    });

    const initialData = state?.zoneData || fetchedData;

    useEffect(() => {
        // لو فيه داتا جاية من التعديل، حدث الموقع المحلي فوراً
        if (fetchedData?.lat && fetchedData?.lng) {
            const newLat = parseFloat(fetchedData.lat);
            const newLng = parseFloat(fetchedData.lng);

            setLocation({ lat: newLat, lng: newLng });
        }
    }, [fetchedData]);

    // تحديث موقع الخريطة عند تحميل البيانات
    useEffect(() => {
        if (initialData?.lat && initialData?.lng) {
            setLocation({
                lat: parseFloat(initialData.lat),
                lng: parseFloat(initialData.lng)
            });
        }
    }, [initialData]);

    if (id && (isFetching || isLoadingCities)) return <LoadingSpinner />;

    const fields = [
        { name: 'name', label: 'Zone Name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'displayName', label: 'Display Name', required: true },
        {
            name: 'cityId',
            label: 'City',
            type: 'select',
            required: true,
            options: cities?.map(c => ({ label: c.name, value: c.id }))
        },
    ];

    return (
        <AddPage
            title="Zone"
            apiUrl="/api/superadmin/zones"
            queryKey="zones"
            fields={fields}
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
        >
            {(methods) => (
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-primary w-5 h-5" />
                        <h3 className="text-lg font-semibold">Zone Location</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Click on the map or drag the marker to set the zone's exact location.</p>

                    <div className="border rounded-xl p-1 relative">
                        <MapComponent
                            form={methods}
                            selectedLocation={location}
                            isMapClickEnabled={true}
                            handleMapClick={(e) => {
                                const { lat, lng } = e.latlng;
                                setLocation({ lat, lng });

                                // أضف الخيارات دي ضروري { shouldDirty: true, shouldValidate: true }
                                methods.setValue('lat', String(lat), { shouldDirty: true, shouldValidate: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true, shouldValidate: true });
                            }}
                            onMarkerDragEnd={(e) => {
                                const { lat, lng } = e.target.getLatLng();
                                setLocation({ lat, lng });

                                methods.setValue('lat', String(lat), { shouldDirty: true, shouldValidate: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true, shouldValidate: true });
                            }}
                        />
                    </div>
                </div>
            )}
        </AddPage>
    );
};

export default ZoneAdd;