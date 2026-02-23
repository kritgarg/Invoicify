'use client';

import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  PieChart, 
  Settings,
  LogOut,
  UserCog
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import api from '@/lib/api';

const INVOICE_ROUTES = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'staff'] },
  { name: 'Items', href: '/items', icon: Package, roles: ['admin', 'staff'] },
  { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['admin', 'staff'] },
  { name: 'Quotations', href: '/quotes', icon: FileText, roles: ['admin', 'staff'] },
  { name: 'Reports', href: '/reports', icon: PieChart, roles: ['admin'] },
  { name: 'User Management', href: '/users', icon: UserCog, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const userRole = user?.role || 'staff';

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
      window.location.href = '/login'; 
    }
  };

  return (
    <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-800 text-gray-300">
      <div className="flex items-center justify-center space-x-2 h-16 bg-gray-950 px-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold font-sans tracking-tight text-white">Invoicify</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {INVOICE_ROUTES.map((route) => {
            if (!route.roles.includes(userRole)) return null;

            const active = pathname === route.href || pathname.startsWith(route.href + '/');
            const Icon = route.icon;

            return (
              <Link 
                key={route.name}
                href={route.href} 
                className={clsx(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  active 
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className={clsx("mr-3 h-5 w-5", active ? "text-white" : "text-gray-400 group-hover:text-white")} />
                {route.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800 space-y-4">
        <div className="flex items-center px-2">
          <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-300 uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
