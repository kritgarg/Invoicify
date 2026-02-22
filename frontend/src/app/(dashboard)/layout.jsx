'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession } from '@/lib/auth';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Define route access permissions
// If a route prefix isn't in this list, it defaults to allowing both admin and staff.
const ROUTE_PERMISSIONS = {
  '/dashboard': ['admin'],
  '/reports': ['admin'],
  '/users': ['admin'],
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      await api.post('/auth/sign-out');
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/login';
  };

  useEffect(() => {
    getSession().then((session) => {
      if (!session?.user) {
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user?.isDeactivated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account has been deactivated. Please contact your administrator.
          </p>
          <button 
            onClick={handleSignOut}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Sign out & Return
          </button>
        </div>
      </div>
    );
  }

  // Check if current user role has access to the current route
  const currentRole = user?.role || 'staff';
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  const requiredRoles = matchedRoute ? ROUTE_PERMISSIONS[matchedRoute] : ['admin', 'staff'];
  const hasAccess = requiredRoles.includes(currentRole);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            {hasAccess ? (
              children
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You do not have permission to view this page.
                </p>
                <Link 
                  href="/customers"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Go Home
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
