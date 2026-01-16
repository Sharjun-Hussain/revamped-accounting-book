import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, context) {
    try {
        // Await params for Next.js 15 compatibility
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
        }

        // Fetch member details
        const member = await prisma.member.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                contact: true,
                address: true,
                email: true,
                status: true,
                amountPerCycle: true,
                startDate: true,
            },
        });

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Fetch all invoices for the member
        const invoices = await prisma.invoice.findMany({
            where: {
                memberId: id,
                deletedAt: null
            },
            include: {
                payments: {
                    where: { deletedAt: null },
                    orderBy: { date: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Fetch all payments for the member
        const allPayments = await prisma.payment.findMany({
            where: {
                invoice: { memberId: id },
                deletedAt: null,
            },
            include: {
                invoice: {
                    select: {
                        invoiceNo: true,
                        period: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        // Calculate financial summary
        let totalBilled = 0;
        let totalPaid = 0;
        let lastPaymentDate = null;

        invoices.forEach(invoice => {
            totalBilled += invoice.amount;
            const invoicePaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
            totalPaid += invoicePaid;
        });

        if (allPayments.length > 0) {
            lastPaymentDate = allPayments[0].date;
        }

        const balance = totalBilled - totalPaid;

        // Build transaction history (chronological order)
        const transactions = [];

        // Add all invoices and their payments
        invoices.forEach(invoice => {
            // Add invoice as debit transaction
            transactions.push({
                date: invoice.createdAt,
                type: 'Bill',
                ref: invoice.invoiceNo,
                desc: invoice.period ? `Monthly Sanda (${invoice.period})` : 'Monthly Sanda',
                debit: invoice.amount,
                credit: 0,
                sortDate: invoice.createdAt,
            });

            // Add payments as credit transactions
            invoice.payments.forEach(payment => {
                transactions.push({
                    date: payment.date,
                    type: 'Payment',
                    ref: payment.id.substring(0, 10).toUpperCase(),
                    desc: `Payment: ${invoice.period || 'Sanda'}`,
                    debit: 0,
                    credit: payment.amount,
                    sortDate: payment.date,
                });
            });
        });

        // Sort transactions by date
        transactions.sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));

        // Format dates for display
        const formattedTransactions = transactions.map(tx => ({
            date: new Date(tx.date).toISOString().split('T')[0],
            type: tx.type,
            ref: tx.ref,
            desc: tx.desc,
            debit: tx.debit,
            credit: tx.credit,
        }));

        // Calculate outstanding arrears by invoice
        const outstanding = [];
        invoices.forEach(invoice => {
            const invoicePaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const invoiceBalance = invoice.amount - invoicePaid;

            if (invoiceBalance > 0) {
                outstanding.push({
                    month: invoice.period || new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    amount: invoiceBalance,
                    invoiceNo: invoice.invoiceNo,
                });
            }
        });

        // Prepare response
        const statementData = {
            member: {
                id: member.id,
                name: member.name,
                phone: member.contact,
                address: member.address || 'N/A',
                email: member.email || 'N/A',
                status: member.status,
                joined: member.startDate,
            },
            financial: {
                balance: balance,
                monthlyRate: member.amountPerCycle,
                totalPaid: totalPaid,
                totalBilled: totalBilled,
                lastPayment: lastPaymentDate ? new Date(lastPaymentDate).toISOString().split('T')[0] : 'N/A',
                transactions: formattedTransactions,
                outstanding: outstanding,
            },
        };

        return NextResponse.json(statementData);
    } catch (error) {
        console.error('Error fetching member statement:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
