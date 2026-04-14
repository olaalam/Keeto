import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function AddonsCat() {
    const navigate = useNavigate();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['addonsCategories'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/adonescategories');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: 'Category Name' },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Addon Categories"
                columns={columns}
                data={categories}
                isLoading={isLoading}
                queryKey="addonsCategories"
                deleteApiUrl="/api/superadmin/adonescategories"
                onAdd={() => navigate("/addons-categories/add")}
                onEdit={(cat) => navigate(`/addons-categories/edit/${cat.id}`)}
            />
        </div>
    );
}
