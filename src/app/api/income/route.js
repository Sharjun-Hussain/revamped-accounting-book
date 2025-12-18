import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const income = await prisma.income.findMany({
            include: { category: true },
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(income);
    } catch (error) {
        console.error('Error fetching income:', error);
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

        const income = await prisma.income.create({
            data: {
                amount: parseFloat(amount),
                description,
                date: date ? new Date(date) : new Date(),
                categoryId,
            },
            include: { category: true },
        });

        return NextResponse.json(income, { status: 201 });
    } catch (error) {
        console.error('Error creating income:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
