import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Restaurant() {
    const navigate = useNavigate();

    const { data: restaurants = [], isLoading } = useQuery({
        queryKey: ['restaurants'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/restaurants');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });


    const columns = [
        {
            accessorKey: "logo",
            header: "Logo",
            cell: ({ row }) => (
                <div className="w-10 h-10 border rounded-full overflow-hidden">
                    <img src={row.getValue("logo")} alt="logo" className="w-full h-full object-cover" />
                </div>
            )
        },
        { accessorKey: "name", header: "Restaurant Name" },
        { accessorKey: "ownerPhone", header: "Phone" },
        { accessorKey: "zone.name", header: "Zone" }, // لو الـ API بيرجع الـ Zone كـ Object
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.original.status}
                </span>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="restaurants"
                columns={columns}
                data={restaurants}
                isLoading={isLoading}
                queryKey="restaurants"
                deleteApiUrl="/api/superadmin/restaurants"
                onAdd={() => navigate("/restaurants/add")}
                onEdit={(restaurant) => navigate(`/restaurants/edit/${restaurant.id}`)}
            />
        </div>
    );
}