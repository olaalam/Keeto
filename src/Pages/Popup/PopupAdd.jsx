import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const PopupAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: popupData, isLoading: isFetching } = useQuery({
        queryKey: ['popup', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/popup/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.popupData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const rawData = state?.popupData || popupData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;
        return {
            ...rawData,
            status: rawData.status === true || rawData.status === 'active' ? 'active' : 'inactive'
        };
    }, [rawData]);

    const popupFields = [
        { name: 'Title', label: 'Title', required: true },
        { name: 'TitleAr', label: 'TitleAr', required: true },
        { name: 'TitleFr', label: 'TitleFr', required: true },
        { name: 'Image', label: 'image', type: 'file', required: true },
        { name: 'ImageAr', label: 'imageAr', type: 'file', required: true },
        { name: 'ImageFr', label: 'imageFr', type: 'file', required: true },
        { name: 'description', label: 'description', required: true },
        { name: 'descriptionAr', label: 'descriptionAr', required: true },
        { name: 'descriptionFr', label: 'descriptionFr', required: true },
        {
            name: 'type',
            label: 'Type',
            type: 'select',
            required: true,
            options: [
                { label: 'MyKeeto', value: 'mykeeto_app' },
                { label: 'Limited', value: 'limited' },
                { label: 'Daily', value: 'daily' },
            ]
        },
        {
            name: 'status',
            label: 'status',
            type: 'select',
            required: true,
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
            ]
        },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date', required: true },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="popup"
            apiUrl="/api/superadmin/popup" // هذا هو الـ Base URL
            queryKey="popup"
            fields={popupFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default PopupAdd;