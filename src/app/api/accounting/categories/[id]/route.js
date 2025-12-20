import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logUpdate, logDelete } from '@/lib/auditLog';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, color, budget_limit, status } = body;

        // Get old data for audit log
        const oldCategory = await prisma.category.findUnique({
            where: { id },
        });

        if (!oldCategory) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

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

        // Log category update
        await logUpdate(request, 'Category', oldCategory, category);

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Get category data before deletion for audit log
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        await prisma.category.delete({
            where: { id },
        });

        // Log category deletion
        await logDelete(request, 'Category', category);

        return NextResponse.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
