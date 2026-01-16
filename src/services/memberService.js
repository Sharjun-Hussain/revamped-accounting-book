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
    getMemberStatement: async (memberId) => {
        const response = await api.get(`/members/${memberId}/statement`);
        return response.data;
    },
    getMemberTransactions: async (memberId, params) => {
        const response = await api.get(`/members/${memberId}/statement`, { params });
        return response.data;
    },
};
