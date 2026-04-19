import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Zone() {
    const navigate = useNavigate();

    const { data: zones = [], isLoading } = useQuery({
        queryKey: ['zones'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/zones');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });



    const columns = [
        { accessorKey: 'name', header: 'name' },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        { accessorKey: 'city.name', header: 'city' },
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
                title="zones"
                columns={columns}
                data={zones}
                isLoading={isLoading}
                queryKey="zones"
                deleteApiUrl="/api/superadmin/zones"
                onAdd={() => navigate("/zones/add")}
                onEdit={(zone) => navigate(`/zones/edit/${zone.id}`)}
            />
        </div>
    );
}