import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');

    try {
        const whereClause = period ? { period, type: 'Sanda' } : { type: 'Sanda' };

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                member: {
                    select: { name: true, contact: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        const summary = {
            totalExpected: invoices.reduce((sum, inv) => sum + inv.amount, 0),
            totalCollected: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
            pendingCount: invoices.filter(inv => inv.status === 'pending').length,
            paidCount: invoices.filter(inv => inv.status === 'paid').length,
        };

        return NextResponse.json({ summary, invoices });
    } catch (error) {
        console.error('Error fetching sanda report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
