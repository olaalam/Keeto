import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Addons() {
    const navigate = useNavigate();

    const { data: addons = [], isLoading } = useQuery({
        queryKey: ['addons'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/addons');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: 'Addon Name' },
        { accessorKey: 'nameAr', header: 'Addon Name (Arabic)' },
        { accessorKey: 'nameFr', header: 'Addon Name (Franko)' },
        { accessorKey: 'price', header: 'Price' },
        { accessorKey: 'stock_type', header: 'Stock Type' },
        {
            accessorKey: 'adonescategory.name',
            header: 'Category',
            cell: ({ row }) => row.original.adonescategory?.name || 'N/A'
        },
        {
            accessorKey: 'restaurant.name',
            header: 'Restaurant',
            cell: ({ row }) => row.original.restaurant?.name || 'N/A'
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Modifier"
                columns={columns}
                data={addons}
                isLoading={isLoading}
                queryKey="addons"
                deleteApiUrl="/api/superadmin/addons"
                onAdd={() => navigate("/addons/add")}
                onEdit={(addon) => navigate(`/addons/edit/${addon.id}`)}
            />
        </div>
    );
}