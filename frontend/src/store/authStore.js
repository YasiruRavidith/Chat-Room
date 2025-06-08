import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api';
import { API_URLS } from '../api/urls';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,

            setTokens: (access, refresh) => {
                set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
            },

            login: async (username, password) => {
                const response = await api.post(API_URLS.LOGIN, { username, password });
                const { access, refresh } = response.data;
                set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
                await get().fetchUser();
            },

            fetchUser: async () => {
                try {
                    const response = await api.get(API_URLS.USER_INFO);
                    set({ user: response.data });
                } catch (error) {
                    console.error("Failed to fetch user", error);
                    get().logout();
                }
            },

            logout: async () => {
                const refreshToken = get().refreshToken;
                if (refreshToken) {
                    try {
                        await api.post(API_URLS.LOGOUT, { refresh: refreshToken });
                    } catch (error) {
                        console.error("Logout failed", error);
                    }
                }
                set({
                    accessToken: null,
                    refreshToken: null,
                    user: null,
                    isAuthenticated: false,
                });
            },

            updateUser: (updatedUserData) => {
                 set((state) => ({
                    user: { ...state.user, ...updatedUserData }
                }));
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);