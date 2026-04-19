import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const CategoryAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: categoryData, isLoading: isFetching } = useQuery({
        queryKey: ['category', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/categories/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.categoryData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const initialData = state?.categoryData || categoryData;

    const categoryFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'Image', label: 'image', type: 'file', required: true },
        { name: 'title', label: 'title', required: true },
        {
            name: 'priority',
            label: 'priority',
            required: true,
            type: 'select',
            options: [
                { value: 'low', label: 'low' },
                { value: 'medium', label: 'medium' },
                { value: 'high', label: 'high' },
            ]
        },
        { name: 'meta_title', label: 'meta_title', required: true },
        { name: 'meta_image', label: 'meta_image', type: 'file', required: true },
        { name: 'status', label: 'status', required: true, type: 'switch' },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="category"
            apiUrl="/api/superadmin/categories" // هذا هو الـ Base URL
            queryKey="categories"
            fields={categoryFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default CategoryAdd;