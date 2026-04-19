import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useParams } from 'react-router-dom';
import { DollarSign, Wallet, ArrowDownCircle, BadgeCheck } from "lucide-react";

export default function Order() {
    const navigate = useNavigate();
    const { id: restaurantId } = useParams();

    // 1. جلب بيانات الطلبات (استخدام useQuery العادي)
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await api.get(`/api/superadmin/order/${restaurantId}`);
            return res.data.data.data;
        }
    });

    // 2. تعريف أعمدة الجدول
    const columns = [
        {
            accessorKey: "order_number",
            header: "Order Number",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/orders/edit/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {row.getValue("order_number")}
                </button>
            )
        },
        {
            accessorKey: "restaurant.name",
            header: "Restaurant Name",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/restaurants/setting/${row.original.restaurant_id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {row.getValue("restaurant.name")}
                </button>
            )
        },
        {
            accessorKey: "total_amount",
            header: "Total Amount",
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">
                    {row.getValue("total_amount")} E£
                </span>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {row.original.status}
                </span>
            )
        },
        {
            accessorKey: "payment_status",
            header: "Payment Status",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.original.payment_status}
                </span>
            )
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => (
                new Date(row.original.created_at).toLocaleDateString()
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {/* زر عرض الطلب (نفس منطق زر الـ Food) */}
                    <button
                        onClick={() => navigate(`/orders/edit/${row.original.id}`)}
                        className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                    >
                        <Wallet size={16} />
                        View Order
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Orders"
                columns={columns}
                data={orders}
                isLoading={isLoading}
                queryKey="orders"
                // لا يوجد زر إضافة (لأن الطلبات تُنشأ من التطبيق)
                // لا يوجد delete
                onEdit={false}
            />
        </div>
    );
}