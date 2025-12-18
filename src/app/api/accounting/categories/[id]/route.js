import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, color, budget_limit, status } = body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                description,
                color,
                budgetLimit: parseFloat(budget_limit) || 0,
                status,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        await prisma.category.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
