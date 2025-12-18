import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');

        const where = {};
        if (categoryId) where.categoryId = categoryId;

        const incomes = await prisma.income.findMany({
            where,
            include: { category: true },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(incomes);
    } catch (error) {
        console.error('Error fetching other incomes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { amount, description, date, categoryId } = body;

        if (!amount || !categoryId) {
            return NextResponse.json({ error: 'Amount and Category are required' }, { status: 400 });
        }

        const income = await prisma.income.create({
            data: {
                amount: parseFloat(amount),
                description,
                date: new Date(date),
                categoryId
            },
            include: { category: true }
        });

        // Create Ledger Entry
        await prisma.ledger.create({
            data: {
                date: new Date(date),
                description: description || `Income: ${income.category.name}`,
                amount: parseFloat(amount),
                type: 'Credit',
                category: income.category.name,
                referenceId: income.id,
                referenceType: 'Income'
            }
        });

        return NextResponse.json(income);
    } catch (error) {
        console.error('Error creating other income:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, amount, description, date, categoryId } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const income = await prisma.income.update({
            where: { id },
            data: {
                amount: parseFloat(amount),
                description,
                date: new Date(date),
                categoryId
            },
            include: { category: true }
        });

        // Update Ledger Entry (Simplified: find by reference and update)
        // Note: In a real system, we might need more robust ledger reconciliation.
        // For now, we assume one ledger entry per income.
        await prisma.ledger.updateMany({
            where: { referenceId: id, referenceType: 'Income' },
            data: {
                date: new Date(date),
                description: description || `Income: ${income.category.name}`,
                amount: parseFloat(amount),
                category: income.category.name
            }
        });

        return NextResponse.json(income);
    } catch (error) {
        console.error('Error updating other income:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Delete Ledger Entry first
        await prisma.ledger.deleteMany({
            where: { referenceId: id, referenceType: 'Income' }
        });

        await prisma.income.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting other income:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
