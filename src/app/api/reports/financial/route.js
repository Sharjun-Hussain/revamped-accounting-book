import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const dateFilter = {};
        if (from) {
            dateFilter.createdAt = {
                gte: new Date(from),
                lte: to ? new Date(to) : new Date()
            };
        }

        // 1. Fetch Data
        // Income (Donations)
        const donations = await prisma.donation.findMany({
            where: dateFilter,
        });

        // Income (Sanda Payments)
        const payments = await prisma.payment.findMany({
            where: {
                date: dateFilter.createdAt
            },
            include: { invoice: true }
        });

        // Income (Other)
        const otherIncomes = await prisma.income.findMany({
            where: {
                date: dateFilter.createdAt
            },
            include: { category: true }
        });

        // Expenses
        const expenses = await prisma.expense.findMany({
            where: {
                date: dateFilter.createdAt
            },
            include: { category: true }
        });

        // Bank Accounts (for Assets)
        const bankAccounts = await prisma.bankAccount.findMany();

        // Pending Invoices (for Liabilities)
        const pendingInvoices = await prisma.invoice.findMany({
            where: {
                status: { in: ['pending', 'partial', 'overdue'] }
            }
        });

        // 2. Calculate Financial Summary
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        const totalSanda = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalOther = otherIncomes.reduce((sum, i) => sum + i.amount, 0);
        const totalIncome = totalDonations + totalSanda + totalOther;

        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netSurplus = totalIncome - totalExpense;

        const cashOnHand = bankAccounts
            .filter(b => b.type.toLowerCase().includes('cash'))
            .reduce((sum, b) => sum + b.balance, 0);

        const bankBalance = bankAccounts
            .filter(b => !b.type.toLowerCase().includes('cash'))
            .reduce((sum, b) => sum + b.balance, 0);

        const pendingBillsAmount = pendingInvoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

        // 3. Income Statement Data
        const incomeCategories = [
            { category: "Sanda Collections", amount: totalSanda },
            { category: "General Donations", amount: totalDonations },
        ];

        // Group other income by category
        const otherIncomeMap = {};
        otherIncomes.forEach(i => {
            const catName = i.category?.name || 'Other';
            otherIncomeMap[catName] = (otherIncomeMap[catName] || 0) + i.amount;
        });
        Object.entries(otherIncomeMap).forEach(([category, amount]) => {
            incomeCategories.push({ category, amount });
        });

        // Group expenses by category
        const expenseCategoryMap = {};
        expenses.forEach(e => {
            const catName = e.category?.name || 'Uncategorized';
            expenseCategoryMap[catName] = (expenseCategoryMap[catName] || 0) + e.amount;
        });
        const expenseCategories = Object.entries(expenseCategoryMap).map(([category, amount]) => ({
            category,
            amount
        }));

        // 4. Balance Sheet Data
        const assets = [
            { name: "Cash on Hand", value: cashOnHand },
            { name: "Bank Accounts", value: bankBalance },
            { name: "Fixed Assets (Est.)", value: 5000000 },
        ];

        const liabilities = [
            { name: "Accounts Payable (Pending Bills)", value: pendingBillsAmount },
        ];

        const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
        const equity = [
            { name: "General Fund Balance", value: totalAssets - totalLiabilities }
        ];

        // 5. Monthly Performance (Last 6 Months)
        const monthlyPerformance = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthLabel = format(date, 'MMM');

            const monthDonations = await prisma.donation.aggregate({
                _sum: { amount: true },
                where: { createdAt: { gte: monthStart, lte: monthEnd } }
            });

            const monthPayments = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: { date: { gte: monthStart, lte: monthEnd } }
            });

            const monthOther = await prisma.income.aggregate({
                _sum: { amount: true },
                where: { date: { gte: monthStart, lte: monthEnd } }
            });

            const monthExpenses = await prisma.expense.aggregate({
                _sum: { amount: true },
                where: { date: { gte: monthStart, lte: monthEnd } }
            });

            monthlyPerformance.push({
                name: monthLabel,
                Income: (monthDonations._sum.amount || 0) + (monthPayments._sum.amount || 0) + (monthOther._sum.amount || 0),
                Expense: (monthExpenses._sum.amount || 0)
            });
        }

        return NextResponse.json({
            summary: {
                totalIncome,
                totalExpense,
                netSurplus,
                cashOnHand,
                bankBalance,
                pendingBills: pendingBillsAmount
            },
            incomeStatement: {
                income: incomeCategories,
                expenses: expenseCategories
            },
            balanceSheet: {
                assets,
                liabilities,
                equity
            },
            monthlyPerformance
        });

    } catch (error) {
        console.error('Error fetching financial report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
