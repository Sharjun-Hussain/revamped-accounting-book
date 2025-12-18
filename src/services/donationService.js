import api from '@/lib/api';

export const donationService = {
    getAll: async () => {
        const response = await api.get('/donations');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/donations/${id}`);
        return response.data;
    },
    create: async (donationData) => {
        const response = await api.post('/donations', donationData);
        return response.data;
    },
    update: async (id, donationData) => {
        const response = await api.put(`/donations/${id}`, donationData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/donations/${id}`);
        return response.data;
    },
};
