import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logCreate } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Debug: Check available models
        console.log('Prisma models:', Object.keys(prisma));

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { contact: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // 1. Fetch Guest Donors
        const donors = await prisma.donor.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { donations: true }
                }
            }
        });

        // 2. Fetch Registered Members (who match search)
        // We only want members who have actually donated, or maybe all members matching search?
        // Let's fetch members matching search, and we'll see their donation stats.
        const members = await prisma.member.findMany({
            where: {
                ...where,
                // Optional: Only include members who have donated? 
                // For now, let's include all matching members so we can see them in the list even if they haven't donated yet (or maybe filter in UI).
                // But user specifically asked for "if registered member donate", so maybe prioritize those.
                // Let's keep it simple: fetch matching members.
            },
            include: {
                _count: {
                    select: { donations: true }
                }
            }
        });

        // 3. Calculate stats for Guest Donors
        const donorsWithStats = await Promise.all(donors.map(async (donor) => {
            try {
                const aggregate = await prisma.donation.aggregate({
                    where: { donorId: donor.id },
                    _sum: { amount: true },
                    _max: { date: true }
                });

                return {
                    ...donor,
                    type: 'guest',
                    total_contributed: aggregate._sum.amount || 0,
                    last_donation: aggregate._max.date,
                    donation_count: donor._count?.donations || 0
                };
            } catch (err) {
                return { ...donor, type: 'guest', total_contributed: 0, last_donation: null, donation_count: 0 };
            }
        }));

        // 4. Calculate stats for Members
        const membersWithStats = await Promise.all(members.map(async (member) => {
            try {
                const aggregate = await prisma.donation.aggregate({
                    where: { memberId: member.id },
                    _sum: { amount: true },
                    _max: { date: true }
                });

                // Only return members who have donated if no search term, 
                // OR if search term exists, return them regardless (but stats might be 0)
                // User said: "if registered member donate it does not showing".
                // So let's filter out members with 0 donations unless searching?
                // Actually, let's just return them with stats. The UI can sort/filter.

                return {
                    ...member,
                    type: 'member',
                    total_contributed: aggregate._sum.amount || 0,
                    last_donation: aggregate._max.date,
                    donation_count: member._count?.donations || 0
                };
            } catch (err) {
                return { ...member, type: 'member', total_contributed: 0, last_donation: null, donation_count: 0 };
            }
        }));

        // 5. Merge and Sort
        // Filter out members with 0 donations to keep the "Donors" list focused on actual donors?
        // Or keep them? Let's filter out members with 0 donations to avoid cluttering the list with all members.
        // UNLESS searching.
        let allDonors = [...donorsWithStats, ...membersWithStats];

        if (!search) {
            allDonors = allDonors.filter(d => d.donation_count > 0);
        }

        // Sort by last donation date (most recent first)
        allDonors.sort((a, b) => {
            const dateA = a.last_donation ? new Date(a.last_donation).getTime() : 0;
            const dateB = b.last_donation ? new Date(b.last_donation).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json(allDonors);
    } catch (error) {
        console.error('Error fetching donors:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, contact, email, address } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const donor = await prisma.donor.create({
            data: {
                name,
                contact,
                email,
                address
            }
        });

        // Log donor creation
        await logCreate(request, 'Donor', donor);

        return NextResponse.json(donor);
    } catch (error) {
        console.error('Error creating donor:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
