import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/providers/ToastProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { I18nProvider } from '@/providers/I18nProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ReceiptFlow',
  description: 'Organiza tus recibos, consulta tus gastos y marca lo que ya pagaste.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#f6f7f8] text-stone-900">
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
