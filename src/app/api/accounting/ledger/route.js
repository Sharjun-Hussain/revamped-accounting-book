import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const transactions = await prisma.ledger.findMany({
            include: { bankAccount: true },
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching ledger:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
