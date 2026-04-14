import React from 'react';
import AddPage from '@/components/AddPage'; // تأكد من المسار
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useFieldArray } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; // لاستخدام الـ API الخاص بالبيانات
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '@/api/axios';

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

    // 1. جلب بيانات القوائم (المطاعم، الأقسام، إلخ) من الـ API الجديد
    const { data: selectData, isLoading: isSelectLoading } = useQuery({
        queryKey: ['food-select-options'],
        queryFn: async () => {
            const response = await api.get('/api/superadmin/food/select');
            console.log(response.data.data.data.data);
            return response.data.data.data.data;
        }
    });

    // 2. جلب بيانات المنتج في حالة التعديل
    const { data: foodData, isLoading: isFetching } = useQuery({
        queryKey: ['food', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/food/${id}`);
            const raw = data.data.data;
            return {
                ...raw,
                restaurantid: String(raw.restaurantid || ""),
                categoryid: String(raw.categoryid || ""),
                subcategoryid: String(raw.subcategoryid || ""),
            };
        },
        enabled: !!id && !state?.foodData,
    });

    const initialData = state?.foodData || foodData;

    return (
        <AddPage
            title="Food Item"
            apiUrl="/api/superadmin/food"
            queryKey={['foods']}
            fields={[]} // نستخدم الـ children لبناء التصميم المخصص بالـ Tabs
            initialData={initialData}
            onSuccessAction={() => navigate("/foods")}
        >
            {({ register, control, formState: { errors }, setValue, watch }) => {
                const imagePreview = watch("image");

                return (
                    <Tabs defaultValue="basic" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                            <TabsTrigger value="variations">Variations</TabsTrigger>
                        </TabsList>

                        {/* التبويب الأول: المعلومات الأساسية - تحتوي على أغلب الحقول المطلوبة */}
                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label>Food Name *</Label>
                                    <Input
                                        {...register("name", { required: true })}
                                        placeholder="Burger Deluxe"
                                        className={errors.name ? "border-destructive" : ""}
                                    />
                                    {errors.name && <span className="text-destructive text-xs">Required</span>}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label>Description *</Label>
                                    <Input
                                        {...register("description", { required: true })}
                                        placeholder="Description of the food..."
                                        className={errors.description ? "border-destructive" : ""}
                                    />
                                    {errors.description && <span className="text-destructive text-xs">Required</span>}
                                </div>

                                {/* Image */}
                                <div className="space-y-2 col-span-full">
                                    <Label>Food Image *</Label>
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
                                            className={errors.image ? "border-destructive" : ""}
                                        />
                                        {imagePreview && (
                                            <div className="w-16 h-16 border rounded overflow-hidden">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.image && <span className="text-destructive text-xs">Required</span>}
                                </div>

                                {/* Restaurant ID */}
                                <div className="space-y-2">
                                    <Label>Restaurant *</Label>
                                    <Controller
                                        name="restaurantid"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={errors.restaurantid ? "border-destructive" : ""}>
                                                    <SelectValue placeholder={isSelectLoading ? "Loading..." : (
                                                        selectData?.allRestaurants?.find(r => String(r.id) === String(field.value))?.name || "Select Restaurant"
                                                    )} />                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectData?.allRestaurants?.map(res => (
                                                        <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.restaurantid && <span className="text-destructive text-xs">Required</span>}
                                </div>

                                {/* Category ID */}
                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Controller
                                        name="categoryid"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={errors.categoryid ? "border-destructive" : ""}>
                                                    <SelectValue placeholder={isSelectLoading ? "Loading..." : (field.value ? selectData?.allCategories?.find(c => String(c.id) === String(field.value))?.name : "Select Category")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectData?.allCategories?.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.categoryid && <span className="text-destructive text-xs">Required</span>}
                                </div>

                                {/* SubCategory ID */}
                                <div className="space-y-2">
                                    <Label>Sub Category *</Label>
                                    <Controller
                                        name="subcategoryid"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={errors.subcategoryid ? "border-destructive" : ""}>
                                                    <SelectValue placeholder={isSelectLoading ? "Loading..." : (field.value ? selectData?.allSubcategories?.find(s => String(s.id) === String(field.value))?.name : "Select Sub Category")} />
                                                </SelectTrigger>
                                                {/* Sub Category ID */}
                                                <SelectContent>
                                                    {selectData?.allSubcategories
                                                        ?.filter(sub => String(sub.categoryId) === String(watch("categoryid"))) // تصفية الأقسام الفرعية
                                                        ?.map(sub => (
                                                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.subcategoryid && <span className="text-destructive text-xs">Required</span>}
                                </div>
                            </div>
                        </TabsContent>

                        {/* التبويب الثاني: التفاصيل والمواعيد */}
                        <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Food Type</Label>
                                    <Input {...register("foodtype")} placeholder="non-veg / veg" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nutrition (kcal)</Label>
                                    <Input {...register("Nutrition")} placeholder="500 kcal" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Allergens</Label>
                                    <Input {...register("Allegren_Ingredients")} placeholder="milk, gluten" />
                                </div>
                                <div className="space-y-2 flex flex-col justify-center pt-6">
                                    <div className="flex items-center space-x-2">
                                        <Controller
                                            name="is_Halal"
                                            control={control}
                                            render={({ field }) => (
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            )}
                                        />
                                        <Label>Is Halal?</Label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Start Time *</Label>
                                    <Input
                                        type="time"
                                        {...register("startTime", { required: true })}
                                        className={errors.startTime ? "border-destructive" : ""}
                                    />
                                    {errors.startTime && <span className="text-destructive text-xs">Required</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time *</Label>
                                    <Input
                                        type="time"
                                        {...register("endTime", { required: true })}
                                        className={errors.endTime ? "border-destructive" : ""}
                                    />
                                    {errors.endTime && <span className="text-destructive text-xs">Required</span>}
                                </div>
                            </div>
                        </TabsContent>

                        {/* التبويب الثالث: التسعير والحالة */}
                        <TabsContent value="pricing" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Base Price *</Label>
                                    <Input
                                        type="number"
                                        {...register("price", { required: true })}
                                        className={errors.price ? "border-destructive" : ""}
                                    />
                                    {errors.price && <span className="text-destructive text-xs">Required</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        defaultValue="active"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
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

                        {/* التبويب الرابع: الإضافات والخيارات */}
                        <TabsContent value="variations">
                            <VariationsSection control={control} register={register} />
                        </TabsContent>
                    </Tabs>
                );
            }}
        </AddPage>
    );
};

// مكون إدارة الـ Variations
const VariationsSection = ({ control, register }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "variations"
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h3 className="text-lg font-semibold">Product Variations</h3>
                    <p className="text-sm text-muted-foreground">Manage sizes or extras.</p>
                </div>
                <Button
                    type="button"
                    onClick={() => append({
                        name: '',
                        isRequired: false,
                        selectionType: 'single',
                        min: 1,
                        max: 1,
                        options: [{ optionName: '', additionalPrice: '0' }]
                    })}
                    className="bg-orange-500 hover:bg-orange-600"
                >
                    + Add Variation
                </Button>
            </div>

            {fields.map((item, index) => (
                <div key={item.id} className="p-6 border-2 rounded-xl bg-white shadow-sm relative space-y-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        Remove
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Variation Name</Label>
                            <Input {...register(`variations.${index}.name`)} placeholder="e.g. Size" />
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
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                            <Label>Required?</Label>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <OptionsSection
                            nestIndex={index}
                            control={control}
                            register={register}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// مكون إدارة الخيارات داخل الـ Variation
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
                        <Input
                            {...register(`variations.${nestIndex}.options.${k}.optionName`)}
                            placeholder="Small / Large"
                            className="bg-white"
                        />
                    </div>

                    <div className="w-32 space-y-1">
                        <Label className="text-xs">Extra Price</Label>
                        <Input
                            type="number"
                            {...register(`variations.${nestIndex}.options.${k}.additionalPrice`)}
                            placeholder="0"
                            className="bg-white"
                        />
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
                className="mt-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
                + Add Option
            </Button>
        </div>
    );
};

export default FoodAdd;