import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const donations = await prisma.donation.findMany({
            include: { member: true },
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(donations);
    } catch (error) {
        console.error('Error fetching donations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            amount,
            date,
            purpose,
            paymentMethod,
            isAnonymous,
            donorType,
            donorName,
            memberId,
            bankAccountId // Optional: if provided, update this account
        } = body;

        if (!amount || !purpose) {
            return NextResponse.json({ error: 'Amount and purpose are required' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Donation Record
            const donation = await tx.donation.create({
                data: {
                    amount: parseFloat(amount),
                    date: date ? new Date(date) : new Date(),
                    purpose,
                    paymentMethod: paymentMethod || 'Cash',
                    isAnonymous: isAnonymous || false,
                    donorType: donorType || 'guest',
                    donorName: isAnonymous ? 'Anonymous' : (donorType === 'member' ? undefined : donorName),
                    memberId: donorType === 'member' ? memberId : undefined,
                },
            });

            // 2. Find target bank account (or default Cash account if not provided)
            let targetAccountId = bankAccountId;

            if (!targetAccountId) {
                // Try to find a default "Cash" account if payment is Cash
                if (paymentMethod === 'Cash') {
                    const cashAccount = await tx.bankAccount.findFirst({
                        where: { type: 'Cash' }
                    });
                    if (cashAccount) targetAccountId = cashAccount.id;
                }
            }

            // 3. Create Ledger Entry
            await tx.ledger.create({
                data: {
                    date: donation.date,
                    description: `Donation: ${purpose} - ${donation.isAnonymous ? 'Anonymous' : (donation.donorName || 'Member')}`,
                    amount: donation.amount,
                    type: 'Credit',
                    category: purpose,
                    bankAccountId: targetAccountId,
                    referenceId: donation.id,
                    referenceType: 'Donation',
                },
            });

            // 4. Update Bank Balance if account exists
            if (targetAccountId) {
                await tx.bankAccount.update({
                    where: { id: targetAccountId },
                    data: {
                        balance: { increment: donation.amount }
                    }
                });
            }

            return donation;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating donation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
