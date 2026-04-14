import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const DeliveryZoneAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    const { data: DeliveryZone = [], isLoading } = useQuery({
        queryKey: ['DeliveryZone'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/zone-delivery-fees/all');
            return res.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: zoneDeliveryData, isLoading: isFetching } = useQuery({
        queryKey: ['DeliveryZone', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/zone-delivery-fees/${id}`);
            console.log(data.data);
            return data.data;
        },
        enabled: !!id && !state?.zoneDeliveryData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const rawData = state?.zoneDeliveryData || zoneDeliveryData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            ...rawData,
            // هنا بنخرج الـ id من جوه كائن الـ country ونحطه في countryId 
            // عشان الـ AddPage والـ Select يحسوا بيه
            fromZoneId: rawData.fromZoneId || rawData.fromZone?.id,
            toZoneId: rawData.toZoneId || rawData.toZone?.id,
            fee: rawData.fee || rawData.fee
        };
    }, [rawData]);

    const zoneDeliveryFields = [
        {
            name: 'fromZoneId',
            label: 'fromZoneId',
            required: true,
            type: 'select',
            // التأكد من أن الـ options بتستخدم الـ id والـ name الصح
            options: DeliveryZone.map(c => ({ value: c.id, label: c.name }))
        },
        {
            name: 'toZoneId',
            label: 'toZoneId',
            required: true,
            type: 'select',
            // التأكد من أن الـ options بتستخدم الـ id والـ name الصح
            options: DeliveryZone.map(c => ({ value: c.id, label: c.name }))
        },
        { name: 'fee', label: 'fee', required: true },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="DeliveryZone"
            apiUrl="/api/superadmin/zone-delivery-fees" // هذا هو الـ Base URL
            queryKey="DeliveryZone"
            fields={zoneDeliveryFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default DeliveryZoneAdd;