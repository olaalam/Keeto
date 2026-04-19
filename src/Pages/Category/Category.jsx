import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Category() {
    const navigate = useNavigate();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/categories');
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
        }, { accessorKey: 'title', header: 'title' },
        { accessorKey: 'priority', header: 'priority' },
        { accessorKey: 'meta_title', header: 'meta_title' },
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
                title="categories"
                columns={columns}
                data={categories}
                isLoading={isLoading}
                queryKey="categories"
                deleteApiUrl="/api/superadmin/categories"
                onAdd={() => navigate("/categories/add")}
                onEdit={(category) => navigate(`/categories/edit/${category.id}`)}
            />
        </div>
    );
}