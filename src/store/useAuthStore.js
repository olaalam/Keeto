import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuth: false,

            // دالة حفظ بيانات الدخول
            setLogin: (userData, token) => set({
                user: userData,
                token: token,
                isAuth: true
            }),

            // دالة تسجيل الخروج
            setLogout: () => set({
                user: null,
                token: null,
                isAuth: false
            }),
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;