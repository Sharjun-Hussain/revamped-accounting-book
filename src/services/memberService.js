import api from '@/lib/api';

export const memberService = {
    getAll: async () => {
        const response = await api.get('/members');
        return response.data;
    },
    create: async (memberData) => {
        const response = await api.post('/members', memberData);
        return response.data;
    },
};
