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
                const amt = parseFloat(p.amount);
                
                // DATA VALIDATION
                if (isNaN(amt)) {
                    console.error(`Invalid amount for member ${p.memberId}:`, p.amount);
                    throw new Error(`Invalid payment amount for member ${p.memberId}`);
                }

                // 1. Create Invoice if not exists
                if (!invoiceId) {
                    const paymentPeriod = p.period || period;
                    let invoice = await tx.invoice.findFirst({
                        where: {
                            memberId: p.memberId,
                            period: paymentPeriod,
                            type: 'Sanda'
                        }
                    });

                    if (!invoice) {
                        // Create unique invoiceNo using memberId and a random suffix to avoid collisions
                        const randomSuffix = Math.random().toString(36).substring(2, 6);
                        const invNo = `INV-${paymentPeriod}-${p.memberId.slice(-4)}-${randomSuffix}`;
                        
                        invoice = await tx.invoice.create({
                            data: {
                                invoiceNo: invNo,
                                memberId: p.memberId,
                                amount: amt,
                                dueDate: new Date(`${paymentPeriod}-10`), // Default due date to 10th
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
                        amount: amt,
                        method: p.method || 'Cash',
                        bankAccountId: p.bankAccountId,
                    },
                });

                // 3. Update Invoice Status
                const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
                const newPaidAmount = (invoice.paidAmount || 0) + payment.amount;
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
                if (!member) {
                    throw new Error(`Member not found: ${p.memberId}`);
                }
                
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
        }, {
            timeout: 15000 // Increase timeout for bulk transactions
        });

        return NextResponse.json({ message: 'Bulk payment processed', results });
    } catch (error) {
        console.error('CRITICAL: Bulk Payment API Failed:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error',
            details: error.code // Prisma error codes
        }, { status: 500 });
    }
}
