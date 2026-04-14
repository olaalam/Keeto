import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useParams } from 'react-router-dom';

export default function Setting() {
    const navigate = useNavigate();
    const { id } = useParams(); // الحصول على معرف المطعم من الرابط

    const { data: settings = [], isLoading } = useQuery({
        // استخدام مفتاح فريد يعتمد على الـ id لتجنب تداخل البيانات في الكاش
        queryKey: ['restaurant-settings', id],
        queryFn: async () => {
            const res = await api.get(`/api/superadmin/restaurantsetting/${id}`);

            // الوصول إلى الكائن داخل data.settings حسب الـ Response الخاص بكِ
            const settingsData = res.data?.data?.settings;

            // بما أن الجدول يتوقع مصفوفة (Array) والـ API يرجع كائن واحد (Object)
            // نقوم بوضعه داخل مصفوفة [settingsData] ليظهر كصف واحد في الجدول
            return settingsData ? [settingsData] : [];
        },
        enabled: !!id // التأكد من وجود id قبل إرسال الطلب
    });

    const columns = [
        {
            accessorKey: "foodManagement",
            header: "Food Management",
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded text-xs ${getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {getValue() ? "Enabled" : "Disabled"}
                </span>
            )
        },
        {
            accessorKey: "scheduledDelivery",
            header: "Scheduled Delivery",
            cell: ({ getValue }) => getValue() ? "Yes" : "No"
        },
        {
            accessorKey: "reviewsSection",
            header: "Reviews",
            cell: ({ getValue }) => getValue() ? "Visible" : "Hidden"
        },
        {
            accessorKey: "posSection",
            header: "POS",
            cell: ({ getValue }) => getValue() ? "Active" : "Inactive"
        },
        {
            accessorKey: "homeDelivery",
            header: "Home Delivery",
            cell: ({ getValue }) => getValue() ? "Available" : "N/A"
        },
        {
            accessorKey: "minOrderAmount",
            header: "Min Order",
            cell: ({ getValue }) => `${getValue()} EGP`
        },
        {
            header: "Delivery Time",
            cell: ({ row }) => `${row.original.minDeliveryTime} - ${row.original.maxDeliveryTime} min`
        },
        {
            accessorKey: "vegType",
            header: "Vegetarian Type"
        },
        {
            accessorKey: "dineIn",
            header: "Dine In",
            cell: ({ getValue }) => getValue() ? "Yes" : "No"
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Restaurant Settings"
                columns={columns}
                data={settings} // سيمرر مصفوفة تحتوي على كائن الإعدادات
                isLoading={isLoading}
                queryKey={['restaurant-settings', id]}
                // عند الضغط على تعديل، نتوجه لصفحة التعديل الخاصة بهذا المطعم
                onEdit={() => navigate(`/restaurants/setting/edit/${id}`)}
            />
        </div>
    );
}