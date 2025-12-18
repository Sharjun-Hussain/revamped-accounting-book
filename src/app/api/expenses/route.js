import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            include: { category: true },
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
        const { amount, description, date, categoryId } = body;

        if (!amount || !categoryId) {
            return NextResponse.json({ error: 'Amount and categoryId are required' }, { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                amount: parseFloat(amount),
                description,
                date: date ? new Date(date) : new Date(),
                categoryId,
            },
            include: { category: true },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
