import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const body = await request.json();
        const { payments, period } = body; // payments: [{ memberId, amount, method, bankAccountId }]

        if (!payments || !Array.isArray(payments) || payments.length === 0) {
            return NextResponse.json({ error: 'No payments provided' }, { status: 400 });
        }
        if (!period) {
            return NextResponse.json({ error: 'Period is required' }, { status: 400 });
        }

        const results = await prisma.$transaction(async (tx) => {
            const processed = [];

            for (const p of payments) {
                let invoiceId = p.invoiceId;

                // 1. Create Invoice if not exists
                if (!invoiceId) {
                    // Check again inside transaction to be safe
                    const paymentPeriod = p.period || period;
                    let invoice = await tx.invoice.findFirst({
                        where: {
                            memberId: p.memberId,
                            period: paymentPeriod,
                            type: 'Sanda'
                        }
                    });

                    if (!invoice) {
                        // Create new invoice
                        invoice = await tx.invoice.create({
                            data: {
                                invoiceNo: `INV-${paymentPeriod}-${p.memberId.slice(-4)}`,
                                memberId: p.memberId,
                                amount: parseFloat(p.amount), // Assuming full payment for now, or use member default
                                dueDate: new Date(`${paymentPeriod}-28`),
                                period: paymentPeriod,
                                type: 'Sanda',
                                status: 'pending',
                            }
                        });
                    }
                    invoiceId = invoice.id;
                }

                // 2. Create Payment Record
                const payment = await tx.payment.create({
                    data: {
                        invoiceId,
                        amount: parseFloat(p.amount),
                        method: p.method || 'Cash',
                        bankAccountId: p.bankAccountId,
                    },
                });

                // 3. Update Invoice Status
                const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
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
                if (p.bankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: p.bankAccountId },
                        data: {
                            balance: { increment: payment.amount }
                        }
                    });
                }

                // 5. Create Ledger Entry
                const member = await tx.member.findUnique({ where: { id: p.memberId } });
                const paymentPeriod = p.period || period;
                await tx.ledger.create({
                    data: {
                        description: `Sanda Payment (Bulk): ${member.name} (${paymentPeriod})`,
                        amount: payment.amount,
                        type: 'Credit',
                        category: 'Sanda Collection',
                        bankAccountId: p.bankAccountId,
                        referenceId: payment.id,
                        referenceType: 'Payment',
                    },
                });

                processed.push({
                    memberId: p.memberId,
                    memberName: member.name,
                    amount: payment.amount,
                    period: paymentPeriod,
                    receiptNo: payment.id,
                    date: new Date().toISOString(),
                    status: 'success'
                });
            }
            return processed;
        });

        return NextResponse.json({ message: 'Bulk payment processed', results });
    } catch (error) {
        console.error('Error processing bulk payment:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
