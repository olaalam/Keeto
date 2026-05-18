import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Controller, useFieldArray } from "react-hook-form";
import { Trash2, Plus } from 'lucide-react';

const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Dynamic Variations Group Manager
const VariationsManager = ({ control, register, errors, watch }) => {
    const { fields: variationFields, append: appendVariation, remove: removeVariation } = useFieldArray({
        control,
        name: "variations"
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Label className="text-base font-bold">Product Variations</Label>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => appendVariation({ 
                        name: "", 
                        nameAr: "", 
                        nameFr: "", 
                        type: "single", 
                        min: "1", 
                        max: "1", 
                        isRequired: false, 
                        options: [] 
                    })}
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Variation Group
                </Button>
            </div>

            {variationFields.map((field, index) => {
                const currentType = watch(`variations.${index}.type`) || "single";

                return (
                    <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-gray-50/50 relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                            onClick={() => removeVariation(index)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        {/* Text Titles */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-8">
                            <div className="space-y-2">
                                <Label>Group Name (EN) *</Label>
                                <Input {...register(`variations.${index}.name`, { required: true })} placeholder="e.g. Choose Crust" />
                            </div>
                            <div className="space-y-2">
                                <Label>Group Name (AR) *</Label>
                                <Input {...register(`variations.${index}.nameAr`, { required: true })} placeholder="مثال: نوع الحواف" />
                            </div>
                            <div className="space-y-2">
                                <Label>Group Name (FR) *</Label>
                                <Input {...register(`variations.${index}.nameFr`, { required: true })} placeholder="e.g. Type de croûte" />
                            </div>
                        </div>

                        {/* Selection configuration logic parameters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                            <div className="space-y-2">
                                <Label>Selection Type *</Label>
                                <Controller
                                    name={`variations.${index}.type`}
                                    control={control}
                                    defaultValue="single"
                                    render={({ field: typeField }) => (
                                        <Select onValueChange={typeField.onChange} value={typeField.value}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="single">Single Choice (Radio)</SelectItem>
                                                <SelectItem value="multiple">Multiple Choice (Checkbox)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* Conditionally reveal min/max constraints input metrics fields */}
                            {currentType === "multiple" && (
                                <>
                                    <div className="space-y-2 animate-in fade-in duration-200">
                                        <Label>Minimum Selection *</Label>
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            className="bg-white"
                                            {...register(`variations.${index}.min`, { required: true })} 
                                        />
                                    </div>
                                    <div className="space-y-2 animate-in fade-in duration-200">
                                        <Label>Maximum Selection *</Label>
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            className="bg-white"
                                            {...register(`variations.${index}.max`, { required: true })} 
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Controller
                                name={`variations.${index}.isRequired`}
                                control={control}
                                render={({ field: switchField }) => (
                                    <Switch
                                        id={`required-${index}`}
                                        checked={switchField.value}
                                        onCheckedChange={switchField.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor={`required-${index}`}>Required Selection Group</Label>
                        </div>

                        {/* Options Section */}
                        <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                            <OptionsManager nestIndex={index} control={control} register={register} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const OptionsManager = ({ nestIndex, control, register }) => {
    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `variations.${nestIndex}.options`
    });

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-gray-500">Choices / Options</Label>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8"
                    onClick={() => appendOption({ optionName: "", optionNameAr: "", nameFr: "", additionalPrice: "0" })}
                >
                    <Plus className="w-3 h-3 mr-1" /> Add Choice
                </Button>
            </div>

            {optionFields.map((optField, optIndex) => (
                <div key={optField.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end bg-white p-2 border rounded-lg shadow-sm">
                    <div>
                        <Label className="text-xs">Option (EN)</Label>
                        <Input {...register(`variations.${nestIndex}.options.${optIndex}.optionName`, { required: true })} className="h-8 text-xs" />
                    </div>
                    <div>
                        <Label className="text-xs">Option (AR)</Label>
                        <Input {...register(`variations.${nestIndex}.options.${optIndex}.optionNameAr`, { required: true })} className="h-8 text-xs text-right" dir="rtl" />
                    </div>
                    <div>
                        <Label className="text-xs">Extra Price</Label>
                        <Input type="number" step="0.01" {...register(`variations.${nestIndex}.options.${optIndex}.additionalPrice`, { required: true })} className="h-8 text-xs" />
                    </div>
                    <div className="flex items-center justify-between pb-1">
                        <div className="w-full pl-1">
                            <Label className="text-xs">Option (FR)</Label>
                            <Input {...register(`variations.${nestIndex}.options.${optIndex}.nameFr`, { required: true })} className="h-8 text-xs" />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8 ml-1 mt-4"
                            onClick={() => removeOption(optIndex)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const FoodAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const { data: selectOptions, isLoading: isSelectLoading } = useQuery({
        queryKey: ['food-select-options'],
        queryFn: async () => {
            const response = await api.get('/api/superadmin/food/select');
            return response.data?.data?.data || {};
        }
    });

    const { data: foodData, isLoading: isFetching } = useQuery({
        queryKey: ['food', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/food/${id}`);
            const raw = data.data.data;

            return {
                ...raw,
                restaurantid: String(raw.restaurantid || raw.restaurant?.id || ""),
                categoryid: String(raw.categoryid || raw.category?.id || ""),
                subcategoryid: String(raw.subcategoryid || raw.subcategory?.id || ""),
                price: raw.price ? String(raw.price) : "",
                variations: raw.variations?.map(v => ({
                    ...v,
                    type: v.type || "single",
                    // Handle null values coming from the database smoothly
                    min: v.min !== null && v.min !== undefined ? String(v.min) : "1",
                    max: v.max !== null && v.max !== undefined ? String(v.max) : "1",
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
        return <LoadingSpinner />;
    }

    return (
        <AddPage
            title="Food Item"
            apiUrl="/api/superadmin/food"
            queryKey="foods"
            fields={[]} 
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
            beforeSubmit={(data) => ({
                ...data,
                price: Number(data.price),
                restaurantid: Number(data.restaurantid),
                categoryid: Number(data.categoryid),
                subcategoryid: data.subcategoryid ? Number(data.subcategoryid) : null,
                variations: data.variations?.map(v => ({
                    ...v,
                    type: v.type,
                    // If single type selection, clean it up and send null back to your database structure
                    min: v.type === "multiple" ? Number(v.min) : null,
                    max: v.type === "multiple" ? Number(v.max) : null,
                    isRequired: Boolean(v.isRequired),
                    options: v.options?.map(o => ({
                        ...o,
                        additionalPrice: Number(o.additionalPrice)
                    }))
                })) || []
            })}
        >
            {(methods) => {
                const { register, control, formState: { errors }, setValue, watch } = methods;
                const imagePreview = watch("image");
                const selectedCategoryId = watch("categoryid");

                const availableSubCategories = selectOptions?.allSubCategories?.filter(
                    sub => String(sub.categoryId) === String(selectedCategoryId)
                ) || [];

                return (
                    <Tabs defaultValue="basic" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-4 mb-8">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="details">Classification</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing & Media</TabsTrigger>
                            <TabsTrigger value="variations">Variations</TabsTrigger>
                        </TabsList>

                        {/* Basic Info */}
                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Food Name (EN) *</Label>
                                    <Input {...register("name", { required: true })} placeholder="e.g. Cheese Burger" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Name (AR) *</Label>
                                    <Input {...register("nameAr", { required: true })} placeholder="برجر جبنة" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Name (FR) *</Label>
                                    <Input {...register("nameFr", { required: true })} placeholder="Burger au Fromage" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (EN) *</Label>
                                    <Input {...register("description", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (AR) *</Label>
                                    <Input {...register("descriptionAr", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (FR) *</Label>
                                    <Input {...register("descriptionFr", { required: true })} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Classification */}
                        <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Restaurant Target *</Label>
                                    <Controller
                                        name="restaurantid"
                                        control={control}
                                        rules={{ required: true }}
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

                                <div className="space-y-2">
                                    <Label>Main Category *</Label>
                                    <Controller
                                        name="categoryid"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select 
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    setValue("subcategoryid", "");
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

                                <div className="space-y-2">
                                    <Label>Sub Category</Label>
                                    <Controller
                                        name="subcategoryid"
                                        control={control}
                                        render={({ field }) => (
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value}
                                                disabled={!selectedCategoryId || availableSubCategories.length === 0}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={availableSubCategories.length === 0 ? "No Subcategories" : "Select Sub Category"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSubCategories.map(sub => (
                                                        <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Pricing & Media */}
                        <TabsContent value="pricing" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Base Price *</Label>
                                    <Input type="number" step="0.01" {...register("price", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Image</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const base = await toBase64(file);
                                                    setValue("image", base, { shouldDirty: true });
                                                }
                                            }}
                                        />
                                        {imagePreview && (
                                            <div className="w-16 h-16 border rounded overflow-hidden shrink-0">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Variations Manager */}
                        <TabsContent value="variations" className="space-y-4">
                            <VariationsManager 
                                control={control} 
                                register={register} 
                                errors={errors} 
                                watch={watch} 
                            />
                        </TabsContent>
                    </Tabs>
                );
            }}
        </AddPage>
    );
};

export default FoodAdd;