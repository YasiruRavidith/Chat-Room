import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URLS } from './urls';

const api = axios.create({
    baseURL: API_URLS.BASE,
});

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                const { data } = await axios.post(API_URLS.REFRESH_TOKEN, { refresh: refreshToken });
                useAuthStore.getState().setTokens(data.access, refreshToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
                originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;