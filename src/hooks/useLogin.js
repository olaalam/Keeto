import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'sonner';

export const useLogin = () => {
    const setLogin = useAuthStore((state) => state.setLogin);

    return useMutation({
        mutationFn: async (credentials) => {
            const { data } = await api.post('/api/superadmin/auth/login', credentials);
            // لاحظ هنا أن axios بترجع data، والـ API بتاعك جواه برضه data
            return data;
        },
        onSuccess: (res) => {
            // التعديل هنا: الرد جاي فيه object اسمه data وجواه admin و token
            const userData = res.data.admin;
            const token = res.data.token;

            setLogin(userData, token);
            toast.success(`Welcome ${userData.name}`);
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Error occurred');
        },
    });
};