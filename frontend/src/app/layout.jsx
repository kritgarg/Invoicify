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
      <body className={`${outfit.className} antialiased bg-gradient-to-br from-[#fcf9e8] via-[#fdfdf5] to-[#fcebba] text-[#1c1c1c] min-h-screen bg-fixed`}>
        {children}
      </body>
    </html>
  );
}
