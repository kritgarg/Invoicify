'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(() => import('@/components/dashboard/RevenueChart'), { 
  ssr: false, 
  loading: () => <div className="h-80 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl"></div> 
});
import { DollarSign, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalRevenue: 0, totalPending: 0, invoiceCount: 0 });
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sumRes, revRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/revenue?range=30d')
        ]);
        setSummary(sumRes.data);
        setRevenue(revRes.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
        <div className="mt-8 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  const stats = [
    { name: 'Total Revenue', value: `$${summary.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { name: 'Total Pending', value: `$${summary.totalPending.toFixed(2)}`, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { name: 'System Invoices', value: summary.invoiceCount, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300">
          Last 30 Days
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="relative bg-white dark:bg-gray-800 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <dt>
              <div className={clsx("absolute rounded-xl p-3", stat.bg)}>
                <stat.icon className={clsx("h-6 w-6", stat.color)} aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
            </dd>
            <div className="absolute bottom-0 inset-x-0 bg-gray-50 dark:bg-gray-800/50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500"> View all<span className="sr-only"> {stat.name} stats</span></a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6">Revenue Trajectory</h2>
        <RevenueChart revenue={revenue} />
      </div>
    </div>
  );
}
