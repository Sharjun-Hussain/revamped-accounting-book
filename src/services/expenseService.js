import api from '@/lib/api';

export const expenseService = {
    getAll: async () => {
        const response = await api.get('/expenses');
        return response.data;
    },
    create: async (expenseData) => {
        const response = await api.post('/expenses', expenseData);
        return response.data;
    },
};
