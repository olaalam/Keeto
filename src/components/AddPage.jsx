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

const AddPage = ({
    title,
    apiUrl,
    queryKey,
    // شيلنا الـ control من الـ props لأنه بيتم تعريفه بالأسفل
    fields = [],
    initialData,
    onSuccessAction
}) => {
    const isEdit = !!initialData?.id;

    const postMutation = usePost(apiUrl, 'post', queryKey);
    const updateMutation = useUpdate(apiUrl, queryKey);

    const {
        register,
        handleSubmit,
        reset,
        control, // 1. استخراج الـ control من useForm المحلية هنا
        formState: { errors, dirtyFields }
    } = useForm();

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const onSubmit = (data) => {
        if (isEdit) {
            const changedData = Object.keys(dirtyFields).reduce((acc, key) => {
                acc[key] = data[key];
                return acc;
            }, {});

            if (Object.keys(changedData).length === 0) return;

            updateMutation.mutate(
                { id: initialData.id, payload: changedData },
                { onSuccess: () => onSuccessAction?.() }
            );
        } else {
            postMutation.mutate(data, {
                onSuccess: () => {
                    reset();
                    onSuccessAction?.();
                }
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
                                        defaultValue=""
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