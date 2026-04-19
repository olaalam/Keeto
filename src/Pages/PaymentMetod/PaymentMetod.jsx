import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function PaymentMethod() {
    const navigate = useNavigate();

    const { data: paymentMethods = [], isLoading } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/payment-methods');
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
        { accessorKey: 'type', header: 'type' },

    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="paymentMethods"
                columns={columns}
                data={paymentMethods}
                isLoading={isLoading}
                queryKey="paymentMethods"
                deleteApiUrl="/api/superadmin/payment-methods"
                onAdd={() => navigate("/payment-methods/add")}
                onEdit={(paymentMethod) => navigate(`/payment-methods/edit/${paymentMethod.id}`)}
            />
        </div>
    );
}