import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function DeliveryZone() {
    const navigate = useNavigate();

    const { data: DeliveryZone = [], isLoading } = useQuery({
        queryKey: ['DeliveryZone'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/zone-delivery-fees');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });



    const columns = [
        { accessorKey: 'fromZoneName', header: 'fromZoneId' },
        { accessorKey: 'toZoneName', header: 'toZoneId' },
        { accessorKey: 'fee', header: 'fee' },
        // {
        //     accessorKey: 'status',
        //     header: 'status',
        //     cell: ({ row }) => (
        //         <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        //             {row.original.status}
        //         </span>
        //     )
        // },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="DeliveryZone"
                columns={columns}
                data={DeliveryZone}
                isLoading={isLoading}
                queryKey="DeliveryZone"
                deleteApiUrl="/api/superadmin/zone-delivery-fees"
                onAdd={() => navigate("/delivery-zones/add")}
                onEdit={(city) => navigate(`/delivery-zones/edit/${city.id}`)}
            />
        </div>
    );
}