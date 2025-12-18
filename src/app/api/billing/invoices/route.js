import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const status = searchParams.get('status');

    try {
        const where = {};
        if (period) where.period = period;
        if (status && status !== 'all') where.status = status;

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                member: {
                    select: {
                        name: true,
                        id: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedInvoices = invoices.map(inv => ({
            id: inv.invoiceNo, // Use invoiceNo as the display ID
            internalId: inv.id,
            member_id: inv.member.id,
            name: inv.member.name,
            amount: inv.amount,
            paidAmount: inv.paidAmount,
            balance: inv.amount - inv.paidAmount, // Outstanding balance for this invoice
            status: inv.status,
            due_date: inv.dueDate,
        }));

        return NextResponse.json(formattedInvoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
