import api from './api';

export const getSession = async () => {
    try {
        const response = await api.get('/auth/me');
        return { user: response.data.user };
    } catch (error) {
        if (error.response?.status === 403) {
            return { user: { isDeactivated: true } };
        }
        return null;
    }
};
