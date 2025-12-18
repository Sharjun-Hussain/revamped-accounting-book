import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        // Try to find by internal ID first, then by invoiceNo
        const invoice = await prisma.invoice.findFirst({
            where: {
                OR: [
                    { id: id },
                    { invoiceNo: id }
                ]
            },
            include: {
                member: true,
                payments: {
                    include: {
                        bankAccount: true
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
