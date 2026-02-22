'use client';

import { 
  Bell,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import api from '@/lib/api';

const INVOICE_ROUTES = [
  { name: 'Dashboard', href: '/dashboard', roles: ['admin'] },
  { name: 'Customers', href: '/customers', roles: ['admin', 'staff'] },
  { name: 'Items', href: '/items', roles: ['admin', 'staff'] },
  { name: 'Invoices', href: '/invoices', roles: ['admin', 'staff'] },
  { name: 'Reports', href: '/reports', roles: ['admin'] },
  { name: 'Users', href: '/users', roles: ['admin'] },
  { name: 'Settings', href: '/settings', roles: ['admin'] },
];

export default function Topbar({ user }) {
  const pathname = usePathname();
  const userRole = user?.role || 'staff';

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header className="flex items-center justify-between w-full h-24 px-8 pt-4">
      <div className="flex items-center space-x-2">
        <div className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full">
          <span className="text-xl font-bold font-sans tracking-tight text-gray-900 dark:text-white">Invoicify</span>
        </div>
      </div>
      
      <div className="flex-1 flex justify-end items-center gap-4">
        {/* Nav Links Pill */}
        <nav className="hidden md:flex items-center bg-transparent gap-2 mr-4">
          {INVOICE_ROUTES.map((route) => {
               if (!route.roles.includes(userRole)) return null;
               const active = pathname === route.href || pathname.startsWith(route.href + '/');
               
               return (
                <Link 
                  key={route.name}
                  href={route.href}
                  className={clsx(
                    "px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 backdrop-blur-md",
                    active 
                      ? "bg-gray-900 text-white shadow-md dark:bg-gray-100 dark:text-gray-900" 
                      : "text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                  )}
                >
                  {route.name}
                </Link>
               );
          })}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full shadow-sm hover:bg-white/60 dark:hover:bg-gray-700/50 transition border border-white/20">
            <Bell className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          </button>
          
          <button className="p-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full shadow-sm hover:bg-white/60 dark:hover:bg-gray-700/50 transition border border-white/20">
            <User className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          </button>

          <button onClick={handleLogout} className="p-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full shadow-sm hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 transition border border-white/20">
            <LogOut className="w-5 h-5 text-gray-800 dark:text-gray-200 hover:text-red-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
