import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logCreate } from '@/lib/auditLog';

export async function POST(request) {
    try {
        const body = await request.json();
        const { members } = body;

        if (!members || !Array.isArray(members) || members.length === 0) {
            return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
        }

        const settings = await prisma.appSettings.findFirst();
        const prefix = settings?.memberIdPrefix || 'MEM';
        let nextId = settings?.nextMemberId || 1;

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        const membersToCreate = [];

        // 1. Pre-process and Validation
        for (let i = 0; i < members.length; i++) {
            const row = members[i];
            // Normalize keys (handle case sensitivity from CSV/Excel)
            const name = row.Name || row.name;
            const contact = row.Contact || row.contact;
            const address = row.Address || row.address;
            const email = row.Email || row.email;
            let memberNo = row['Member ID'] || row.memberNo || row.member_id;

            if (!name) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Name is required`);
                continue;
            }

            // Auto-generate ID if missing
            if (!memberNo) {
                memberNo = `${prefix}-${String(nextId).padStart(3, '0')}`;
                nextId++;
            }

            membersToCreate.push({
                memberNo,
                name,
                contact: String(contact || ''), // Ensure string
                address,
                email,
                paymentFrequency: 'Monthly', // Default
                amountPerCycle: 0, // Default
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 2. Update Settings (if IDs were generated)
        if (settings && nextId > settings.nextMemberId) {
            await prisma.appSettings.update({
                where: { id: settings.id },
                data: { nextMemberId: nextId }
            });
        }

        // 3. Batch Insert (using createMany for performance)
        // Note: createMany skips duplicates if skipDuplicates: true is supported (Postgres supports it)
        // But we want to know if it failed.
        // Let's use a transaction with individual creates to catch errors if needed, 
        // OR just createMany and assume pre-validation was good enough (except for unique constraints).
        // Given 1000 rows, createMany is much better.

        try {
            const created = await prisma.member.createMany({
                data: membersToCreate,
                skipDuplicates: true, // Skip if ID or Email exists
            });

            // If skipDuplicates is true, we don't know exactly which failed, but we know how many succeeded.
            // For a better UX, we might want to know which failed.
            // But for now, let's return the count.

            results.success = created.count;
            results.failed += (membersToCreate.length - created.count);

            if (membersToCreate.length > created.count) {
                results.errors.push(`${membersToCreate.length - created.count} records were skipped (duplicate ID or Email).`);
            }

            // Log bulk action (generic)
            // await logCreate(request, 'Member', { count: created.count, action: 'Bulk Import' });

        } catch (dbError) {
            console.error('Database error during bulk import:', dbError);
            return NextResponse.json({ error: 'Database error occurred during import.' }, { status: 500 });
        }

        return NextResponse.json({
            count: results.success,
            failed: results.failed,
            messages: results.errors
        });

    } catch (error) {
        console.error('Error processing bulk upload:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
