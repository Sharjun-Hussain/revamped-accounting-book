-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'Masjid Accounting System',
    "appVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "footerText" TEXT NOT NULL DEFAULT 'Developed By: Inzeedo (PVT) Ltd.',
    "footerCopyright" TEXT NOT NULL DEFAULT '© 2025 All Rights Reserved',
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
