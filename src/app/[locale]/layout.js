// app/[locale]/layout.jsx
import "../globals.css";
import { Toaster } from "sonner";
import Providers from "../providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Ubuntu } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
})

export const metadata = {
  title: "Masjid Accounting System",
  description: "Comprehensive accounting and management system",
  icons: {
    icon: '/icon.png',
  },
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={ubuntu.variable}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <NextTopLoader color="#10B981" showSpinner={false} height={3} />
            <ServiceWorkerRegister />
            {children}
            <Toaster position="top-right" richColors />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}