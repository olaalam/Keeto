import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const BusinessPlanAdd = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // جلب قائمة المطاعم لربط الخطة بمطعم معين
    const { data: restaurants = [], isLoading: isRestaurantsLoading } = useQuery({
        queryKey: ['restaurants-list'],
        queryFn: async () => {
            const res = await api.get('/api/superadmin/restaurants');
            return res.data?.data?.data || [];
        }
    });

    const { data: planData, isLoading: isFetching } = useQuery({
        queryKey: ['business-plan', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/superadmin/businessplans/${id}`);
            return data.data.data;
        },
        enabled: !!id,
    });

    const initialData = React.useMemo(() => {
        if (!planData) return null;
        return {
            ...planData,
            restaurantId: planData.restaurantId || planData.restaurant?.id
        };
    }, [planData]);

    const businessPlanFields = [
        {
            name: 'restaurantId',
            label: 'Restaurant',
            required: true,
            type: 'select',
            options: restaurants.map(r => ({
                value: String(r.id),
                label: r.name
            }))
        },
        {
            name: 'platformType',
            label: 'Platform Type',
            required: true,
            type: 'select',
            options: [
                { value: 'food_aggregator', label: 'Food Aggregator' },
                { value: 'online_order', label: 'Online Order' }
            ]
        },
        { name: 'commissionRate', label: 'Commission Rate (%)', type: 'number', required: true },
        { name: 'serviceFee', label: 'Service Fee', type: 'number', required: true },
        { name: 'isMonthlyActive', label: 'Monthly Active', type: 'switch' },
        { name: 'monthlyAmount', label: 'Monthly Amount', type: 'number' },
        { name: 'isQuarterlyActive', label: 'Quarterly Active', type: 'switch' },
        { name: 'isAnnuallyActive', label: 'Annually Active', type: 'switch' },
    ];

    if ((id && isFetching) || isRestaurantsLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title="Business Plan"
            apiUrl="/api/superadmin/businessplans"
            queryKey="business-plans"
            fields={businessPlanFields}
            initialData={initialData}
            onSuccessAction={() => navigate('/business-plans')}
        />
    );
};

export default BusinessPlanAdd;