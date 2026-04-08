import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { toast } from 'sonner';

export const usePost = (url, method = 'post', onSuccessKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api[method](url, payload);
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