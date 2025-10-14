import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import AxiosSetup from '@/components/AxiosSetup';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Motorbike POS - Configuration',
  description: 'Multi-branch management system for motorbike stores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AxiosSetup />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}