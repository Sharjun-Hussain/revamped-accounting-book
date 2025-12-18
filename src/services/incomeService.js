import api from '@/lib/api';

export const incomeService = {
    getAll: async () => {
        const response = await api.get('/income');
        return response.data;
    },
    create: async (incomeData) => {
        const response = await api.post('/income', incomeData);
        return response.data;
    },
};
