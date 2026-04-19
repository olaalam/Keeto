import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';

const AddonsCatAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    // 3. Fetch addon data if editing
    const { data: addonsCategoriesData, isLoading: isFetching } = useQuery({
        queryKey: ['addonsCategories', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/adonescategory/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.addonsCategoriesData,
    });

    const initialData = state?.addonsCategoriesData || addonsCategoriesData;

    const fields = [
        { name: 'name', label: 'Addon Category Name', required: true },
        { name: 'nameAr', label: 'Addon Category Name (Arabic)', required: true },
        { name: 'nameFr', label: 'Addon Category Name (Franko)', required: true },

    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Addon Category"
            apiUrl="/api/superadmin/adonescategory"
            queryKey="addonsCategories"
            fields={fields}
            initialData={initialData}
            onSuccessAction={() => navigate("/addons-categories")}
        />
    );
};

export default AddonsCatAdd;