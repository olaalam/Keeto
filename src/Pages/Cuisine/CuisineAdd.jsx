import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const CuisineAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: cuisineData, isLoading: isFetching } = useQuery({
        queryKey: ['cuisine', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/cuisines/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.cuisineData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const initialData = state?.cuisineData || cuisineData;

    const cuisineFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'Image', label: 'image', type: 'file', required: true },
        { name: 'description', label: 'description', required: true },
        { name: 'descriptionAr', label: 'descriptionAr', required: true },
        { name: 'descriptionFr', label: 'descriptionFr', required: true },
        { name: 'meta_description', label: 'meta_description', required: true },
        { name: 'meta_image', label: 'meta_image', type: 'file', required: true },
        { name: 'status', label: 'status', required: true, type: 'switch' },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="cuisine"
            apiUrl="/api/superadmin/cuisines" // هذا هو الـ Base URL
            queryKey="cuisines"
            fields={cuisineFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default CuisineAdd;