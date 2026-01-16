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
    updateBankAccount: async (accountData) => {
        const response = await api.put('/accounting/bank-accounts', accountData);
        return response.data;
    },
    getBankTransactions: async (bankAccountId) => {
        const response = await api.get(`/accounting/ledger?bankAccountId=${bankAccountId}`);
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
        // If expenseData is FormData, we need to ensure the Content-Type is correct.
        // Setting it to 'multipart/form-data' usually lets the browser/axios handle the boundary.
        // However, to be safe against the default application/json, we explicitly set it.
        const config = {};
        if (expenseData instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' };
        }

        const response = await api.post('/accounting/expenses', expenseData, config);
        return response.data;
    },
    updateExpense: async (expenseData) => {
        const config = {};
        if (expenseData instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' };
        }
        const response = await api.put('/accounting/expenses', expenseData, config);
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
    getMemberStatement: async (memberId) => {
        const response = await api.get(`/members/${memberId}/statement`);
        return response.data;
    },
};
