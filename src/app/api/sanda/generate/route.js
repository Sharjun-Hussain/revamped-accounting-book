import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const body = await request.json();
        const { period } = body; // e.g., "2025-01"

        if (!period) {
            return NextResponse.json({ error: 'Period is required (YYYY-MM)' }, { status: 400 });
        }

        // 1. Get all active members
        const activeMembers = await prisma.member.findMany({
            where: { status: 'active' },
        });

        const results = {
            generated: 0,
            skipped: 0,
            errors: 0,
        };

        // 2. Generate Invoice for each member if not exists
        for (const member of activeMembers) {
            // Check if invoice already exists for this member and period
            const existingInvoice = await prisma.invoice.findFirst({
                where: {
                    memberId: member.id,
                    period: period,
                    type: 'Sanda',
                },
            });

            if (existingInvoice) {
                results.skipped++;
                continue;
            }

            try {
                await prisma.invoice.create({
                    data: {
                        invoiceNo: `INV-${period}-${member.id.slice(-4)}`, // Simple invoice number logic
                        memberId: member.id,
                        amount: member.amountPerCycle,
                        dueDate: new Date(`${period}-28`), // Due by 28th of the month
                        period: period,
                        type: 'Sanda',
                        status: 'pending',
                    },
                });
                results.generated++;
            } catch (err) {
                console.error(`Failed to generate invoice for member ${member.id}:`, err);
                results.errors++;
            }
        }

        return NextResponse.json({ message: 'Sanda generation complete', results });
    } catch (error) {
        console.error('Error generating sanda:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
