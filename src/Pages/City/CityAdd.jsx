import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const CityAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    const { data: countries = [], isLoading } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/cities/countries/active');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: cityData, isLoading: isFetching } = useQuery({
        queryKey: ['city', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/cities/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.cityData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const rawData = state?.cityData || cityData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            ...rawData,
            // هنا بنخرج الـ id من جوه كائن الـ country ونحطه في countryId 
            // عشان الـ AddPage والـ Select يحسوا بيه
            countryId: rawData.countryId || rawData.country?.id
        };
    }, [rawData]);
    console.log("Initial Data sent to AddPage:", initialData);

    const cityFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        {
            name: 'countryId',
            label: 'Country',
            required: true,
            type: 'select',
            // التأكد من أن الـ options بتستخدم الـ id والـ name الصح
            options: countries.map(c => ({
                value: String(c.id), // تحويل لـ String للضمان
                label: c.name
            }))
        },];

    if ((id && isFetching) || isLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title="city"
            apiUrl="/api/superadmin/cities" // هذا هو الـ Base URL
            queryKey="cities"
            fields={cityFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default CityAdd;