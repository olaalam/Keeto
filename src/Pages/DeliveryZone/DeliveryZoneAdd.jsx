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
            // تأكد هنا: هل هي res.data.data أم res.data.data.data؟
            // حسب الصورة، res.data هي الكائن اللي فيه success و data
            // إذن res.data.data هي المصفوفة
            return Array.isArray(res.data.data.data) ? res.data.data.data : [];
        }
    });

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: zoneDeliveryData, isLoading: isFetching } = useQuery({
        queryKey: ['DeliveryZone', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/zone-delivery-fees/${id}`);
            console.log(data.data.data);
            return data.data.data;
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
            label: 'From Zone',
            required: true,
            type: 'select',
            // أضفنا علامة الاستفهام أو المصفوفة الفارغة كحماية
            options: DeliveryZone.map(c => ({
                value: String(c.id),
                label: c.name // تأكد أن السيرفر يرسل 'name' وليس 'displayName' كما في الصورة
            }))
        },
        {
            name: 'toZoneId',
            label: 'To Zone',
            required: true,
            type: 'select',
            options: (Array.isArray(DeliveryZone) ? DeliveryZone : []).map(c => ({
                value: String(c.id),
                label: c.name
            }))
        },
        { name: 'fee', label: 'Fee', required: true, type: 'number' },
    ];

    if (isLoading || (id && isFetching)) return <LoadingSpinner />;

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