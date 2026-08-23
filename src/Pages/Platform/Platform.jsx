import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Platform() {
    const navigate = useNavigate();


    const { data: platform = [], isLoading } = useQuery({
        queryKey: ['platform'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/platform');
            return res.data.data.data;
        }
    });

    const columns = [
        {
            accessorKey: "logo", 
            header: ("logo"),
            cell: ({ row }) => {
                const imageStr = row.getValue("logo");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="Platform Icon"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                {("noImage")}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: ("name"),
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={("platform")}
                columns={columns}
                data={platform}
                isLoading={isLoading}
                queryKey="platform"
                deleteApiUrl="/api/superadmin/platform/"
                onAdd={() => navigate("/platform/add")}
                onEdit={(platform) => navigate(`/platform/edit/${platform.id}`)}
            />
        </div>
    );
}