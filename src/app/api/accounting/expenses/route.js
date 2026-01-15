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

import { storage } from '@/lib/storage';

export async function POST(request) {
    console.log("--- POST /api/accounting/expenses ---");
    try {
        const formData = await request.formData();
        console.log("FormData received. Keys:", Array.from(formData.keys()));

        const amount = formData.get('amount');
        const date = formData.get('date');
        const categoryId = formData.get('categoryId');
        const description = formData.get('description');
        const payee = formData.get('payee');
        const bankAccountId = formData.get('bankAccountId');
        const file = formData.get('file');

        console.log("Parsed fields:", { amount, date, categoryId, payee, hasFile: !!file });

        if (!amount || !categoryId) {
            console.error("Missing required fields: amount or categoryId");
            return NextResponse.json({ error: 'Amount and Category are required' }, { status: 400 });
        }

        let receiptUrl = null;
        if (file && file.size > 0) {
            console.log("Attempting file upload...");
            try {
                receiptUrl = await storage.upload(file, 'expenses');
                console.log("File uploaded successfully. URL:", receiptUrl);
            } catch (uploadError) {
                console.error("File upload failed:", uploadError);
                // We might want to continue without the file, or fail. 
                // For now, let's fail to let the user know storage is broken.
                throw uploadError;
            }
        }

        // Use a transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Expense
            console.log("Creating expense record...");
            const expense = await tx.expense.create({
                data: {
                    amount: parseFloat(amount),
                    date: new Date(date),
                    categoryId,
                    description,
                    payee,
                    receiptUrl,
                },
            });
            console.log("Expense record created:", expense.id);

            // 2. If paid from an account, handle ledger and balance
            if (bankAccountId) {
                console.log("Processing bank transaction for account:", bankAccountId);
                const finalDescription = payee ? `${payee} - ${description}` : description;
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
                console.log("Bank transaction processed.");
            }

            return expense;
        });

        // Log expense creation
        await logCreate(request, 'Expense', result, 'description');

        console.log("Expense creation successful.");
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    console.log("--- PUT /api/accounting/expenses ---");
    try {
        const formData = await request.formData();
        const id = formData.get('id');
        const amount = formData.get('amount');
        const date = formData.get('date');
        const categoryId = formData.get('categoryId');
        const description = formData.get('description');
        const payee = formData.get('payee');
        const file = formData.get('file');

        if (!id || !amount || !categoryId) {
            return NextResponse.json({ error: 'ID, Amount and Category are required' }, { status: 400 });
        }

        const dataToUpdate = {
            amount: parseFloat(amount),
            date: new Date(date),
            categoryId,
            description,
            payee,
        };

        if (file && file.size > 0) {
            console.log("Attempting file upload for update...");
            const receiptUrl = await storage.upload(file, 'expenses');
            dataToUpdate.receiptUrl = receiptUrl;
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: dataToUpdate,
        });

        // Log expense update
        await logCreate(request, 'Expense', expense, 'description', 'UPDATE');

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
