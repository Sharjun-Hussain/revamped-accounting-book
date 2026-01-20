import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logUpdate, logDelete } from '@/lib/auditLog';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const member = await prisma.member.findUnique({
            where: { id },
        });

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json(member);
    } catch (error) {
        console.error('Error fetching member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, address, email, contact, payment_frequency, amount_per_cycle, start_date, profilePicture, memberNo, status } = body;

        const currentMember = await prisma.member.findUnique({
            where: { id },
        });

        if (!currentMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Check for unique memberNo if changed
        if (memberNo && memberNo !== currentMember.memberNo) {
            const existing = await prisma.member.findUnique({ where: { memberNo } });
            if (existing) {
                return NextResponse.json({ error: `Member ID ${memberNo} already exists` }, { status: 400 });
            }
        }

        const updatedMember = await prisma.member.update({
            where: { id },
            data: {
                name,
                address,
                email,
                contact,
                memberNo,
                paymentFrequency: payment_frequency,
                amountPerCycle: parseFloat(amount_per_cycle),
                startDate: start_date ? new Date(start_date) : undefined,
                profilePicture,
                status // Allow status update
            },
        });

        await logUpdate(request, 'Member', currentMember, updatedMember, 'name');

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error('Error updating member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const currentMember = await prisma.member.findUnique({ where: { id } });
        if (!currentMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Check if member has donations or payments (optional: prevent delete if data exists)
        // For now, we'll allow delete or maybe just soft delete via status update in PUT.
        // But implementing DELETE as requested.

        const deletedMember = await prisma.member.delete({
            where: { id },
        });

        await logDelete(request, 'Member', currentMember);

        return NextResponse.json(deletedMember);
    } catch (error) {
        console.error('Error deleting member:', error);
        // Handle foreign key constraints
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete member with existing records (payments/donations).' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
