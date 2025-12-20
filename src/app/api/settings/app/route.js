import { NextResponse } from 'next/server';
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
        const { appName, appVersion, footerText, footerCopyright, showFooter } = body;

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
                    appName,
                    appVersion,
                    footerText,
                    footerCopyright,
                    showFooter: showFooter !== undefined ? showFooter : true,
                },
            });

            // Log the update
            await logUpdate(request, 'AppSettings', currentSettings, settings, 'appName');
        } else {
            // Create new settings
            settings = await prisma.appSettings.create({
                data: {
                    appName,
                    appVersion,
                    footerText,
                    footerCopyright,
                    showFooter: showFooter !== undefined ? showFooter : true,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating app settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
