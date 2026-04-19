import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function SubCategory() {
    const navigate = useNavigate();

    const { data: subcategories = [], isLoading } = useQuery({
        queryKey: ['subcategories'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/subcategories');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });



    const columns = [
        { accessorKey: 'name', header: 'name' },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        { accessorKey: 'category.name', header: 'category' },
        { accessorKey: 'priority', header: 'priority' },

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
                title="subcategories"
                columns={columns}
                data={subcategories}
                isLoading={isLoading}
                queryKey="subcategories"
                deleteApiUrl="/api/superadmin/subcategories"
                onAdd={() => navigate("/sub-categories/add")}
                onEdit={(city) => navigate(`/sub-categories/edit/${city.id}`)}
            />
        </div>
    );
}