import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useParams } from 'react-router-dom';
import { Switch } from "@/components/ui/switch"; // تأكدي من مسار المكون في مشروعك

export default function BusinessPlan() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { restaurantId } = useParams();

    // 1. جلب البيانات
    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['business-plans'],
        queryFn: async () => {
            const res = await api.get(`/api/superadmin/businessplans/restaurant/${restaurantId}`);
            return res.data?.data?.data || res.data?.data || [];
        }
    });

    // 2. دالة تحديث الحالة (Mutation)
    // const updateStatusMutation = useMutation({
    //     mutationFn: async ({ id, currentStatus }) => {
    //         // استخدام الـ API الذي حددتِه (patch)
    //         return await api.patch(`/api/superadmin/basiccampaign/${id}/status`);
    //     },
    //     onSuccess: () => {
    //         toast.success("Status updated successfully");
    //         // إعادة جلب البيانات لتحديث الجدول
    //         queryClient.invalidateQueries(['business-plans']);
    //     },
    //     onError: () => {
    //         toast.error("Failed to update status");
    //     }
    // });

    const columns = [
        { accessorKey: 'restaurant.name', header: 'Restaurant' },
        { accessorKey: 'restaurant.nameAr', header: 'Restaurant (Arabic)' },
        { accessorKey: 'restaurant.nameFr', header: 'Restaurant (Franko)' },
        { accessorKey: 'platformType', header: 'Platform' },
        { accessorKey: 'commissionRate', header: 'Commission (%)' },
        { accessorKey: 'serviceFee', header: 'Service Fee' },
        {
            accessorKey: 'isMonthlyActive',
            header: 'Monthly',
            cell: ({ row }) => (row.original.isMonthlyActive ? '✅' : '❌')
        },
        // عمود الحالة الجديد مع الـ Switch
        // {
        //     accessorKey: 'status',
        //     header: 'Status',
        //     cell: ({ row }) => (
        //         <div className="flex items-center justify-center">
        //             <Switch
        //                 checked={row.original.status === 'active' || row.original.status === true}
        //                 onCheckedChange={() =>
        //                     updateStatusMutation.mutate({
        //                         id: row.original.id,
        //                         currentStatus: row.original.status
        //                     })
        //                 }
        //                 disabled={updateStatusMutation.isPending}
        //             />
        //         </div>
        //     )
        // },
        {
            accessorKey: 'isQuarterlyActive',
            header: 'Quarterly',
            cell: ({ row }) => (row.original.isQuarterlyActive ? '✅' : '❌')
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Business Plans"
                columns={columns}
                data={plans}
                isLoading={isLoading}
                queryKey="business-plans"
                deleteApiUrl="/api/superadmin/businessplans"
                onAdd={() => navigate(`/restaurants/business-plans/add`)}
                onEdit={(plan) => navigate(`/restaurants/business-plans/edit/${plan.id}`)}
            />
        </div>
    );
}