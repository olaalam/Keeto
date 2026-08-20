import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';


const PlatformAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();


    // جلب بيانات الحساب المحدد في حالة التعديل
    const { data: platformData, isLoading: isFetching, error } = useQuery({
        queryKey: ['platform', id],
        queryFn: async () => {
            console.log("Fetching data for ID:", id);
            const { data } = await api.get(`/api/superadmin/platform/${id}`);
            
            if (data?.data?.data && Array.isArray(data.data.data)) {
                return data.data.data[0]; 
            }
            return data?.data?.data; 
        },
        enabled: !!id && !state?.platformData, 
    });

    if (error) {
        console.error("Error fetching platform data:", error);
    }

    const rawData = state?.platformData || platformData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            name: rawData.name || '',
            logo: rawData.logo || '', 
            id: rawData.id
        };
    }, [rawData]);

    const platformFields = [
        { name: 'name', label: ('name'), required: true },
        { name: 'logo', label: ('logo'), type: 'file', required: !id }, 
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={id ? ("editplatform") : ("addplatform")} // تخصيص العنوان حسب حالة التعديل/الإضافة
            apiUrl={id ? `/api/superadmin/platform/` : "/api/superadmin/platform"} 
            fields={platformFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default PlatformAdd;