import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Wallet, ArrowDownCircle, BadgeCheck } from "lucide-react";

export default function Wallet() {
    const navigate = useNavigate();

    // 1. جلب بيانات المحافظ (استخدام useQuery العادي)
    const { data: wallets = [], isLoading } = useQuery({
        queryKey: ['wallets'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/wallets');
            return res.data.data.data;
        }
    });

    // 2. تعريف أعمدة الجدول
    const columns = [
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
            accessorKey: "balance",
            header: "Balance",
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">
                    {row.getValue("balance")} E£
                </span>
            )
        },
        {
            accessorKey: "pending_withdraw",
            header: "Pending Withdraw",
            cell: ({ row }) => (
                <span className="text-orange-600">
                    {row.getValue("pending_withdraw")} E£
                </span>
            )
        },
        {
            accessorKey: "total_withdrawn",
            header: "Total Withdrawn",
            cell: ({ row }) => (
                <span className="text-red-600">
                    {row.getValue("total_withdrawn")} E£
                </span>
            )
        },
        {
            accessorKey: "total_earning",
            header: "Total Earning",
            cell: ({ row }) => (
                <span className="text-blue-600">
                    {row.getValue("total_earning")} E£
                </span>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.original.status}
                </span>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {/* زر عرض المحفظة (نفس منطق زر الـ Food) */}
                    <button
                        onClick={() => navigate(`/wallet/restaurant/${row.original.restaurant_id}`)}
                        className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                    >
                        <Wallet size={16} />
                        View Wallet
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Wallets"
                columns={columns}
                data={wallets}
                isLoading={isLoading}
                queryKey="wallets"
                // لا يوجد زر إضافة (لأن المحافظ تُنشأ تلقائياً مع المطاعم)
                // لا يوجد delete
                onEdit={false}
            />
        </div>
    );
}