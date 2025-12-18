import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const accounts = await prisma.bankAccount.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { bankName, accountName, accountNumber, branch, type, balance, color } = body;

        if (!bankName || !accountNumber) {
            return NextResponse.json({ error: 'Bank name and account number are required' }, { status: 400 });
        }

        const account = await prisma.bankAccount.create({
            data: {
                bankName,
                accountName,
                accountNumber,
                branch,
                type: type || 'Savings',
                balance: parseFloat(balance) || 0,
                color,
                status: 'Active',
            },
        });

        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error('Error creating bank account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
