import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const bankAccountId = searchParams.get('bankAccountId');

        const where = {};
        if (bankAccountId) {
            where.bankAccountId = bankAccountId;
        }

        const transactions = await prisma.ledger.findMany({
            where,
            include: { bankAccount: true },
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching ledger:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
