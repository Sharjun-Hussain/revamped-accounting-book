import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
        return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                memberId: memberId,
                status: {
                    in: ['pending', 'partial', 'overdue']
                }
            },
            orderBy: { dueDate: 'asc' },
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Error fetching pending invoices:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
