import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logCreate } from '@/lib/auditLog';

export async function GET() {
    try {
        const members = await prisma.member.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, address, email, contact, payment_frequency, amount_per_cycle, start_date, profilePicture } = body;

        if (!name || !contact) {
            return NextResponse.json({ error: 'Name and contact are required' }, { status: 400 });
        }

        const member = await prisma.member.create({
            data: {
                name,
                address,
                email,
                contact,
                paymentFrequency: payment_frequency || 'Monthly',
                amountPerCycle: parseFloat(amount_per_cycle) || 0,
                startDate: start_date ? new Date(start_date) : new Date(),
                profilePicture,
                status: 'active',
            },
        });

        // Log member creation
        await logCreate(request, 'Member', member);

        return NextResponse.json(member, { status: 201 });
    } catch (error) {
        console.error('Error creating member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
