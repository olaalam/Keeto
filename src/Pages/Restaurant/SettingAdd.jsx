import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const SettingAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();

    const { data: fullData, isLoading: isFetching } = useQuery({
        queryKey: ['setting', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/restaurantsetting/${id}`);
            return data.data;
        },
        enabled: !!id && !state?.settingData,
    });

    const rawData = state?.settingData || fullData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        // الـ AddPage يحتاج البيانات مسطحة (Flat) ليعبئ الـ Form
        // لذا ندمج محتويات settings لتكون مباشرة في initialData
        return {
            ...rawData.settings,
            // إذا كنتِ ستحتاجين الـ schedules لاحقاً يمكن تمريرها هنا
            schedules: rawData.schedules
        };
    }, [rawData]);

    // تعريف الحقول كـ 'switch' لكي تظهر بالأزرار التي طلبتِها
    const settingFields = [
        { name: "foodManagement", label: "Food Management", type: "switch" },
        { name: "scheduledDelivery", label: "Scheduled Delivery", type: "switch" },
        { name: "reviewsSection", label: "Reviews Section", type: "switch" },
        { name: "posSection", label: "Pos Section", type: "switch" },
        { name: "selfDelivery", label: "Self Delivery", type: "switch" },
        { name: "homeDelivery", label: "Home Delivery", type: "switch" },
        { name: "takeaway", label: "Takeaway", type: "switch" },
        { name: "orderSubscription", label: "Order Subscription", type: "switch" },
        { name: "instantOrder", label: "Instant Order", type: "switch" },
        { name: "halalTagStatus", label: "Halal", type: "switch" },
        { name: "dineIn", label: "Dine In", type: "switch" },
        // إضافة الحقول الرقمية أيضاً لتكتمل الصفحة
        { name: "minOrderAmount", label: "Min Order Amount", type: "number" },
        { name: "minDeliveryTime", label: "Min Delivery Time", type: "number" },
        { name: "maxDeliveryTime", label: "Max Delivery Time", type: "number" },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Restaurant Settings"
            apiUrl={`/api/superadmin/restaurantsetting/${id}`} // نرسل الـ ID في الـ URL عند التحديث
            queryKey="setting"
            fields={settingFields}
            initialData={initialData}
            onSuccessAction={() => {
                // يمكنك إظهار رسالة نجاح هنا
                console.log("Updated Successfully");
            }}
        />
    );
};

export default SettingAdd;