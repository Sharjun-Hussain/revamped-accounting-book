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

        // Calculate arrears and fetch last payment for each member
        const outstandingMembers = await Promise.all(members.map(async (member) => {
            const totalArrears = member.invoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
            const monthsDue = member.invoices.length;

            // Fetch last payment across all invoices of this member
            const lastPayment = await prisma.payment.findFirst({
                where: {
                    invoice: {
                        memberId: member.id,
                        deletedAt: null
                    },
                    deletedAt: null
                },
                orderBy: {
                    date: 'desc'
                },
                select: {
                    date: true
                }
            });

            // Format last payment date
            let lastPaidStr = "Never";
            if (lastPayment?.date) {
                const date = new Date(lastPayment.date);
                lastPaidStr = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }

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
                details: detailedInvoices,
                last_paid: lastPaidStr,
                status: member.status
            };
        }));

        // Filter and sort
        const filteredList = outstandingMembers
            .filter(m => m.arrears > 0)
            .sort((a, b) => b.arrears - a.arrears);

        return NextResponse.json(filteredList);
    } catch (error) {
        console.error('Error fetching outstanding arrears:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
