import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logUpdate, logDelete } from '@/lib/auditLog';

// GET: List all reset requests (Admin only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Only platform admin can access this (you can adjust role check)
        if (!session || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resetRequests = await prisma.resetRequest.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(resetRequests);

    } catch (error) {
        console.error("Failed to fetch reset requests:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Restore or permanently delete data
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { resetRequestId, action } = body; // action: 'restore' or 'delete'

        if (!resetRequestId || !['restore', 'delete'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const resetRequest = await prisma.resetRequest.findUnique({
            where: { id: resetRequestId }
        });

        if (!resetRequest) {
            return NextResponse.json({ error: 'Reset request not found' }, { status: 404 });
        }

        if (action === 'restore') {
            // Restore all data marked by this reset
            await Promise.all([
                prisma.member.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.invoice.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.payment.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.expense.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.income.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.donation.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.category.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.bankAccount.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
                prisma.ledger.updateMany({
                    where: { deletedByResetId: resetRequestId },
                    data: { deletedAt: null, deletedByResetId: null }
                }),
            ]);

            const updatedResetRequest = await prisma.resetRequest.update({
                where: { id: resetRequestId },
                data: { status: 'restored', restoredAt: new Date() }
            });

            // Log restoration
            await logUpdate(request, 'ResetRequest', resetRequest, updatedResetRequest, 'reason');

            return NextResponse.json({ success: true, message: 'Data restored successfully' });

        } else if (action === 'delete') {
            // Permanently delete all data marked by this reset
            await Promise.all([
                prisma.payment.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.invoice.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.donation.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.member.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.expense.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.income.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.category.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.ledger.deleteMany({ where: { deletedByResetId: resetRequestId } }),
                prisma.bankAccount.deleteMany({ where: { deletedByResetId: resetRequestId } }),
            ]);

            const deletedResetRequest = await prisma.resetRequest.update({
                where: { id: resetRequestId },
                data: { status: 'deleted', deletedAt: new Date() }
            });

            // Log permanent deletion
            await logDelete(request, 'ResetRequest', resetRequest, 'reason');

            return NextResponse.json({ success: true, message: 'Data permanently deleted' });
        }

    } catch (error) {
        console.error("Reset request action failed:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
