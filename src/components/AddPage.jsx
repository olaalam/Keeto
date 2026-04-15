import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form'; // استيراد Controller
import { usePost } from '@/hooks/usePost';
import { useUpdate } from '@/hooks/useUpdate';

// استيراد مكونات Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const AddPage = ({
    title,
    apiUrl,
    queryKey,
    // شيلنا الـ control من الـ props لأنه بيتم تعريفه بالأسفل
    fields = [],
    initialData,
    onSuccessAction,
    children
}) => {
    const isEdit = !!initialData?.id;
    const formMethods = useForm({
        defaultValues: initialData || {}
    });
    const { control, handleSubmit, register, reset, formState: { errors, dirtyFields } } = formMethods;
    const postMutation = usePost(apiUrl, 'post', queryKey);
    const updateMutation = useUpdate(apiUrl, queryKey);
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });


    useEffect(() => {
        if (initialData) {
            // تنسيق البيانات قبل وضعها في الفورم
            const formattedData = { ...initialData };

            fields.forEach(field => {
                if (field.type === 'date' && initialData[field.name]) {
                    // تحويل التاريخ من ISO String إلى YYYY-MM-DD
                    formattedData[field.name] = new Date(initialData[field.name])
                        .toISOString()
                        .split('T')[0];
                }
            });

            // keepDirtyValues: true → يخلي القيم اللي المستخدم غيرها (مثل lat/lng من الخريطة)
            // محمية ومش بترجع للقيم القديمة عند أي re-render
            reset(formattedData, { keepDirtyValues: true });
        }
    }, [initialData, reset, fields]);
    const onSubmit = (data) => {
        // 1. لو إحنا في حالة تعديل
        if (isEdit) {
            // ابعت الـ data اللي جاية من البرامتر فوراً
            updateMutation.mutate(
                { id: initialData.id, payload: data },
                { onSuccess: () => onSuccessAction?.() }
            );
        } else {
            postMutation.mutate(data, {
                onSuccess: () => onSuccessAction?.()
            });
        }
    };

    const isLoading = postMutation.isPending || updateMutation.isPending;

    return (
        <Card className="mx-auto shadow-lg border-none">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-capitalize">
                    {isEdit ? `Edit ${title}` : `Add ${title}`}
                </CardTitle>
                <CardDescription>
                    Please fill the following data, the marked fields are required.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name}>
                                    {field.label} {field.required && <span className="text-destructive">*</span>}
                                </Label>

                                {field.type === 'select' ? (
                                    <Controller
                                        name={field.name}
                                        control={control} // 2. سيستخدم الـ control المُعرف في السطر 31
                                        defaultValue={initialData?.[field.name] || ""}
                                        rules={{ required: field.required }}
                                        render={({ field: { onChange, value } }) => (
                                            <Select
                                                onValueChange={onChange}
                                                // تأكدي من تحويل القيمة لنص لأن Shadcn Select لا يقبل الأرقام كقيم
                                                value={value ? String(value) : ""}
                                            >
                                                <SelectTrigger className={errors[field.name] ? "border-destructive" : ""}>
                                                    <SelectValue placeholder={`Select ${field.label}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options?.map((option) => (
                                                        <SelectItem key={option.value} value={String(option.value)}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                ) : field.type === 'file' ? (
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        rules={{ required: isEdit ? false : field.required }} // في التعديل غالباً الصورة ليست إجبارية
                                        render={({ field: { onChange, value } }) => (
                                            <div className="space-y-3">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const base64 = await toBase64(file);
                                                            onChange(base64); // تحديث القيمة بـ Base64 الجديد
                                                        }
                                                    }}
                                                    className={errors[field.name] ? "border-destructive" : ""}
                                                />

                                                {/* الجزء الخاص بعرض الصورة */}
                                                {value && (
                                                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                                                        <img
                                                            src={value} // هنا سيقرأ الـ Base64 المباشر سواء قديم أو جديد
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                                                            Current
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    />
                                ) : field.type === 'switch' ? (
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        defaultValue={false}
                                        render={({ field: { onChange, value } }) => (
                                            <Switch
                                                checked={value}
                                                onCheckedChange={onChange}
                                            />
                                        )}
                                    />
                                ) : (
                                    <Input
                                        id={field.name}
                                        type={field.type || 'text'}
                                        {...register(field.name, { required: field.required })}
                                        className={errors[field.name] ? "border-destructive" : ""}
                                    />
                                )}

                                {errors[field.name] && <p className="text-destructive text-xs">Required</p>}
                            </div>
                        ))}
                        {children && (
                            <div className="col-span-full">
                                {typeof children === 'function'
                                    ? children(formMethods)
                                    : children}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t">
                        <Button type="submit" disabled={isLoading} className="w-full md:w-32">
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> {isEdit ? 'update' : 'save'}</>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddPage;