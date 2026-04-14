import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable'; // تأكد من المسار
import { useQuery } from '@tanstack/react-query'; // أو استخدم الـ Hook الخاص بجلب البيانات عندك
import api from '@/api/axios';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ListTree } from "lucide-react";

const Foods = () => {
    const navigate = useNavigate();
    const [selectedVariations, setSelectedVariations] = useState(null);



    const { data: foods = [], isLoading } = useQuery({
        queryKey: ['foods'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/food');
            return res.data.data.data;
        }
    });

    // تعريف الأعمدة بناءً على شكل بيانات الـ Food
    const columns = [
        {
            accessorKey: 'image',
            header: 'Image',
            // Custom Cell لعرض الصورة بشكل مصغر
            cell: ({ row }) => {
                const imageUrl = row.original.image;
                return (
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                        {imageUrl ? (
                            <img src={imageUrl} alt={row.original.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-xs text-gray-400">No Img</div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'name',
            header: 'Food Name',
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: ({ row }) => (
                <span className="font-medium text-green-600">
                    {row.original.price} EGP
                </span>
            )
        },
        {
            accessorKey: 'foodtype',
            header: 'Type',
            cell: ({ row }) => (
                <span className="capitalize">{row.original.foodtype}</span>
            )
        },
        {
            accessorKey: 'is_Halal',
            header: 'Halal',
            cell: ({ row }) => (
                row.original.is_Halal ?
                    <span className="text-green-600 font-bold">Yes</span> :
                    <span className="text-gray-400">No</span>
            )
        },
        {
            accessorKey: 'variations',
            header: 'Variations',
            cell: ({ row }) => {
                const variations = row.original.variations || [];
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVariations(variations)}
                        className="flex items-center gap-2"
                    >
                        <ListTree className="h-4 w-4" />
                        View ({variations.length})
                    </Button>
                );
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                );
            }
        }
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                title="Foods Menu"
                columns={columns}
                data={foods || []} // مرر المصفوفة هنا
                isLoading={isLoading}
                queryKey={['foods']}
                deleteApiUrl="/api/superadmin/food" // رابط الـ API للحذف

                // التوجيه لصفحة الإضافة
                onAdd={() => navigate('/foods/add')}

                // التوجيه لصفحة التعديل وتمرير الـ ID
                onEdit={(row) => navigate(`/foods/edit/${row.id}`)}
            />
            {/* Dialog لعرض الـ Variations */}
            <Dialog open={!!selectedVariations} onOpenChange={() => setSelectedVariations(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Product Variations</DialogTitle>
                        <DialogDescription>
                            Detailed options and pricing for this food item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {selectedVariations?.map((v, idx) => (
                            <div key={idx} className="border p-4 rounded-lg bg-slate-50">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-lg">{v.name}</h4>
                                    <div className="flex gap-2">
                                        <Badge>{v.selectionType}</Badge>
                                        {v.isRequired && <Badge variant="destructive">Required</Badge>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {v.options?.map((opt, i) => (
                                        <div key={i} className="flex justify-between bg-white p-2 rounded border text-sm">
                                            <span>{opt.optionName}</span>
                                            <span className="text-green-600">+{opt.additionalPrice} EGP</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(!selectedVariations || selectedVariations.length === 0) && (
                            <p className="text-center text-muted-foreground">No variations found for this item.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Foods;