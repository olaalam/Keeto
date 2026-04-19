import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const SubCategoryAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/subcategories/select');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: subcategoryData, isLoading: isFetching } = useQuery({
        queryKey: ['subcategory', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/subcategories/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.subcategoryData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const rawData = state?.subcategoryData || subcategoryData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            ...rawData,
            // هنا بنخرج الـ id من جوه كائن الـ country ونحطه في countryId 
            // عشان الـ AddPage والـ Select يحسوا بيه
            subcategoryId: rawData.subcategoryId || rawData.category?.id
        };
    }, [rawData]);

    const subcategoryFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        {
            name: 'subcategoryId',
            label: 'Subcategory',
            required: true,
            type: 'select',
            // التأكد من أن الـ options بتستخدم الـ id والـ name الصح
            options: categories.map(c => ({ value: c.id, label: c.name }))
        },
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
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="subcategory"
            apiUrl="/api/superadmin/subcategories" // هذا هو الـ Base URL
            queryKey="subcategories"
            fields={subcategoryFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default SubCategoryAdd;