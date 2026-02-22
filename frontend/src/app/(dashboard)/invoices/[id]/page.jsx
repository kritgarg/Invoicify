'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Download, Plus, Trash2, Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import clsx from 'clsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '@/components/pdf/InvoicePDF';
import { useForm } from 'react-hook-form';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

export default function InvoiceDetailPage() {
  const currency = useCurrency();
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [invRes, orgRes] = await Promise.all([
        api.get(`/invoices/${params.id}`),
        api.get('/auth/me')
      ]);
      setInvoice(invRes.data);
      if (orgRes.data?.user?.organization) {
        setOrganization({ 
            name: orgRes.data.user.organization.name || 'Your Company',
            currency: orgRes.data.user.organization.currency || 'USD'
        });
      }
    } catch (err) {
      console.error('Failed to load invoice', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchDetails();
    }
  }, [params.id]);

  const onAddPayment = async (data) => {
    try {
      await api.post(`/invoices/${params.id}/payments`, {
        amount: parseFloat(data.amount),
        method: data.method
      });
      setIsPaymentModalOpen(false);
      reset();
      fetchDetails();
    } catch (err) {
      alert('Failed to add payment.');
    }
  };

  const onDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await api.delete(`/payments/${paymentId}`);
      fetchDetails();
    } catch (err) {
      alert('Failed to delete payment.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2">Loading invoice details...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-gray-600">Invoice not found.</h2>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600">Go Back</button>
      </div>
    );
  }

  // Visual Overdue Override
  const isVisualOverdue = invoice.status !== 'PAID' && new Date(invoice.dueDate) < new Date();
  const displayStatus = isVisualOverdue ? 'OVERDUE' : invoice.status;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/invoices" className="text-gray-500 hover:text-gray-700:text-gray-300">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Invoice #{invoice.id.slice(-6).toUpperCase()}
          </h1>
          <span className={clsx(
            "px-2.5 py-1 text-xs font-semibold rounded-full",
            displayStatus === 'PAID' && "bg-green-100 text-green-800",
            displayStatus === 'SENT' && "bg-blue-100 text-blue-800",
            displayStatus === 'OVERDUE' && "bg-red-100 text-red-800",
            displayStatus === 'DRAFT' && "bg-gray-100 text-gray-800"
          )}>
            {displayStatus}
          </span>
        </div>
        <div className="flex space-x-3">
          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} organization={organization} />}
            fileName={`Invoice-${invoice.id.slice(-6).toUpperCase()}.pdf`}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50:bg-gray-700 focus:outline-none"
          >
            {({ blob, url, loading, error }) => loading ? 'Generating PDF...' : (
              <>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-3xl shadow-sm rounded-[32px] overflow-hidden border border-gray-900/10 p-8">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Bill To</h3>
            <p className="text-lg font-bold text-gray-900">{invoice.customer.name}</p>
            <p className="text-sm text-gray-600">{invoice.customer.email}</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.customer.address}</p>
          </div>
          <div className="text-right text-sm">
            <div className="mb-2">
              <span className="text-gray-500 mr-2">Issue Date:</span>
              <span className="font-medium text-gray-900">{format(new Date(invoice.issueDate), 'MMM d, yyyy')}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-2">Due Date:</span>
              <span className="font-medium text-gray-900">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200 mb-8">
          <thead>
            <tr>
              <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-4 text-sm text-gray-900">{item.description}</td>
                <td className="py-4 text-sm text-right text-gray-900">{item.quantity}</td>
                <td className="py-4 text-sm text-right text-gray-900">{formatCurrency(item.price, currency)}</td>
                <td className="py-4 text-sm text-right font-medium text-gray-900">{formatCurrency(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-200">
            <tr>
              <td colSpan="3" className="py-3 text-right text-sm font-medium text-gray-500">Subtotal:</td>
              <td className="py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(invoice.subtotal, currency)}</td>
            </tr>
            {invoice.tax > 0 && (
              <tr>
                <td colSpan="3" className="py-3 text-right text-sm font-medium text-gray-500">Tax:</td>
                <td className="py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(invoice.tax, currency)}</td>
              </tr>
            )}
            <tr>
              <td colSpan="3" className="py-3 text-right text-base font-bold text-gray-900">Total:</td>
              <td className="py-3 text-right text-base font-bold text-indigo-600">{formatCurrency(invoice.total, currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-white/70 backdrop-blur-3xl shadow-sm rounded-[32px] overflow-hidden border border-gray-900/10">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Payment
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {invoice.payments?.length > 0 ? invoice.payments.map((payment) => (
            <li key={payment.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50:bg-gray-700/50">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount, currency)}</p>
                  <p className="text-xs text-gray-500">{format(new Date(payment.paymentDate), 'MMM d, yyyy h:mm a')} • {payment.method}</p>
                </div>
              </div>
              <button onClick={() => onDeletePayment(payment.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          )) : (
            <li className="px-6 py-8 text-center text-sm text-gray-500">No payments recorded.</li>
          )}
        </ul>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsPaymentModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white/90 backdrop-blur-3xl rounded-[32px] border border-gray-900/10 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onAddPayment)}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Record Payment</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input type="number" step="0.01" {...register('amount', { required: true })} className="mt-1 block w-full rounded border-gray-300 bg-white shadow-sm focus:ring-indigo-500 py-2 px-3 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Method</label>
                      <select {...register('method', { required: true })} className="mt-1 block w-full rounded border-gray-300 bg-white shadow-sm focus:ring-indigo-500 py-2 px-3 border">
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="CASH">Cash</option>
                        <option value="PAYPAL">PayPal</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    Save Payment
                  </button>
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50:bg-gray-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
