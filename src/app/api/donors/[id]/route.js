import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logUpdate, logDelete } from '@/lib/auditLog';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const donor = await prisma.donor.findUnique({
            where: { id: params.id },
            include: {
                donations: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });

        if (!donor) {
            return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
        }

        return NextResponse.json(donor);
    } catch (error) {
        console.error('Error fetching donor:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, contact, email, address } = body;

        const oldDonor = await prisma.donor.findUnique({ where: { id: params.id } });

        const donor = await prisma.donor.update({
            where: { id: params.id },
            data: {
                name,
                contact,
                email,
                address
            }
        });

        if (oldDonor) {
            await logUpdate(request, 'Donor', oldDonor, donor);
        }

        return NextResponse.json(donor);
    } catch (error) {
        console.error('Error updating donor:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if donor has donations
        const donationCount = await prisma.donation.count({
            where: { donorId: params.id }
        });

        if (donationCount > 0) {
            return NextResponse.json({ error: 'Cannot delete donor with existing donations' }, { status: 400 });
        }

        const currentDonor = await prisma.donor.findUnique({ where: { id: params.id } });
        
        await prisma.donor.delete({
            where: { id: params.id }
        });

        if (currentDonor) {
            await logDelete(request, 'Donor', currentDonor);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting donor:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
