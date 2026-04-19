import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const CountryAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: countryData, isLoading: isFetching } = useQuery({
        queryKey: ['country', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/countries/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.countryData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const initialData = state?.countryData || countryData;

    const countryFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },

    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="country"
            apiUrl="/api/superadmin/countries" // هذا هو الـ Base URL
            queryKey="countries"
            fields={countryFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default CountryAdd;