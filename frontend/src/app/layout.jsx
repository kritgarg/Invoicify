import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata = {
  title: 'Invoicify Dashboard',
  description: 'Manage customers and invoices with ease',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased bg-gradient-to-br from-[#fdfbf6] to-[#f4f2e3] dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
