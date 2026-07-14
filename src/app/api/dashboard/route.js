import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

// Define the cached data fetching function
const getDashboardData = unstable_cache(
    async () => {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // ==========================================
        // 1. DASHBOARD STATS (Run all in parallel)
        // ==========================================
        const [
            // All Time Income
            totalDonations,
            totalPayments,
            totalOther,
            // Last Month Income
            lastMonthDonations,
            lastMonthPayments,
            lastMonthOther,
            // This Month Income
            thisMonthDonations,
            thisMonthPayments,
            thisMonthOther,
            // Expenses
            thisMonthExpensesRaw,
            lastMonthExpensesRaw,
            // Counts
            activeMembersCount,
            pendingInvoicesCount
        ] = await Promise.all([
            // All Time
            prisma.donation.aggregate({ _sum: { amount: true }, where: { deletedAt: null } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { deletedAt: null } }),
            prisma.income.aggregate({ _sum: { amount: true }, where: { deletedAt: null } }),
            // Last Month
            prisma.donation.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, deletedAt: null } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { date: { gte: lastMonthStart, lte: lastMonthEnd }, deletedAt: null } }),
            prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: lastMonthStart, lte: lastMonthEnd }, deletedAt: null } }),
            // This Month
            prisma.donation.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd }, deletedAt: null } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { date: { gte: currentMonthStart, lte: currentMonthEnd }, deletedAt: null } }),
            prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: currentMonthStart, lte: currentMonthEnd }, deletedAt: null } }),
            // Expenses
            prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: currentMonthStart, lte: currentMonthEnd }, deletedAt: null } }),
            prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: lastMonthStart, lte: lastMonthEnd }, deletedAt: null } }),
            // Counts
            prisma.member.count({ where: { status: 'active', deletedAt: null } }),
            prisma.invoice.count({ where: { status: { in: ['pending', 'partial', 'overdue'] }, deletedAt: null } })
        ]);

        // --- Calculate Stats Values ---
        const totalIncomeValue = (totalDonations._sum.amount || 0) + (totalPayments._sum.amount || 0) + (totalOther._sum.amount || 0);

        const lastMonthIncome = (lastMonthDonations._sum.amount || 0) + (lastMonthPayments._sum.amount || 0) + (lastMonthOther._sum.amount || 0);
        const thisMonthIncome = (thisMonthDonations._sum.amount || 0) + (thisMonthPayments._sum.amount || 0) + (thisMonthOther._sum.amount || 0);
        const incomeChange = lastMonthIncome === 0 ? (thisMonthIncome === 0 ? 0 : 100) : ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;

        const monthlyExpenseValue = thisMonthExpensesRaw._sum.amount || 0;
        const lastMonthExpenseValue = lastMonthExpensesRaw._sum.amount || 0;
        const expenseChange = lastMonthExpenseValue === 0 ? (monthlyExpenseValue === 0 ? 0 : 100) : ((monthlyExpenseValue - lastMonthExpenseValue) / lastMonthExpenseValue) * 100;


        // ==========================================
        // 2. RECENT ACTIVITY (Run in parallel)
        // ==========================================
        const [recentDonations, recentPayments, recentExpenses, recentOther] = await Promise.all([
            prisma.donation.findMany({ take: 5, orderBy: { createdAt: 'desc' }, where: { deletedAt: null }, include: { member: true } }),
            prisma.payment.findMany({ take: 5, orderBy: { date: 'desc' }, where: { deletedAt: null }, include: { invoice: { include: { member: true } } } }),
            prisma.expense.findMany({ take: 5, orderBy: { date: 'desc' }, where: { deletedAt: null }, include: { category: true } }),
            prisma.income.findMany({ take: 5, orderBy: { date: 'desc' }, where: { deletedAt: null }, include: { category: true } })
        ]);

        // Merge and sort activities
        const activities = [
            ...recentDonations.map(d => ({
                id: `don-${d.id}`,
                type: 'Donation',
                title: d.member ? `Donation from ${d.member.name}` : (d.donorName ? `Donation from ${d.donorName}` : 'Anonymous Donation'),
                amount: `+ Rs. ${d.amount.toLocaleString()}`,
                date: d.createdAt,
                status: 'Completed',
                rawDate: new Date(d.createdAt)
            })),
            ...recentPayments.map(p => ({
                id: `pay-${p.id}`,
                type: 'Sanda',
                title: `Sanda Payment - ${p.invoice?.member?.name || 'Unknown'}`,
                amount: `+ Rs. ${p.amount.toLocaleString()}`,
                date: p.date,
                status: 'Completed',
                rawDate: new Date(p.date)
            })),
            ...recentOther.map(i => ({
                id: `inc-${i.id}`,
                type: 'Other Income',
                title: i.description || i.category?.name || 'Other Income',
                amount: `+ Rs. ${i.amount.toLocaleString()}`,
                date: i.date,
                status: 'Completed',
                rawDate: new Date(i.date)
            })),
            ...recentExpenses.map(e => ({
                id: `exp-${e.id}`,
                type: 'Expense',
                title: e.description || e.category?.name || 'Expense',
                amount: `- Rs. ${e.amount.toLocaleString()}`,
                date: e.date,
                status: 'Processed',
                rawDate: new Date(e.date)
            }))
        ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 10);


        // ==========================================
        // 3. CHART DATA (Parallelize the loop)
        // ==========================================
        // We generate an array of 6 months, then map over them with Promise.all
        const last6Months = Array.from({ length: 6 }, (_, i) => i);

        const chartData = await Promise.all(last6Months.reverse().map(async (i) => {
            const date = subMonths(now, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthLabel = format(date, 'MMM');

            // Run these 4 queries in parallel for this specific month
            const [mDonations, mPayments, mOther, mExpenses] = await Promise.all([
                prisma.donation.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: monthStart, lte: monthEnd }, deletedAt: null } }),
                prisma.payment.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd }, deletedAt: null } }),
                prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd }, deletedAt: null } }),
                prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd }, deletedAt: null } })
            ]);

            return {
                name: monthLabel,
                Income: (mDonations._sum.amount || 0) + (mPayments._sum.amount || 0) + (mOther._sum.amount || 0),
                Expense: (mExpenses._sum.amount || 0)
            };
        }));

        return {
            stats: [
                {
                    title: "Total Income",
                    value: `Rs. ${totalIncomeValue.toLocaleString()}`,
                    change: `${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(1)}%`,
                    trend: incomeChange >= 0 ? "up" : "down",
                    color: "text-emerald-600",
                    bg: "bg-emerald-100",
                    iconName: "Wallet"
                },
                {
                    title: "Monthly Expenses",
                    value: `Rs. ${monthlyExpenseValue.toLocaleString()}`,
                    change: `${expenseChange > 0 ? '+' : ''}${expenseChange.toFixed(1)}%`,
                    trend: expenseChange <= 0 ? "up" : "down",
                    color: "text-rose-600",
                    bg: "bg-rose-100",
                    iconName: "TrendingUp"
                },
                {
                    title: "Active Members",
                    value: activeMembersCount.toString(),
                    change: "Active",
                    trend: "neutral",
                    color: "text-blue-600",
                    bg: "bg-blue-100",
                    iconName: "Users"
                },
                {
                    title: "Pending Invoices",
                    value: pendingInvoicesCount.toString(),
                    change: "Requires Action",
                    trend: "neutral",
                    color: "text-amber-600",
                    bg: "bg-amber-100",
                    iconName: "FileText"
                },
            ],
            activities,
            chartData
        };
    },
    ['dashboard-stats'], // Cache key
    { revalidate: 60 }   // Revalidate every 60 seconds
);

export async function GET() {
    try {
        const data = await getDashboardData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}