import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const search = searchParams.get('search');

    try {
        const where = {};

        // Date Range Filter
        if (from && to) {
            where.date = {
                gte: new Date(from),
                lte: new Date(to),
            };
        }

        // Search Filter (Member Name or Receipt ID)
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                {
                    invoice: {
                        member: {
                            name: { contains: search, mode: 'insensitive' }
                        }
                    }
                }
            ];
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                invoice: {
                    include: {
                        member: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' },
        });

        const formattedPayments = payments.map(payment => ({
            id: payment.id,
            member_id: payment.invoice.member.id,
            name: payment.invoice.member.name,
            amount: payment.amount,
            date: payment.date,
            method: payment.method,
            months_covered: [payment.invoice.period], // Simplified for now, usually one payment per invoice
            status: "Valid" // Default status as we don't have void logic yet
        }));

        return NextResponse.json(formattedPayments);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
