import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import FoodListDialog from './FoodListDialog';

export default function Restaurant() {
    const navigate = useNavigate();
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const openFoodDialog = (restaurantId) => {
        setSelectedRestaurant(restaurantId);
        setIsDialogOpen(true);
    };

    const { data: restaurants = [], isLoading } = useQuery({
        queryKey: ['restaurants'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/restaurants');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });


    const columns = [
        {
            accessorKey: "name",
            header: "Restaurant Name",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/restaurants/setting/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {row.getValue("name")}
                </button>
            )
        },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        {
            accessorKey: "logo",
            header: "Logo",
            cell: ({ row }) => (
                <div className="w-10 h-10 border rounded-full overflow-hidden">
                    <img src={row.getValue("logo")} alt="logo" className="w-full h-full object-cover" />
                </div>
            )
        },

        // { accessorKey: "ownerPhone", header: "Phone" },
        { accessorKey: "zone.name", header: "Zone" },
        {
            accessorKey: "view_food",
            header: "Food Menu",
            cell: ({ row }) => (
                <button
                    onClick={() => openFoodDialog(row.original.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                >
                    <Eye size={16} />
                    View Food
                </button>
            )
        },
        {
            accessorKey: "business_plan",
            header: "Business Plan",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`business-plans/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    View Plans
                </button>
            )
        },
        {
            accessorKey: "transaction",
            header: "Transaction",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`transaction/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    Transaction
                </button>
            )
        },
        {
            accessorKey: "order",
            header: "Order",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`order/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    Order
                </button>
            )
        },
        {
            accessorKey: "wallet",
            header: "Wallet",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`wallet/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    Wallet
                </button>
            )
        },

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
            {isDialogOpen && (
                <FoodListDialog
                    restaurantId={selectedRestaurant}
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                />
            )}
        </div>
    );
}