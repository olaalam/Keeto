import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable'; // تأكد من المسار
import { useQuery } from '@tanstack/react-query';
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
            // التوجيه الصحيح للبيانات بناءً على الـ JSON المرفق
            return res.data.data.data;
        }
    });

    // تعريف الأعمدة بناءً على شكل بيانات الـ Food الجديد
    const columns = [
        {
            accessorKey: 'image',
            header: 'Image',
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
            cell: ({ row }) => (
                <span className="capitalize font-medium">{row.original.name}</span>
            )
        },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
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
            accessorKey: 'restaurant',
            header: 'Restaurant',
            cell: ({ row }) => (
                <span>{row.original.restaurant?.name || '-'}</span>
            )
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize">
                    {row.original.category?.name || '-'}
                </Badge>
            )
        },
        {
            accessorKey: 'subcategory',
            header: 'Subcategory',
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 capitalize">
                    {row.original.subcategory?.name || '-'}
                </span>
            )
        },
        {
            accessorKey: 'variations',
            header: 'Variations',
            cell: ({ row }) => {
                // الاعتماد على مصفوفة فارغة لو مش موجودة في الـ response الحالي
                const variations = row.original.variations || [];
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVariations(variations)}
                        className="flex items-center gap-2"
                    // ممكن نضيف disabled لو مفيش variations عشان نحسن تجربة المستخدم
                    // disabled={variations.length === 0} 
                    >
                        <ListTree className="h-4 w-4" />
                        View ({variations.length})
                    </Button>
                );
            }
        }
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                title="Foods Menu"
                columns={columns}
                data={foods || []}
                isLoading={isLoading}
                queryKey={['foods']}
                deleteApiUrl="/api/superadmin/food"

                onAdd={() => navigate('/foods/add')}
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
                            <p className="text-center text-muted-foreground py-8">
                                No variations found for this item.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Foods;