import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logCreate } from '@/lib/auditLog';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');

    try {
        const where = {};

        if (categoryId && categoryId !== 'all') {
            where.categoryId = categoryId;
        }

        if (search) {
            where.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                // Payee is not in schema yet, assuming it's part of description or we need to add it.
                // Checking schema... Expense has amount, description, date, categoryId.
                // The UI has "Payee". I should probably add Payee to schema or store in description.
                // For now, I'll search description.
            ];
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { amount, date, categoryId, description, payee, bankAccountId } = body;

        if (!amount || !categoryId) {
            return NextResponse.json({ error: 'Amount and Category are required' }, { status: 400 });
        }

        // Combine payee into description if payee field doesn't exist in schema
        const finalDescription = payee ? `${payee} - ${description}` : description;

        // Use a transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Expense
            const expense = await tx.expense.create({
                data: {
                    amount: parseFloat(amount),
                    date: new Date(date),
                    categoryId,
                    description: finalDescription,
                },
            });

            // 2. If paid from an account, handle ledger and balance
            if (bankAccountId) {
                // Create Ledger Entry
                await tx.ledger.create({
                    data: {
                        date: new Date(date),
                        description: `Expense: ${finalDescription}`,
                        amount: parseFloat(amount),
                        type: 'Debit', // Money leaving the account
                        category: 'Expense',
                        bankAccountId,
                        referenceId: expense.id,
                        referenceType: 'Expense',
                    },
                });

                // Update Bank Account Balance
                await tx.bankAccount.update({
                    where: { id: bankAccountId },
                    data: {
                        balance: {
                            decrement: parseFloat(amount),
                        },
                    },
                });
            }

            return expense;
        });

        // Log expense creation
        await logCreate(request, 'Expense', result, 'description');

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
