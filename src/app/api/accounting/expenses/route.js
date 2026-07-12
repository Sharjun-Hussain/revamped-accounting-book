import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logCreate, logUpdate, logDelete } from '@/lib/auditLog';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');

    try {
        const where = { deletedAt: null };

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
        const isSponsored = formData.get('isSponsored') === 'true';
        const donorName = formData.get('donorName');

        console.log("Parsed fields:", { amount, date, categoryId, payee, hasFile: !!file, isSponsored, donorName });

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

            // 2. If sponsored, create Donor and Donation
            if (isSponsored && donorName) {
                console.log(`Processing sponsored bill by: ${donorName}`);
                // Find or create donor
                let donor = await tx.donor.findFirst({
                    where: { name: { equals: donorName, mode: 'insensitive' } }
                });
                
                if (!donor) {
                    console.log(`Donor ${donorName} not found, creating new...`);
                    donor = await tx.donor.create({
                        data: { name: donorName }
                    });
                }

                // Create donation record
                await tx.donation.create({
                    data: {
                        amount: parseFloat(amount),
                        date: new Date(date),
                        purpose: `Sponsored Expense: ${description}`,
                        paymentMethod: 'Direct Payment',
                        donorType: 'Donor',
                        donorName: donor.name,
                        donorId: donor.id,
                        remarks: `Auto-generated for sponsored bill (Expense ID: ${expense.id})`
                    }
                });
                console.log("Donation record created for sponsored bill.");
            }

            // 3. If paid from an account, handle ledger and balance
            if (bankAccountId && !isSponsored) { // Don't deduct from bank if sponsored
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

        const oldExpense = await prisma.expense.findUnique({ where: { id } });
        
        const expense = await prisma.expense.update({
            where: { id },
            data: dataToUpdate,
        });

        // Log expense update
        if (oldExpense) {
            await logUpdate(request, 'Expense', oldExpense, expense, 'description');
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
export async function DELETE(request) {
    console.log("--- DELETE /api/accounting/expenses ---");
    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
        }

        console.log(`Attempting to delete ${ids.length} expenses:`, ids);

        const result = await prisma.$transaction(async (tx) => {
            let deletedCount = 0;

            for (const id of ids) {
                // 1. Get the expense to check for bank transactions
                const expense = await tx.expense.findUnique({
                    where: { id },
                });

                if (!expense) {
                    console.warn(`Expense ${id} not found, skipping.`);
                    continue;
                }

                // 2. If it has a ledger entry (paid from bank), reverse it
                // We find the ledger entry linked to this expense
                const ledgerEntry = await tx.ledger.findFirst({
                    where: {
                        referenceId: id,
                        referenceType: 'Expense',
                    },
                });

                if (ledgerEntry) {
                    console.log(`Reversing ledger entry for expense ${id}...`);
                    // Credit the amount back to the bank account
                    await tx.bankAccount.update({
                        where: { id: ledgerEntry.bankAccountId },
                        data: {
                            balance: {
                                increment: ledgerEntry.amount,
                            },
                        },
                    });

                    // Delete the ledger entry
                    await tx.ledger.delete({
                        where: { id: ledgerEntry.id },
                    });
                    console.log("Ledger entry reversed and deleted.");
                }

                // 3. Delete the expense record
                await tx.expense.delete({
                    where: { id },
                });

                // 4. Log the deletion
                await logDelete(request, 'Expense', expense, 'description');

                // 5. Delete the file from storage if it exists
                if (expense.receiptUrl) {
                    // Note: We are not awaiting this to avoid blocking the transaction if storage is slow
                    // Ideally, this should be a background job.
                    // storage.delete(expense.receiptUrl).catch(err => console.error("Failed to delete file:", err));
                }

                deletedCount++;
            }

            return { count: deletedCount };
        });

        // Log bulk delete
        // await logCreate(request, 'Expense', { ids }, 'ids', 'BULK_DELETE');

        console.log(`Successfully deleted ${result.count} expenses.`);
        return NextResponse.json({ message: `Deleted ${result.count} expenses`, count: result.count });

    } catch (error) {
        console.error('Error deleting expenses:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
