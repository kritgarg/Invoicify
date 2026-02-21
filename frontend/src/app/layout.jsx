import './globals.css';

export const metadata = {
  title: 'Invoicify Dashboard',
  description: 'Manage customers and invoices with ease',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
