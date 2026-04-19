import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const navigate = useNavigate();

    const { data: admins = [], isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/admin');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    const columns = [
        { accessorKey: 'name', header: 'name' },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        { accessorKey: 'email', header: 'email' },
        { accessorKey: 'phoneNumber', header: 'phoneNumber' },
        {
            accessorKey: 'role.name', // نستخدم النقطة للوصول للـ nested property
            header: 'role',
            cell: ({ row }) => (
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    {row.original.role?.name || 'N/A'}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'status',
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
                title="admins"
                columns={columns}
                data={admins}
                isLoading={isLoading}
                queryKey="admins"
                deleteApiUrl="/api/superadmin/admin"
                onAdd={() => navigate("/admins/add")}
                onEdit={(admin) => navigate(`/admins/edit/${admin.id}`)}
            />
        </div>
    );
}