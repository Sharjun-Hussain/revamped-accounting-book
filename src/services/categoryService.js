import api from '@/lib/api';

export const categoryService = {
    getAll: async () => {
        const response = await api.get('/accounting/categories');
        return response.data;
    },
    create: async (categoryData) => {
        const response = await api.post('/accounting/categories', categoryData);
        return response.data;
    },
    update: async (id, categoryData) => {
        const response = await api.put(`/accounting/categories/${id}`, categoryData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/accounting/categories/${id}`);
        return response.data;
    },
};
