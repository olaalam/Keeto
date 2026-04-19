import React from 'react';
import AddPage from '@/components/AddPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useFieldArray } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

// دالة مساعدة لتحويل الصورة لـ Base64
const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const FoodAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    // 1. جلب خيارات القوائم (المطاعم، الأقسام، إلخ)
    // تم تعديل المسار ليتوافق مع الصورة التي أرفقتها (response.data.data.data)
    const { data: selectOptions, isLoading: isSelectLoading } = useQuery({
        queryKey: ['food-select-options'],
        queryFn: async () => {
            const response = await api.get('/api/superadmin/food/select');
            return response.data?.data?.data || {};
        }
    });

    // 2. جلب بيانات المنتج في حالة التعديل وتنسيقها لتناسب الحقول
    const { data: foodData, isLoading: isFetching } = useQuery({
        queryKey: ['food', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/food/${id}`);
            const raw = data.data.data;

            // تحويل البيانات لتكون متوافقة مع الـ Selects والـ FieldArray
            return {
                ...raw,
                restaurantid: String(raw.restaurantid || raw.restaurant?.id || ""),
                categoryid: String(raw.categoryid || raw.category?.id || ""),
                subcategoryid: String(raw.subcategoryid || raw.subcategory?.id || ""),
                price: raw.price ? String(raw.price) : "",
                // التأكد من تنسيق الإضافات (Variations)
                variations: raw.variations?.map(v => ({
                    ...v,
                    isRequired: Boolean(v.isRequired),
                    options: v.options?.map(o => ({
                        ...o,
                        additionalPrice: String(o.additionalPrice)
                    }))
                })) || []
            };
        },
        enabled: !!id && !state?.foodData,
    });

    const initialData = state?.foodData || foodData;
    if (isSelectLoading || (id && isFetching)) {
        return <LoadingSpinner />
    }

    return (
        <AddPage
            title="Food Item"
            apiUrl="/api/superadmin/food"
            queryKey={['foods']}
            fields={[]}
            initialData={initialData}
            onSuccessAction={() => navigate("/foods")}
        >
            {({ register, control, formState: { errors }, setValue, watch }) => {
                const imagePreview = watch("image");
                const selectedCategoryId = watch("categoryid");

                return (
                    <Tabs defaultValue="basic" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                            <TabsTrigger value="variations">Variations</TabsTrigger>
                        </TabsList>

                        {/* التبويب الأول: المعلومات الأساسية */}
                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Food Name *</Label>
                                    <Input
                                        {...register("name", { required: "Name is required" })}
                                        placeholder="e.g. Cheese Burger"
                                        className={errors.name ? "border-destructive" : ""}
                                    />
                                    {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Name Ar *</Label>
                                    <Input
                                        {...register("nameAr", { required: "Name is required" })}
                                        placeholder="e.g. Cheese Burger"
                                        className={errors.nameAr ? "border-destructive" : ""}
                                    />
                                    {errors.nameAr && <span className="text-destructive text-xs">{errors.nameAr.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Name Fr *</Label>
                                    <Input
                                        {...register("nameFr", { required: "Name is required" })}
                                        placeholder="e.g. Cheese Burger"
                                        className={errors.nameFr ? "border-destructive" : ""}
                                    />
                                    {errors.nameFr && <span className="text-destructive text-xs">{errors.nameFr.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Description *</Label>
                                    <Input
                                        {...register("description", { required: "Description is required" })}
                                        placeholder="Brief description..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description Ar *</Label>
                                    <Input
                                        {...register("descriptionAr", { required: "Description is required" })}
                                        placeholder="Brief description..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description Fr *</Label>
                                    <Input
                                        {...register("descriptionFr", { required: "Description is required" })}
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div className="space-y-2 col-span-full">
                                    <Label>Food Image</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const base = await toBase64(file);
                                                    setValue("image", base);
                                                }
                                            }}
                                        />
                                        {imagePreview && (
                                            <div className="w-16 h-16 border rounded overflow-hidden">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Restaurant Select */}
                                <div className="space-y-2">
                                    <Label>Restaurant *</Label>
                                    <Controller
                                        name="restaurantid"
                                        control={control}
                                        rules={{ required: "Restaurant is required" }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Restaurant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectOptions?.allRestaurants?.map(res => (
                                                        <SelectItem key={res.id} value={String(res.id)}>{res.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                {/* Category Select */}
                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Controller
                                        name="categoryid"
                                        control={control}
                                        rules={{ required: "Category is required" }}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    setValue("subcategoryid", ""); // إعادة تعيين الفرعي عند تغيير الرئيسي
                                                }}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectOptions?.allCategories?.map(cat => (
                                                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                {/* Sub Category Select */}
                                <div className="space-y-2">
                                    <Label>Sub Category *</Label>
                                    <Controller
                                        name="subcategoryid"
                                        control={control}
                                        rules={{ required: "Subcategory is required" }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Sub Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectOptions?.allSubcategories
                                                        ?.filter(sub => String(sub.categoryId) === String(selectedCategoryId))
                                                        ?.map(sub => (
                                                            <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* التبويب الثاني: التفاصيل */}
                        <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Food Type</Label>
                                    <Input {...register("foodtype")} placeholder="non-veg / veg" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nutrition (kcal)</Label>
                                    <Input {...register("Nutrition")} />
                                </div>
                                <div className="space-y-2 flex items-center pt-8 gap-3">
                                    <Controller
                                        name="is_Halal"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                        )}
                                    />
                                    <Label>Is Halal?</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input type="time" {...register("startTime")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input type="time" {...register("endTime")} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* التبويب الثالث: التسعير */}
                        <TabsContent value="pricing" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Base Price *</Label>
                                    <Input type="number" {...register("price", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* التبويب الرابع: الإضافات */}
                        <TabsContent value="variations">
                            <VariationsSection control={control} register={register} />
                        </TabsContent>
                    </Tabs>
                );
            }}
        </AddPage>
    );
};

// مكون الإضافات (Variations)
const VariationsSection = ({ control, register }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "variations"
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-semibold">Product Variations</h3>
                <Button
                    type="button"
                    onClick={() => append({
                        name: '',
                        isRequired: false,
                        selectionType: 'single',
                        options: [{ optionName: '', additionalPrice: '0' }]
                    })}
                    className="bg-orange-500 hover:bg-orange-600"
                >
                    + Add Variation
                </Button>
            </div>

            {fields.map((item, index) => (
                <div key={item.id} className="p-6 border-2 rounded-xl bg-white relative space-y-4 shadow-sm">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 text-red-500"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Variation Name</Label>
                            <Input {...register(`variations.${index}.name`)} placeholder="e.g. Sauce" />
                        </div>

                        <div className="space-y-2">
                            <Label>Selection Type</Label>
                            <Controller
                                name={`variations.${index}.selectionType`}
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single (Radio)</SelectItem>
                                            <SelectItem value="multiple">Multiple (Checkbox)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-8">
                            <Controller
                                name={`variations.${index}.isRequired`}
                                control={control}
                                render={({ field }) => (
                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                            <Label>Required?</Label>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <OptionsSection nestIndex={index} control={control} register={register} />
                    </div>
                </div>
            ))}
        </div>
    );
};

// مكون الخيارات داخل الإضافة
const OptionsSection = ({ nestIndex, control, register }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `variations.${nestIndex}.options`
    });

    return (
        <div className="space-y-3">
            <Label className="text-blue-600 font-bold">Options & Pricing</Label>
            {fields.map((item, k) => (
                <div key={item.id} className="flex items-end gap-4 bg-slate-50 p-3 rounded-lg">
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs">Option Name</Label>
                        <Input {...register(`variations.${nestIndex}.options.${k}.optionName`)} className="bg-white" />
                    </div>
                    <div className="w-32 space-y-1">
                        <Label className="text-xs">Extra Price</Label>
                        <Input type="number" {...register(`variations.${nestIndex}.options.${k}.additionalPrice`)} className="bg-white" />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(k)}
                        disabled={fields.length === 1}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ optionName: '', additionalPrice: '0' })}
                className="mt-2 text-blue-600 border-blue-600"
            >
                + Add Option
            </Button>
        </div>
    );
};

export default FoodAdd;