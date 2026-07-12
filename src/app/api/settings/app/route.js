import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logUpdate } from '@/lib/auditLog';

export async function GET() {
    try {
        // Get or create app settings
        let settings = await prisma.appSettings.findFirst();

        // If no settings exist, create default settings
        if (!settings) {
            settings = await prisma.appSettings.create({
                data: {
                    appName: 'Masjid Accounting System',
                    appVersion: '1.0.0',
                    footerText: 'Developed By: Inzeedo (PVT) Ltd.',
                    footerCopyright: '© 2025 All Rights Reserved',
                    showFooter: true,
                    // Defaults are handled by Prisma schema
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching app settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        // Check if user is authenticated and is superadmin
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized - Super Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const {
            appName, appVersion, footerText, footerCopyright, showFooter,
            mosqueName, regNo, email, phone, address,
            currency, fiscalYearStart, autoBillDate, receiptFooter,
            smsEnabled, emailEnabled, logo, textLkApiKey, textLkSenderId,
            memberIdFormat, memberIdPrefix, nextMemberId // Add new fields
        } = body;

        // Validation
        if (!appName || !appVersion) {
            return NextResponse.json({ error: 'App name and version are required' }, { status: 400 });
        }

        // Get current settings for audit log
        const currentSettings = await prisma.appSettings.findFirst();

        let settings;
        if (currentSettings) {
            // Update existing settings
            settings = await prisma.appSettings.update({
                where: { id: currentSettings.id },
                data: {
                    appName, appVersion, footerText, footerCopyright, showFooter,
                    mosqueName, regNo, email, phone, address,
                    currency, fiscalYearStart, autoBillDate, receiptFooter,
                    smsEnabled, emailEnabled, logo, textLkApiKey, textLkSenderId,
                    memberIdFormat, memberIdPrefix, nextMemberId: nextMemberId ? parseInt(nextMemberId) : undefined
                },
            });

            // Log the update
            await logUpdate(request, 'AppSettings', currentSettings, settings, 'mosqueName');
        } else {
            // Create new settings
            settings = await prisma.appSettings.create({
                data: {
                    appName, appVersion, footerText, footerCopyright, showFooter,
                    mosqueName, regNo, email, phone, address,
                    currency, fiscalYearStart, autoBillDate, receiptFooter,
                    smsEnabled, emailEnabled, textLkApiKey, textLkSenderId
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating app settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
