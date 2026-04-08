import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'sonner';

export const useLogin = () => {
    const setLogin = useAuthStore((state) => state.setLogin);

    return useMutation({
        mutationFn: async (credentials) => {
            const { data } = await api.post('/login', credentials);
            return data;
        },
        onSuccess: (data) => {
            setLogin(data.user, data.token);
            toast.success(`welcome ${data.user.name}`);
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'error');
        },
    });
};