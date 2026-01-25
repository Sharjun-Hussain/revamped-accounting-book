import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const donation = await prisma.donation.findUnique({
            where: { id },
            include: { member: true }
        });

        if (!donation) {
            return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
        }

        return NextResponse.json(donation);
    } catch (error) {
        console.error('Error fetching donation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
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
            remarks
        } = body;

        if (!amount || !purpose || String(purpose).trim() === "") {
            return NextResponse.json({ error: 'Amount and a valid purpose are required' }, { status: 400 });
        }

        const finalAmount = parseFloat(amount);
        if (isNaN(finalAmount)) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const finalDate = date ? new Date(date) : new Date();
        if (isNaN(finalDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
        }

        const donation = await prisma.donation.update({
            where: { id },
            data: {
                amount: finalAmount,
                date: finalDate,
                purpose: String(purpose),
                paymentMethod,
                isAnonymous,
                donorType,
                donorName: isAnonymous ? 'Anonymous' : (donorType === 'member' ? undefined : donorName),
                memberId: donorType === 'member' ? memberId : undefined,
                remarks: remarks || undefined,
            },
        });

        return NextResponse.json(donation);
    } catch (error) {
        console.error('Error updating donation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Optional: Reverse ledger entry and bank balance update if needed
        // For simplicity, we are just deleting the record for now

        await prisma.donation.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Donation deleted' });
    } catch (error) {
        console.error('Error deleting donation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
