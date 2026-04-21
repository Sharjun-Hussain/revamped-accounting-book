// app/layout.jsx
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Ubuntu } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ubuntu.variable}>
        <Providers>
          <NextTopLoader color="#10B981" showSpinner={false} height={3} />
          <ServiceWorkerRegister />
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}