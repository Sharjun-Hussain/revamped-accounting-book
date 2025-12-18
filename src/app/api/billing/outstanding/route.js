import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch members with their invoices
        const members = await prisma.member.findMany({
            where: { status: 'active' },
            include: {
                invoices: {
                    where: {
                        status: { in: ['pending', 'partial', 'overdue'] }
                    }
                }
            }
        });

        // Calculate arrears for each member
        const outstandingMembers = members
            .map(member => {
                const totalArrears = member.invoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
                const monthsDue = member.invoices.length;

                // Find last payment (This is a bit expensive, maybe optimize later)
                // For now, we'll leave last_paid as null or fetch separately if critical

                const detailedInvoices = member.invoices.map(inv => ({
                    period: inv.period,
                    amount: inv.amount,
                    paid: inv.paidAmount,
                    balance: inv.amount - inv.paidAmount
                }));

                return {
                    id: member.id,
                    name: member.name,
                    phone: member.contact,
                    arrears: totalArrears,
                    months_due: monthsDue,
                    details: detailedInvoices, // Add detailed invoices
                    last_paid: "-",
                    status: member.status
                };
            })
            .filter(m => m.arrears > 0) // Only show members with arrears
            .sort((a, b) => b.arrears - a.arrears); // Sort by highest arrears

        return NextResponse.json(outstandingMembers);
    } catch (error) {
        console.error('Error fetching outstanding arrears:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
