'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

export default function QuotesPage() {
  const currency = useCurrency();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchQuotes = async () => {
    try {
      const { data } = await api.get('/quotes', { params: { status: statusFilter } });
      setQuotes(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <Link
          href="/quotes/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Create Quote
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="CONVERTED">Converted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-white/70 backdrop-blur-3xl shadow-sm rounded-[32px] overflow-hidden border border-gray-900/10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote / Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{quote.quoteNumber || quote.id.slice(-6).toUpperCase()}</div>
                  <div className="text-sm text-gray-500">{quote.customer?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(quote.total, currency)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Iss: {format(new Date(quote.issueDate), 'MMM dd, yyyy')}</div>
                  {quote.expiryDate && (
                    <div>Exp: {format(new Date(quote.expiryDate), 'MMM dd, yyyy')}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quote.createdBy?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                    quote.status === 'CONVERTED' && "bg-green-100 text-green-800",
                    quote.status === 'SENT' && "bg-blue-100 text-blue-800",
                    quote.status === 'REJECTED' && "bg-red-100 text-red-800",
                    quote.status === 'DRAFT' && "bg-gray-100 text-gray-800"
                  )}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link 
                    href={`/quotes/${quote.id}`}
                    className="inline-flex items-center px-4 py-1.5 border border-indigo-600 text-indigo-600 rounded text-xs hover:bg-indigo-50 font-medium transition-colors"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && !loading && (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No quotes found.</td></tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center text-indigo-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-sm">Loading quotes...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
