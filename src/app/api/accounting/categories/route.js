import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                expenses: {
                    where: {
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    },
                    select: {
                        amount: true
                    }
                }
            }
        });

        const categoriesWithSpend = categories.map(cat => {
            const current_spend = cat.expenses.reduce((sum, expense) => sum + expense.amount, 0);
            // Remove expenses array to keep response clean
            const { expenses, ...rest } = cat;
            return { ...rest, current_spend };
        });

        return NextResponse.json(categoriesWithSpend);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, description, color, budget_limit, status } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
                color: color || 'emerald',
                budgetLimit: parseFloat(budget_limit) || 0,
                status: status || 'Active',
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
