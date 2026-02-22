'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

const COLORS = {
  PAID: '#10b981',   // emerald-500
  DRAFT: '#6b7280',  // gray-500
  SENT: '#3b82f6',   // blue-500
  OVERDUE: '#ef4444' // red-500
};

export default function ReportsPage() {
  const currency = useCurrency();
  const [range, setRange] = useState('30d');
  const [invoiceStatusData, setInvoiceStatusData] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sumRes, invRes] = await Promise.all([
        api.get(`/dashboard/revenue?range=${range}`),
        // Since we don't have a direct "status counts" endpoint, we aggregate logically locally from a large pull
        api.get('/invoices?limit=1000') 
      ]);

      // Calculate total revenue from timeseries range payload
      setRevenue(sumRes.data.reduce((acc, obj) => acc + obj.revenue, 0));

      // Build Pie Chart locally based on invoices (this could be shifted back safely later)
      const allInvoices = invRes.data.data;
      const counts = { PAID: 0, DRAFT: 0, SENT: 0, OVERDUE: 0 };
      allInvoices.forEach(i => {
        if (counts[i.status] !== undefined) counts[i.status]++;
      });

      const pieData = Object.keys(counts).map(key => ({
        name: key,
        value: counts[key]
      })).filter(d => d.value > 0);

      setInvoiceStatusData(pieData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">Reports &amp; Analytics</h1>
        
        <div className="flex items-center space-x-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl p-2 border border-white/50 dark:border-white/10 rounded-full shadow-sm">
          <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Revenue Summary */}
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl p-8 rounded-[32px] shadow-sm border border-white/50 dark:border-white/10 hover:shadow-lg hover:bg-white/50 transition-all duration-300">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2 pb-4 border-b border-gray-100 dark:border-gray-700">
            Total Revenue ({range === 'all' ? 'All Time' : `Last ${range.replace('d', ' Days')}`})
          </h2>
          <div className="mt-6 flex flex-col justify-center items-center h-48">
            <span className="text-gray-500 dark:text-gray-400 text-sm mb-2">Collected Income</span>
            {loading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-32 rounded"></div>
            ) : (
              <span className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(revenue, currency)}</span>
            )}
          </div>
        </div>

        {/* Invoice Status Distribution */}
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl p-8 rounded-[32px] shadow-sm border border-white/50 dark:border-white/10 hover:shadow-lg hover:bg-white/50 transition-all duration-300">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Invoice Status Distribution</h2>
          <div className="h-64">
            {invoiceStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No invoice data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
