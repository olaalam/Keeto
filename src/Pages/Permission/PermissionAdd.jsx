import React, { useState, useEffect } from 'react';
import AddPage from '@/components/AddPage';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from "lucide-react"; // أيقونة التحميل

export default function PermissionAdd({ initialData }) {
    // 1. جلب هيكل الوحدات والإجراءات الديناميكي من الـ API
    const { data: schema, isLoading: isSchemaLoading } = useQuery({
        queryKey: ['permissions-schema'],
        queryFn: async () => {
            // ⚠️ استبدلي هذا الرابط برابط الـ API الفعلي الخاص بك
            const response = await fetch('/api/superadmin/permissions-list');
            if (!response.ok) throw new Error('Failed to fetch permissions schema');
            return response.json();
        }
    });

    // حالة محلية لتخزين الصلاحيات المحددة
    const [selectedPerms, setSelectedPerms] = useState({});

    // تهيئة البيانات عند التعديل
    useEffect(() => {
        if (initialData?.permissions) {
            const initialState = {};
            initialData.permissions.forEach(permGroup => {
                initialState[permGroup.module] = permGroup.actions.map(a => a.action);
            });
            setSelectedPerms(initialState);
        }
    }, [initialData]);

    const handleTogglePermission = (moduleName, actionValue, setValue) => {
        setSelectedPerms(prev => {
            const modulePerms = prev[moduleName] || [];
            let newModulePerms;

            if (modulePerms.includes(actionValue)) {
                newModulePerms = modulePerms.filter(a => a !== actionValue);
            } else {
                newModulePerms = [...modulePerms, actionValue];
            }

            const newState = { ...prev, [moduleName]: newModulePerms };
            updateFormState(newState, setValue);
            return newState;
        });
    };

    // زر تحديد الكل (يعتمد الآن على البيانات الديناميكية)
    const handleSelectAll = (checked, setValue) => {
        if (!schema) return;

        if (checked) {
            const allPerms = {};
            schema.modules.forEach(mod => {
                allPerms[mod] = schema.actions.map(a => a.value);
            });
            setSelectedPerms(allPerms);
            updateFormState(allPerms, setValue);
        } else {
            setSelectedPerms({});
            updateFormState({}, setValue);
        }
    };

    const updateFormState = (stateMatrix, setValue) => {
        const formattedPermissions = Object.keys(stateMatrix)
            .map(moduleName => {
                const actions = stateMatrix[moduleName];
                if (!actions || actions.length === 0) return null;
                return {
                    module: moduleName,
                    actions: actions.map(act => ({ action: act }))
                };
            })
            .filter(Boolean);

        setValue('permissions', formattedPermissions, { shouldDirty: true });
    };

    // عرض مؤشر تحميل أثناء جلب الصلاحيات المتاحة من الـ API
    if (isSchemaLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading permissions structure...</p>
            </div>
        );
    }

    // استخراج المصفوفات من استجابة الـ API (مع توفير قيم افتراضية لتجنب الأخطاء)
    const availableModules = schema?.modules || [];
    const availableActions = schema?.actions || [];

    return (
        <div className="p-6">
            <AddPage
                title="Role"
                apiUrl="/api/superadmin/roles"
                queryKey="roles"
                initialData={initialData}
                fields={[
                    { name: 'name', label: 'Role Name', type: 'text', required: true },
                    { name: 'nameAr', label: 'nameAr', type: 'text', required: true },
                    { name: 'nameFr', label: 'nameFr', type: 'text', required: true },
                ]}
            >
                {({ setValue }) => {

                    useEffect(() => {
                        setValue('permissions', initialData?.permissions || []);
                    }, [setValue]);

                    return (
                        <div className="space-y-6 w-full">
                            <div className="bg-gray-50 border rounded-lg p-4 flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    onCheckedChange={(c) => handleSelectAll(c, setValue)}
                                />
                                <Label htmlFor="select-all" className="font-bold cursor-pointer">
                                    Select All Permissions
                                </Label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* الاعتماد على المصفوفة الديناميكية للوحدات */}
                                {availableModules.map(moduleName => (
                                    <div key={moduleName} className="border rounded-lg p-4 bg-white shadow-sm">
                                        <h3 className="font-bold uppercase mb-4 text-gray-800 border-b pb-2">
                                            {moduleName.replace('_', ' ')}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* الاعتماد على المصفوفة الديناميكية للإجراءات */}
                                            {availableActions.map(action => {
                                                const isChecked = selectedPerms[moduleName]?.includes(action.value) || false;
                                                return (
                                                    <div key={action.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${moduleName}-${action.value}`}
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleTogglePermission(moduleName, action.value, setValue)}
                                                        />
                                                        <Label
                                                            htmlFor={`${moduleName}-${action.value}`}
                                                            className="cursor-pointer font-normal text-sm"
                                                        >
                                                            {action.label}
                                                        </Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }}
            </AddPage>
        </div>
    );
}