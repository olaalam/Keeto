import api from '@/api/axios';
import { useQuery } from '@tanstack/react-query';


export const useGet = (key, url, params = {}) => {
    return useQuery({
        queryKey: [key, params],
        queryFn: async () => {
            const { data } = await api.get(url, { params });
            return data;
        },
    });
};