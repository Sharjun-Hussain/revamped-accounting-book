import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const entityType = searchParams.get('entityType');
        const action = searchParams.get('action');
        const userId = searchParams.get('userId');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build where clause
        const where = {};

        if (entityType) {
            where.entityType = entityType;
        }

        if (action) {
            where.action = action;
        }

        if (userId) {
            where.userId = userId;
        }

        if (search) {
            where.OR = [
                { entityName: { contains: search, mode: 'insensitive' } },
                { entityId: { contains: search, mode: 'insensitive' } },
                { userName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate) {
                where.timestamp.lte = new Date(endDate);
            }
        }

        // Get total count for pagination
        const total = await prisma.auditLog.count({ where });

        // Get audit logs
        const auditLogs = await prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({
            data: auditLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
