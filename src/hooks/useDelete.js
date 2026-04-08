import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';

export const useDelete = (url, onSuccessKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { data } = await api.delete(`${url}/${id}`);
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