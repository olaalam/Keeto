import React, { useState } from 'react';
import GenericDataTable from '@/components/GenericDataTable';
import ViewPermissionsModal from './ViewPermissionsModal';
import { useQuery } from '@tanstack/react-query'; // افترض أنك تستخدمين React Query
import { useNavigate } from 'react-router-dom';

export default function Permission() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);

    // جلب البيانات (استبدليها بالـ hook الخاص بك)
    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => fetch('/api/superadmin/roles').then(res => res.json())
    });

    const columns = [
        {
            accessorKey: 'name',
            header: 'NAME',
        },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        {
            id: 'view_permissions',
            header: 'PERMISSIONS',
            cell: ({ row }) => (
                <button
                    onClick={() => setSelectedRole(row.original)}
                    className="text-red-600 font-medium hover:underline"
                >
                    View
                </button>
            ),
        }
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                title="Roles Table"
                columns={columns}
                data={roles}
                isLoading={isLoading}
                queryKey="roles"
                deleteApiUrl="/api/superadmin/roles" // رابط الحذف
                onAdd={() => navigate('/permissions/add')} // توجيه لصفحة الإضافة
                onEdit={(row) => navigate(`/permissions/edit/${row.id}`)} // توجيه لصفحة التعديل
            />

            <ViewPermissionsModal
                isOpen={!!selectedRole}
                onClose={() => setSelectedRole(null)}
                role={selectedRole}
            />
        </div>
    );
}