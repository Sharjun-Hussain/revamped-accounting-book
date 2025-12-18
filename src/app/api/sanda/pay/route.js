import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const body = await request.json();
        const { invoiceId, amount, method, bankAccountId } = body;

        if (!invoiceId || !amount) {
            return NextResponse.json({ error: 'Invoice ID and amount are required' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Invoice
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { member: true }
            });

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // 2. Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    invoiceId,
                    amount: parseFloat(amount),
                    method: method || 'Cash',
                    bankAccountId, // Can be Petty Cash or Hand Cash account ID
                },
            });

            // 3. Update Invoice Status
            const newPaidAmount = invoice.paidAmount + payment.amount;
            let newStatus = invoice.status;

            if (newPaidAmount >= invoice.amount) {
                newStatus = 'paid';
            } else if (newPaidAmount > 0) {
                newStatus = 'partial';
            }

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus,
                },
            });

            // 4. Update Bank/Cash Account Balance
            if (bankAccountId) {
                await tx.bankAccount.update({
                    where: { id: bankAccountId },
                    data: {
                        balance: { increment: payment.amount }
                    }
                });
            }

            // 5. Create Ledger Entry (Credit)
            await tx.ledger.create({
                data: {
                    description: `Sanda Payment: ${invoice.member.name} (${invoice.period})`,
                    amount: payment.amount,
                    type: 'Credit',
                    category: 'Sanda Collection',
                    bankAccountId: bankAccountId,
                    referenceId: payment.id,
                    referenceType: 'Payment',
                },
            });

            return payment;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
