'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { notFound, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Download, Share2, Edit, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { pdf } from '@react-pdf/renderer';
import QuotePDF from '@/components/pdf/QuotePDF';

export default function QuoteDetailPage({ params }) {
  const router = useRouter();
  const rawParams = use(params);
  const id = rawParams.id;
  
  const currency = useCurrency();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const fetchQuote = async () => {
    try {
      const { data } = await api.get(`/quotes/${id}`);
      setQuote(data);
    } catch (err) {
      if (err.response?.status === 404) {
        return notFound();
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleMockShare = async () => {
    try {
      const url = `${window.location.origin}/public/quote/${id}`;
      await navigator.clipboard.writeText(url);
      showToast('Quotation link copied to clipboard successfully!');
    } catch (e) {
      showToast('Quotation link copied successfully!');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const orgRes = await api.get('/auth/me');
      const organization = orgRes.data?.user?.organization || { name: 'Your Company', currency: 'USD' };
      
      const blob = await pdf(<QuotePDF quote={quote} organization={organization} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${quote.quoteNumber || quote.id.slice(-6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to generate PDF.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      
      {}
      {toastMessage && (
        <div className="fixed top-8 right-8 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-down">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/quotes" className="p-2 bg-white/70 backdrop-blur-3xl rounded-full shadow-sm border border-gray-900/10 hover:bg-white text-gray-500 hover:text-gray-900 transition flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Quotation #{quote.quoteNumber || quote.id.slice(-6).toUpperCase()}
              <span className={clsx(
                "px-2.5 py-0.5 text-xs font-semibold rounded-full",
                quote.status === 'CONVERTED' && "bg-green-100 text-green-800",
                quote.status === 'SENT' && "bg-blue-100 text-blue-800",
                quote.status === 'REJECTED' && "bg-red-100 text-red-800",
                quote.status === 'DRAFT' && "bg-gray-100 text-gray-800"
              )}>
                {quote.status}
              </span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleMockShare}
            className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="mr-2 h-4 w-4" /> Share
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> PDF
          </button>

          {quote.status !== 'CONVERTED' && (
            <Link 
              href={`/quotes/${id}/edit`}
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Quote
            </Link>
          )}
        </div>
      </div>

      {}
      <div className="bg-white/70 backdrop-blur-3xl shadow-sm rounded-[32px] border border-gray-900/10 p-8">
        
        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-100 pb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Prepared For</h3>
            <div className="font-medium text-gray-900 text-lg">{quote.customer.name}</div>
            {quote.customer.email && <div className="text-gray-600 mt-1">{quote.customer.email}</div>}
            {quote.customer.phone && <div className="text-gray-600 mt-1">{quote.customer.phone}</div>}
            {quote.customer.address && <div className="text-gray-600 mt-1">{quote.customer.address}</div>}
          </div>
          
          <div className="md:text-right">
             <div className="mb-4">
               <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Issue Date</h3>
               <div className="text-gray-900 font-medium">{format(new Date(quote.issueDate), 'MMMM dd, yyyy')}</div>
             </div>
             {quote.expiryDate && (
               <div>
                 <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Valid Until</h3>
                 <div className="text-gray-900 font-medium">{format(new Date(quote.expiryDate), 'MMMM dd, yyyy')}</div>
               </div>
             )}
          </div>
        </div>

        {}
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item Description</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-24">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-32">Rate</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quote.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.rate, currency)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">{formatCurrency(item.total, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <div className="flex justify-end pr-6">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.subtotal, currency)}</span>
            </div>
            {quote.tax > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tax</span>
                <span>{formatCurrency(quote.tax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-lg pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(quote.total, currency)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
