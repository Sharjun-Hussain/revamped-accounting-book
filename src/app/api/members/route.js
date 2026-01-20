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
        const { name, address, email, contact, payment_frequency, amount_per_cycle, start_date, profilePicture, memberNo } = body;

        if (!name || !contact) {
            return NextResponse.json({ error: 'Name and contact are required' }, { status: 400 });
        }

        // 1. Handle Member ID Generation
        let finalMemberNo = memberNo;

        // Fetch settings to check format
        const settings = await prisma.appSettings.findFirst();

        if (settings) {
            if (settings.memberIdFormat === 'Auto') {
                // Generate ID: PREFIX-001
                const prefix = settings.memberIdPrefix || 'MEM';
                const nextId = settings.nextMemberId || 1;
                finalMemberNo = `${prefix}-${String(nextId).padStart(3, '0')}`;

                // Increment nextMemberId in settings
                await prisma.appSettings.update({
                    where: { id: settings.id },
                    data: { nextMemberId: nextId + 1 }
                });
            } else if (settings.memberIdFormat === 'Manual' && !memberNo) {
                return NextResponse.json({ error: 'Member ID is required for manual entry' }, { status: 400 });
            }
        }

        // Check for uniqueness if ID exists
        if (finalMemberNo) {
            const existing = await prisma.member.findUnique({ where: { memberNo: finalMemberNo } });
            if (existing) {
                return NextResponse.json({ error: `Member ID ${finalMemberNo} already exists` }, { status: 400 });
            }
        }

        const member = await prisma.member.create({
            data: {
                memberNo: finalMemberNo,
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
