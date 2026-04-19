import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Cuisine() {
    const navigate = useNavigate();

    const { data: cuisines = [], isLoading } = useQuery({
        queryKey: ['cuisines'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/cuisines');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    const columns = [
        { accessorKey: 'name', header: 'name' },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        {
            accessorKey: "Image", // التأكد من مطابقة الاسم الراجع من الـ API (حرف I كبير)
            header: "Image",
            cell: ({ row }) => {
                const imageStr = row.getValue("Image");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="category"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                );
            },
        }, { accessorKey: 'description', header: 'description' },
        { accessorKey: 'descriptionAr', header: 'descriptionAr' },
        { accessorKey: 'descriptionFr', header: 'descriptionFr' },
        { accessorKey: 'meta_description', header: 'meta_description' },
        {
            accessorKey: "meta_image",
            header: "Meta Image",
            cell: ({ row }) => {
                const metaImg = row.getValue("meta_image");
                return (
                    <div className="w-10 h-10 border rounded shadow-sm">
                        {metaImg && <img src={metaImg} className="w-full h-full object-cover rounded" />}
                    </div>
                );
            }
        }, { accessorKey: 'status', header: 'status' },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="cuisines"
                columns={columns}
                data={cuisines}
                isLoading={isLoading}
                queryKey="cuisines"
                deleteApiUrl="/api/superadmin/cuisines"
                onAdd={() => navigate("/cuisines/add")}
                onEdit={(cuisine) => navigate(`/cuisines/edit/${cuisine.id}`)}
            />
        </div>
    );
}