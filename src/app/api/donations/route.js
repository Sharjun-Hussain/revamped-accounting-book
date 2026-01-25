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
            donorId, // Extract donorId
            bankAccountId,
            remarks
        } = body;

        if (!amount || !purpose || String(purpose).trim() === "") {
            return NextResponse.json({ error: 'Amount and a valid purpose are required' }, { status: 400 });
        }

        const finalAmount = parseFloat(amount);
        if (isNaN(finalAmount)) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Handle Donor Linking for Guests
            let finalDonorId = donorId;

            // If it's a member donation, we don't link to Donor table
            if (donorType === 'member') {
                finalDonorId = undefined;
            }
            // If it's a guest/other, validate the provided donorId if it exists
            else if (finalDonorId) {
                const existing = await tx.donor.findUnique({ where: { id: finalDonorId } });
                if (!existing) {
                    finalDonorId = null; // Invalid ID, reset it so we can try to find/create by name
                }
            }

            if (donorType === 'guest' && !isAnonymous && donorName) {
                // If no ID provided (or invalid one was reset), try to find by name or create
                if (!finalDonorId) {
                    const existingDonor = await tx.donor.findFirst({
                        where: { name: { equals: donorName, mode: 'insensitive' } }
                    });

                    if (existingDonor) {
                        finalDonorId = existingDonor.id;
                    } else {
                        const newDonor = await tx.donor.create({
                            data: { name: donorName }
                        });
                        finalDonorId = newDonor.id;
                    }
                }
            }

            // 2. Create Donation Record
            const donation = await tx.donation.create({
                data: {
                    amount: finalAmount,
                    date: date ? new Date(date) : new Date(),
                    purpose: String(purpose),
                    paymentMethod: paymentMethod || 'Cash',
                    isAnonymous: isAnonymous || false,
                    donorType: donorType || 'guest',
                    donorName: isAnonymous ? 'Anonymous' : (donorType === 'member' ? undefined : donorName),
                    memberId: donorType === 'member' ? memberId : undefined,
                    donor: finalDonorId ? { connect: { id: finalDonorId } } : undefined,
                    remarks: remarks || undefined,
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
