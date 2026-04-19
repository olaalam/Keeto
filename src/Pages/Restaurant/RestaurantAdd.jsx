import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage'; // تأكد من المسار الصحيح
import LoadingSpinner from '@/components/LoadingSpinner';
import MapComponent from '@/components/MapComponent';


const RestaurantAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const isEdit = !!id;

    // 1. جلب بيانات القوائم المنسدلة
    const { data: selectData, isLoading: isLoadingSelect } = useQuery({
        queryKey: ['restaurantSelectData'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/restaurants/select');
            return res.data.data.data;
        }
    });

    // 2. جلب بيانات المطعم في حالة التعديل
    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['restaurant', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/restaurants/${id}`);
            const raw = data.data.data;
            // تنسيق البيانات لتناسب النموذج
            return {
                ...raw,
                cuisineId: String(raw.cuisineId),
                zoneId: String(raw.zoneId),
                tags: Array.isArray(raw.tags) ? raw.tags.join(', ') : raw.tags,
                // lat: String(raw.lat || ""),
                // lng: String(raw.lng || ""),
            };
        },
        enabled: !!id && !state?.restaurantData,
    });

    const initialData = state?.restaurantData || fetchedData;

    // إعدادات الخريطة (منطق منفصل)
    // const [location, setLocation] = useState({ lat: 31.2001, lng: 29.9187 });

    // useEffect(() => {
    //     if (initialData?.lat && initialData?.lng) {
    //         setLocation({
    //             lat: parseFloat(initialData.lat),
    //             lng: parseFloat(initialData.lng)
    //         });
    //     }
    // }, [initialData]);

    if (id && (isFetching || isLoadingSelect)) return <LoadingSpinner />;

    // تعريف الحقول لـ AddPage
    const fields = [
        { name: 'name', label: 'Restaurant Name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        ...(!isEdit ? [{ name: 'password', label: 'Password', type: 'password', required: true }] : []),
        {
            name: 'cuisineId',
            label: 'Cuisine Type',
            type: 'select',
            required: true,
            options: selectData?.allCuisines?.map(c => ({ label: c.name, value: c.id }))
        },
        { name: 'logo', label: 'Logo Image', type: 'file', required: true },
        { name: 'cover', label: 'Cover Image', type: 'file', required: true },
        { name: 'taxCertificate', label: 'Tax Certificate', type: 'file', required: true },
        { name: 'ownerFirstName', label: 'Owner First Name', required: true },
        { name: 'ownerLastName', label: 'Owner Last Name', required: true },
        { name: 'ownerPhone', label: 'Owner Phone', required: true },
        { name: 'minDeliveryTime', label: 'Min Delivery (Mins)', type: 'number', required: true },
        { name: 'maxDeliveryTime', label: 'Max Delivery (Mins)', type: 'number', required: true },
        { name: 'taxNumber', label: 'Tax Number', required: true },
        { name: 'taxExpireDate', label: 'Tax Expire Date', type: 'date', required: true },
        { name: 'tags', label: 'Tags (comma separated)', required: false },
        {
            name: 'zoneId',
            label: 'Zone',
            type: 'select',
            required: true,
            options: selectData?.allZones?.map(z => ({ label: z.name, value: z.id }))
        },
        // { name: 'address', label: 'Detailed Address', required: true },
    ];

    return (

        <AddPage
            title="Restaurant"
            apiUrl="/api/superadmin/restaurants"
            queryKey="restaurants"
            fields={fields}
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
        >
            {/* {(methods) => (
                <div className="space-y-4 pt-4 border-t">
                    <div className="border rounded-xl p-1 relative">
                        <MapComponent
                            form={methods} // تمرير الميثودز لتفعيل watch داخل الخريطة
                            selectedLocation={location}
                            isMapClickEnabled={true}
                            handleMapClick={(e) => {
                                const { lat, lng } = e.latlng;
                                setLocation({ lat, lng });
                                methods.setValue('lat', String(lat), { shouldDirty: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true });
                            }}
                            onMarkerDragEnd={(e) => {
                                const { lat, lng } = e.target.getLatLng();
                                setLocation({ lat, lng });
                                methods.setValue('lat', String(lat), { shouldDirty: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true });
                            }}
                        />
                    </div>
                </div>
            )} */}
        </AddPage>
    );
};

export default RestaurantAdd;