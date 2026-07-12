import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logCreate, logUpdate } from '@/lib/auditLog';

export async function GET() {
    try {
        const accounts = await prisma.bankAccount.findMany({
            where: { deletedAt: null },
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

        // Log account creation
        await logCreate(request, 'BankAccount', account, 'bankName');

        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error('Error creating bank account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, bankName, accountName, accountNumber, branch, type, balance, color, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }

        const oldAccount = await prisma.bankAccount.findUnique({ where: { id } });

        const account = await prisma.bankAccount.update({
            where: { id },
            data: {
                bankName,
                accountName,
                accountNumber,
                branch,
                type,
                balance: balance !== undefined ? parseFloat(balance) : undefined,
                color,
                status,
            },
        });

        // Log account update
        if (oldAccount) {
            await logUpdate(request, 'BankAccount', oldAccount, account, 'bankName');
        }

        return NextResponse.json(account);
    } catch (error) {
        console.error('Error updating bank account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
