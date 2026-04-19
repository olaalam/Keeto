import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';

const AddonsAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    // 1. Fetch select data (restaurants and categories)
    const { data: selectData } = useQuery({
        queryKey: ['addonsSelectData'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/addons/select');
            return res.data.data.data;
        }
    });

    const restaurants = selectData?.allRestaurants || [];
    const categories = selectData?.allAddons || [];

    // 3. Fetch addon data if editing
    const { data: addonData, isLoading: isFetching } = useQuery({
        queryKey: ['addon', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/addons/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.addonData,
    });

    const initialData = state?.addonData || addonData;

    const fields = [
        { name: 'name', label: 'Addon Name', required: true },
        { name: 'nameAr', label: 'Addon Name (Arabic)', required: true },
        { name: 'nameFr', label: 'Addon Name (Franko)', required: true },
        { name: 'price', label: 'Price', type: 'number', required: true },
        {
            name: 'stock_type',
            label: 'Stock Type',
            type: 'select',
            required: true,
            options: [
                { label: 'Unlimited', value: 'unlimited' },
                { label: 'Limited', value: 'limited' },
                { label: 'Daily', value: 'daily' },
            ]
        },
        {
            name: 'restaurantid',
            label: 'Restaurant',
            type: 'select',
            required: true,
            options: Array.isArray(restaurants)
                ? restaurants.map(r => ({ label: r.name, value: r.id }))
                : []
        },
        {
            name: 'adonescategoryid',
            label: 'Addon Category',
            type: 'select',
            required: true,
            options: Array.isArray(categories)
                ? categories.map(c => ({ label: c.name, value: c.id }))
                : []
        },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Modifier"
            apiUrl="/api/superadmin/addons"
            queryKey="addons"
            fields={fields}
            initialData={initialData}
            onSuccessAction={() => navigate("/addons")}
        />
    );
};

export default AddonsAdd;