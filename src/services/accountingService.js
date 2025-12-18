import api from '@/lib/api';

export const accountingService = {
    getBankAccounts: async () => {
        const response = await api.get('/accounting/bank-accounts');
        return response.data;
    },
    createBankAccount: async (accountData) => {
        const response = await api.post('/accounting/bank-accounts', accountData);
        return response.data;
    },
    getLedger: async () => {
        const response = await api.get('/accounting/ledger');
        return response.data;
    },
    getPendingInvoices: async (memberId) => {
        const response = await api.get(`/billing/pending?memberId=${memberId}`);
        return response.data;
    },
    collectPayment: async (paymentData) => {
        const response = await api.post('/sanda/pay', paymentData);
        return response.data;
    },
    getInvoices: async (params) => {
        const response = await api.get('/billing/invoices', { params });
        return response.data;
    },
    getInvoiceById: async (id) => {
        const response = await api.get(`/billing/invoices/${id}`);
        return response.data;
    },
    getIncomeSummary: async (params) => {
        const response = await api.get('/accounting/income', { params });
        return response.data;
    },
    getFinancialReport: async (params) => {
        const response = await api.get('/reports/financial', { params });
        return response.data;
    },
    generateSanda: async (period) => {
        const response = await api.post('/sanda/generate', { period });
        return response.data;
    },
    // Other Income
    getOtherIncomes: async (params) => {
        const response = await api.get('/accounting/other-income', { params });
        return response.data;
    },
    createOtherIncome: async (data) => {
        const response = await api.post('/accounting/other-income', data);
        return response.data;
    },
    updateOtherIncome: async (id, data) => {
        const response = await api.put('/accounting/other-income', { id, ...data });
        return response.data;
    },
    deleteOtherIncome: async (id) => {
        const response = await api.delete(`/accounting/other-income?id=${id}`);
        return response.data;
    },
    getPaymentHistory: async (params) => {
        const response = await api.get('/billing/history', { params });
        return response.data;
    },
    getOutstandingArrears: async () => {
        const response = await api.get('/billing/outstanding');
        return response.data;
    },
    getExpenses: async (params) => {
        const response = await api.get('/accounting/expenses', { params });
        return response.data;
    },
    createExpense: async (expenseData) => {
        const response = await api.post('/accounting/expenses', expenseData);
        return response.data;
    },
    getCategories: async () => {
        const response = await api.get('/accounting/categories');
        return response.data;
    },
    getDashboardStats: async () => {
        const response = await api.get('/dashboard');
        return response.data;
    },
};
