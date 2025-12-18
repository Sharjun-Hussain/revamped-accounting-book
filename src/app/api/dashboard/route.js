import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from 'date-fns';

export async function GET() {
    try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // 1. Calculate Stats

        // A. Total Income (All Time)
        // We can also do "This Month" if preferred, but "Total" usually implies all time or YTD. 
        // Let's do All Time for the "Total" card, and calculate change vs last month? 
        // Or maybe just "This Month's Income" is more useful for day-to-day?
        // The mock said "Total Donations". Let's provide "Total Income" (All Time).

        const totalDonations = await prisma.donation.aggregate({ _sum: { amount: true } });
        const totalPayments = await prisma.payment.aggregate({ _sum: { amount: true } });
        const totalOther = await prisma.income.aggregate({ _sum: { amount: true } });

        const totalIncomeValue = (totalDonations._sum.amount || 0) + (totalPayments._sum.amount || 0) + (totalOther._sum.amount || 0);

        // Calculate Last Month Income for comparison (Trend)
        const lastMonthDonations = await prisma.donation.aggregate({
            _sum: { amount: true },
            where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
        });
        const lastMonthPayments = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: { date: { gte: lastMonthStart, lte: lastMonthEnd } }
        });
        const lastMonthOther = await prisma.income.aggregate({
            _sum: { amount: true },
            where: { date: { gte: lastMonthStart, lte: lastMonthEnd } }
        });
        const lastMonthIncome = (lastMonthDonations._sum.amount || 0) + (lastMonthPayments._sum.amount || 0) + (lastMonthOther._sum.amount || 0);

        // This Month Income
        const thisMonthDonations = await prisma.donation.aggregate({
            _sum: { amount: true },
            where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } }
        });
        const thisMonthPayments = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: { date: { gte: currentMonthStart, lte: currentMonthEnd } }
        });
        const thisMonthOther = await prisma.income.aggregate({
            _sum: { amount: true },
            where: { date: { gte: currentMonthStart, lte: currentMonthEnd } }
        });
        const thisMonthIncome = (thisMonthDonations._sum.amount || 0) + (thisMonthPayments._sum.amount || 0) + (thisMonthOther._sum.amount || 0);

        // Income Trend
        const incomeChange = lastMonthIncome === 0 ? 100 : ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;


        // B. Monthly Expenses (This Month)
        const thisMonthExpenses = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: { date: { gte: currentMonthStart, lte: currentMonthEnd } }
        });
        const monthlyExpenseValue = thisMonthExpenses._sum.amount || 0;

        // Last Month Expenses for comparison
        const lastMonthExpenses = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: { date: { gte: lastMonthStart, lte: lastMonthEnd } }
        });
        const lastMonthExpenseValue = lastMonthExpenses._sum.amount || 0;

        const expenseChange = lastMonthExpenseValue === 0 ? 100 : ((monthlyExpenseValue - lastMonthExpenseValue) / lastMonthExpenseValue) * 100;


        // C. Active Members
        const activeMembersCount = await prisma.member.count({
            where: { status: 'active' }
        });
        // We don't track member history easily for trend, so we'll leave trend as 0 or just show count.


        // D. Pending Actions (Pending Invoices)
        const pendingInvoicesCount = await prisma.invoice.count({
            where: { status: { in: ['pending', 'partial', 'overdue'] } }
        });


        // 2. Recent Activity (Last 10 mixed)
        const recentDonations = await prisma.donation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { member: true }
        });
        const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { invoice: { include: { member: true } } }
        });
        const recentExpenses = await prisma.expense.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { category: true }
        });
        const recentOther = await prisma.income.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { category: true }
        });

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
        ].sort((a, b) => b.rawDate - a.rawDate).slice(0, 10);


        // 3. Chart Data (Last 6 Months)
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthLabel = format(date, 'MMM');

            const mDonations = await prisma.donation.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: monthStart, lte: monthEnd } } });
            const mPayments = await prisma.payment.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd } } });
            const mOther = await prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd } } });
            const mExpenses = await prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd } } });

            chartData.push({
                name: monthLabel,
                Income: (mDonations._sum.amount || 0) + (mPayments._sum.amount || 0) + (mOther._sum.amount || 0),
                Expense: (mExpenses._sum.amount || 0)
            });
        }


        return NextResponse.json({
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
                    trend: expenseChange <= 0 ? "up" : "down", // For expenses, down is usually "good" (green) but here we just track direction. Let's keep logic simple: up is increase.
                    // Actually, if expense goes down, it's good. But let's just show direction.
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
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
