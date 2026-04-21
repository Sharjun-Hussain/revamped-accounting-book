import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logUpdate } from '@/lib/auditLog';

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;

    try {
        const oldUser = await prisma.user.findUnique({ where: { id } });
        
        const user = await prisma.user.update({
            where: { id },
            data: { status: 'approved' },
        });

        if (oldUser) {
            await logUpdate(request, 'User', oldUser, user, 'email');
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error approving user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
