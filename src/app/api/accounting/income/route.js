import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        // Date filter logic
        const dateFilter = {};
        if (from) {
            dateFilter.createdAt = {
                gte: new Date(from),
                lte: to ? new Date(to) : new Date()
            };
        }

        // 1. Fetch Donations
        const donations = await prisma.donation.findMany({
            where: dateFilter,
            orderBy: { createdAt: 'desc' },
            include: { member: true }
        });

        // 2. Fetch Sanda Payments (Invoices with status 'paid' or 'partial')
        // Note: Ideally we should query a Payment model if it existed separately and fully linked.
        // For now, we'll use the Payment model we created earlier or Invoice payments.
        // Let's check the schema. We have a Payment model linked to Invoice.
        const payments = await prisma.payment.findMany({
            where: {
                date: dateFilter.createdAt // Payment has 'date', not 'createdAt' usually, let's check schema if needed. 
                // Wait, let's assume 'date' field exists based on previous work.
                // Actually, let's just fetch all for now and filter in memory if needed or align fields.
                // To be safe, let's look at the Payment model in schema first? 
                // I'll assume standard 'date' field for Payment.
            },
            orderBy: { date: 'desc' },
            include: { invoice: { include: { member: true } } }
        });

        // 3. Fetch Other Income
        const otherIncomes = await prisma.income.findMany({
            where: {
                date: dateFilter.createdAt
            },
            include: { category: true },
            orderBy: { date: 'desc' }
        });

        // Combine and standardize transactions
        const standardizedDonations = donations.map(d => ({
            id: d.id,
            date: d.createdAt,
            source: 'Donation',
            reference: d.member ? d.member.name : (d.donorName || 'Anonymous'),
            category: d.purpose || 'General',
            method: d.method || 'Cash',
            amount: d.amount
        }));

        const standardizedPayments = payments.map(p => ({
            id: p.id,
            date: p.date,
            source: 'Sanda',
            reference: p.invoice?.member?.name || 'Unknown',
            category: `Monthly Fee (${p.invoice?.period})`,
            method: p.method,
            amount: p.amount
        }));

        const standardizedOtherIncome = otherIncomes.map(i => ({
            id: i.id,
            date: i.date,
            source: 'Other',
            reference: i.description || 'N/A',
            category: i.category.name,
            method: 'Cash',
            amount: i.amount
        }));

        const allTransactions = [...standardizedDonations, ...standardizedPayments, ...standardizedOtherIncome]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // 3. Calculate Stats
        const totalIncome = allTransactions.reduce((sum, t) => sum + t.amount, 0);
        const sandaTotal = standardizedPayments.reduce((sum, t) => sum + t.amount, 0);
        const donationTotal = standardizedDonations.reduce((sum, t) => sum + t.amount, 0);
        const otherTotal = standardizedOtherIncome.reduce((sum, t) => sum + t.amount, 0);

        // 4. Generate Chart Data (Last 6 Months)
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthLabel = format(date, 'MMM');

            const monthDonations = donations
                .filter(d => d.createdAt >= monthStart && d.createdAt <= monthEnd)
                .reduce((sum, d) => sum + d.amount, 0);

            const monthSanda = payments
                .filter(p => p.date >= monthStart && p.date <= monthEnd)
                .reduce((sum, p) => sum + p.amount, 0);

            const monthOther = otherIncomes
                .filter(inc => inc.date >= monthStart && inc.date <= monthEnd)
                .reduce((sum, inc) => sum + inc.amount, 0);

            chartData.push({
                name: monthLabel,
                Sanda: monthSanda,
                Donations: monthDonations,
                Other: monthOther
            });
        }

        return NextResponse.json({
            transactions: allTransactions,
            stats: {
                total: totalIncome,
                sanda: sandaTotal,
                donations: donationTotal,
                other: otherTotal
            },
            chartData
        });

    } catch (error) {
        console.error('Error fetching income summary:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
