'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(() => import('@/components/dashboard/RevenueChart'), { 
  ssr: false, 
  loading: () => <div className="h-80 w-full animate-pulse bg-white/50 backdrop-blur-md rounded-xl border border-gray-900/10"></div> 
});
import { Banknote, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

export default function Dashboard() {
  const currency = useCurrency();
  const [summary, setSummary] = useState({ totalRevenue: 0, totalPending: 0, invoiceCount: 0 });
  const [revenue, setRevenue] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sumRes, revRes, userRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/revenue?range=30d'),
          api.get('/auth/me')
        ]);
        setSummary(sumRes.data);
        setRevenue(revRes.data);
        setUser(userRes.data?.user);
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
      <div className="space-y-6 animate-pulse px-4 md:px-0">
        <div className="h-12 bg-white/50 backdrop-blur-md border border-gray-900/10 rounded-xl w-1/3 mb-10"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white/50 backdrop-blur-md border border-gray-900/10 rounded-3xl"></div>
          ))}
        </div>
        <div className="mt-8 h-96 bg-white/50 backdrop-blur-md border border-gray-900/10 rounded-3xl"></div>
      </div>
    );
  }

  const stats = [
    { name: 'Total Revenue', value: formatCurrency(summary.totalRevenue, currency), icon: Banknote, color: 'text-[#8c7435]', bg: 'bg-[#fae6b1]/50' },
    { name: 'Total Pending', value: formatCurrency(summary.totalPending, currency), icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-200/50' },
    { name: 'System Invoices', value: summary.invoiceCount, icon: FileText, color: 'text-gray-700', bg: 'bg-gray-200/50' },
  ];

  return (
    <div className="space-y-10 px-4 md:px-0">
      <div className="flex flex-col mb-8 mt-4 whitespace-pre-wrap">
        <h1 className="text-5xl md:text-6xl font-light text-gray-900 tracking-tight">
          Welcome in, <span className="font-medium">{user?.name?.split(' ')[0] || 'Admin'}</span>
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="relative bg-white/70 backdrop-blur-3xl px-6 py-8 shadow-sm rounded-[32px] border border-gray-900/10 hover:shadow-lg hover:bg-white/90 transition-all duration-300">
            <dt>
              <div className={clsx("absolute top-6 right-6 rounded-full p-4", stat.bg)}>
                <stat.icon className={clsx("h-6 w-6", stat.color)} aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-gray-600 mt-2">{stat.name}</p>
            </dt>
            <dd className="mt-4 flex items-baseline">
              <p className="text-4xl font-semibold text-[#1c1c1c] tracking-tight">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 bg-white/70 backdrop-blur-3xl p-8 rounded-[32px] shadow-sm border border-gray-900/10">
        <h2 className="text-xl font-medium text-[#1c1c1c] mb-8">Revenue Trajectory</h2>
        <div className="h-80 w-full">
          <RevenueChart revenue={revenue} />
        </div>
      </div>
    </div>
  );
}
