import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"; // تأكدي من مسار الـ Dialog في مشروعك

const FoodListDialog = ({ restaurantId, isOpen, onClose }) => {

    const { data: foodItems = [], isLoading } = useQuery({
        queryKey: ['restaurant-food', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/api/superadmin/food/restaurant/${restaurantId}`);
            // لاحظي هنا الوصول للبيانات قد يكون res.data.data.data حسب هيكل الـ API لديكِ
            return res.data?.data?.data || res.data?.data || [];
        },
        enabled: !!restaurantId && isOpen, // لا يعمل إلا لو الـ Dialog مفتوح ومعنا ID
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Restaurant Menu</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-10"><LoadingSpinner /></div>
                ) : foodItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {foodItems.map((item) => (
                            <div key={item.id} className="flex border rounded-lg p-3 items-center gap-4">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 rounded-md object-cover bg-gray-100"
                                />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm">{item.name}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-orange-600 font-bold text-sm">{item.price} EGP</span>
                                        {item.status === 'active' ?
                                            <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Active</span>
                                            :
                                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center text-gray-500">No food items found for this restaurant.</div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default FoodListDialog;