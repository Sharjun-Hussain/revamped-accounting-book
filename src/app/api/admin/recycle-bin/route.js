import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logUpdate, logDelete } from '@/lib/auditLog';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        const result = {};

        const fetchDeleted = async (model) => {
            return await prisma[model].findMany({
                where: { deletedAt: { not: null } },
                orderBy: { deletedAt: 'desc' }
            });
        };

        if (type === 'all' || type === 'members') result.members = await fetchDeleted('member');
        if (type === 'all' || type === 'invoices') result.invoices = await fetchDeleted('invoice');
        if (type === 'all' || type === 'payments') result.payments = await fetchDeleted('payment');
        if (type === 'all' || type === 'expenses') result.expenses = await fetchDeleted('expense');
        if (type === 'all' || type === 'income') result.income = await fetchDeleted('income');
        if (type === 'all' || type === 'donations') result.donations = await fetchDeleted('donation');
        if (type === 'all' || type === 'categories') result.categories = await fetchDeleted('category');
        if (type === 'all' || type === 'bankAccounts') result.bankAccounts = await fetchDeleted('bankAccount');
        if (type === 'all' || type === 'ledgers') result.ledgers = await fetchDeleted('ledger');

        return NextResponse.json(result);

    } catch (error) {
        console.error("Failed to fetch recycle bin data:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ids, type } = body; // ids is an array of IDs to restore, type is the model name (e.g. 'member')

        if (!ids || !type || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
        }

        if (!prisma[type]) {
             return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
        }

        const restoredRecords = [];

        for (const id of ids) {
            const originalRecord = await prisma[type].findUnique({ where: { id } });
            
            if (originalRecord) {
                const updatedRecord = await prisma[type].update({
                    where: { id },
                    data: { deletedAt: null, deletedByResetId: null }
                });

                await logUpdate(request, type, originalRecord, updatedRecord, 'Restored from Recycle Bin');
                restoredRecords.push(updatedRecord);
            }
        }

        return NextResponse.json({ success: true, message: `Successfully restored ${restoredRecords.length} record(s)`, restored: restoredRecords });

    } catch (error) {
        console.error("Failed to restore records:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ids, type } = body;

        if (!ids || !type || !Array.isArray(ids)) {
             return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
        }

        if (!prisma[type]) {
            return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
        }
        
        let deletedCount = 0;

        for (const id of ids) {
            const record = await prisma[type].findUnique({ where: { id } });
            if (record) {
                 await prisma[type].delete({ where: { id } });
                 await logDelete(request, type, record, 'Permanently deleted from Recycle Bin');
                 deletedCount++;
            }
        }

        return NextResponse.json({ success: true, message: `Permanently deleted ${deletedCount} record(s)` });

    } catch (error) {
        console.error("Failed to permanently delete records:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
