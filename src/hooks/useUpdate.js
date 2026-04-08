import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';

export const useUpdate = (url, onSuccessKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, payload }) => {
            const targetUrl = id ? `${url}/${id}` : url;
            const { data } = await api.put(targetUrl, payload);
            return data;
        },
        onSuccess: () => {
            if (onSuccessKey) {
                queryClient.invalidateQueries({ queryKey: [onSuccessKey] });
            }
            toast.success("success");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'error');
        },
    });
};