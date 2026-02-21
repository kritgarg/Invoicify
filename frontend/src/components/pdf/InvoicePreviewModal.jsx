import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import InvoicePDF from './InvoicePDF';

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFViewer),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div> }
);

export default function InvoicePreviewModal({ invoiceId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const [invRes, orgRes] = await Promise.all([
          api.get(`/invoices/${invoiceId}`),
          api.get('/users/me')
        ]);
        setInvoice(invRes.data);
        if (orgRes.data?.user?.organization?.name) {
          setOrganization({ name: orgRes.data.user.organization.name });
        } else {
          setOrganization({ name: 'Your Company' });
        }
      } catch (err) {
        console.error('Failed to load invoice preview', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/75">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Invoice Preview {invoice ? `- #${invoice.id.slice(-6).toUpperCase()}` : ''}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
              <p>Generating PDF format...</p>
            </div>
          ) : !invoice ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              Failed to load required invoice data.
            </div>
          ) : (
            <PDFViewer width="100%" height="100%" className="border-0">
              <InvoicePDF invoice={invoice} organization={organization} />
            </PDFViewer>
          )}
        </div>
      </div>
    </div>
  );
}
