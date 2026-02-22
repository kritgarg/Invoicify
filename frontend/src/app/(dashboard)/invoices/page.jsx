'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '@/lib/api';
import { Plus, Search, Trash2, X, Download, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import clsx from 'clsx';
import InvoicePreviewModal from '@/components/pdf/InvoicePreviewModal';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

export default function InvoicesPage() {
  const currency = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      customerId: '',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 30*24*60*60*1000), 'yyyy-MM-dd'),
      taxRate: 0,
      status: 'DRAFT',
      items: [{ description: '', quantity: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');
  const watchTaxRate = watch('taxRate');

  // Computed Totals
  const subtotal = watchItems.reduce((acc, item) => acc + (parseFloat(item.quantity) * parseFloat(item.price || 0)), 0);
  const tax = subtotal * (parseFloat(watchTaxRate || 0) / 100);
  const total = subtotal + tax;

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices', { params: { status: statusFilter } });
      setInvoices(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, itemsRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/items?limit=100')
      ]);
      setCustomers(custRes.data.data);
      setItemsList(itemsRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const onSubmit = async (data) => {
    try {
      const formattedItems = data.items.map(i => ({
        description: i.description,
        quantity: parseInt(i.quantity),
        price: parseFloat(i.price)
      }));

      const payload = {
        customerId: data.customerId,
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        taxRate: parseFloat(data.taxRate || 0),
        status: data.status,
        items: formattedItems
      };

      if (editingInvoiceId) {
        await api.patch(`/invoices/${editingInvoiceId}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      setIsModalOpen(false);
      setEditingInvoiceId(null);
      reset({
        customerId: '',
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30*24*60*60*1000), 'yyyy-MM-dd'),
        taxRate: 0,
        status: 'DRAFT',
        items: [{ description: '', quantity: 1, price: 0 }]
      });
      fetchInvoices();
    } catch (error) {
      alert('Error saving invoice');
    }
  };

  const openEditModal = async (invoice) => {
    try {
      const { data } = await api.get(`/invoices/${invoice.id}`);
      reset({
        customerId: data.customerId,
        issueDate: format(new Date(data.issueDate), 'yyyy-MM-dd'),
        dueDate: format(new Date(data.dueDate), 'yyyy-MM-dd'),
        taxRate: data.tax > 0 ? (data.tax / data.subtotal) * 100 : 0,
        status: data.status,
        items: data.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          price: i.price
        }))
      });
      setEditingInvoiceId(data.id);
      setIsModalOpen(true);
    } catch (err) {
      alert('Failed to load invoice details');
    }
  };

  const handleItemSelect = (index, selectedItemId) => {
    const item = itemsList.find(i => i.id === selectedItemId);
    if (item) {
      setValue(`items.${index}.description`, item.name);
      setValue(`items.${index}.price`, item.price);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
        <button
          onClick={() => { 
            setEditingInvoiceId(null);
            reset({
              customerId: '',
              issueDate: format(new Date(), 'yyyy-MM-dd'),
              dueDate: format(new Date(Date.now() + 30*24*60*60*1000), 'yyyy-MM-dd'),
              taxRate: 0,
              status: 'DRAFT',
              items: [{ description: '', quantity: 1, price: 0 }]
            });
            setIsModalOpen(true); 
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Create Invoice
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice / Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">#{invoice.id.slice(-6).toUpperCase()}</div>
                  <div className="text-sm text-gray-500">{invoice.customer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.total, currency)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Iss: {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</div>
                  <div className={new Date() > new Date(invoice.dueDate) && invoice.status !== 'PAID' ? "text-red-500" : ""}>
                    Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const isVisualOverdue = invoice.status !== 'PAID' && new Date(invoice.dueDate) < new Date();
                    const displayStatus = isVisualOverdue ? 'OVERDUE' : invoice.status;
                    return (
                      <span className={clsx(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        displayStatus === 'PAID' && "bg-green-100 text-green-800",
                        displayStatus === 'SENT' && "bg-blue-100 text-blue-800",
                        displayStatus === 'OVERDUE' && "bg-red-100 text-red-800",
                        displayStatus === 'DRAFT' && "bg-gray-100 text-gray-800"
                      )}>
                        {displayStatus}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-2">
                    <button 
                      onClick={() => openEditModal(invoice)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setPreviewInvoiceId(invoice.id)}
                      className="inline-flex items-center px-2 py-1 border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 rounded text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && !loading && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No invoices found.</td></tr>
            )}
            {loading && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center text-indigo-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-sm">Loading invoices...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <div className="relative flex flex-col bg-white dark:bg-gray-800 rounded-xl text-left shadow-2xl transform transition-all sm:my-8 w-full max-w-4xl max-h-[90vh] overflow-hidden" role="dialog">
              <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{editingInvoiceId ? 'Edit Invoice' : 'Create Invoice'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <form id="invoiceForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                      <select {...register('customerId', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border">
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                      <input type="date" {...register('issueDate')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border" />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                      <input type="date" {...register('dueDate')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border" />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select {...register('status')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border">
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="PAID">Paid</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Line Items</h4>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-3 items-start">
                          <div className="w-1/4">
                            <select 
                              onChange={(e) => handleItemSelect(index, e.target.value)}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border mb-1"
                            >
                              <option value="">(Template Item)</option>
                              {itemsList.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                          </div>
                          <div className="flex-1">
                            <input {...register(`items.${index}.description`, { required: true })} placeholder="Custom description..." className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-transparent text-gray-900 dark:text-white border" />
                          </div>
                          <div className="w-24">
                            <input {...register(`items.${index}.quantity`)} type="number" min="1" step="0.01" placeholder="Qty" className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-2 bg-transparent text-gray-900 dark:text-white border" />
                          </div>
                          <div className="w-32">
                            <div className="flex bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                              <span className="flex items-center pl-3 text-gray-500 sm:text-sm">{getCurrencySymbol(currency)}</span>
                              <input {...register(`items.${index}.price`)} type="number" min="0" step="0.01" className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0 rounded-none rounded-r-md sm:text-sm py-2 px-2 border-0 bg-transparent text-gray-900 dark:text-white" />
                            </div>
                          </div>
                          <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 rounded-md">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => append({ description: '', quantity: 1, price: 0 })} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      + Add Item
                    </button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 pb-8">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-3 text-sm">
                        <div className="flex justify-between items-end text-gray-700 dark:text-gray-300">
                          <span>Subtotal</span>
                          <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            Tax 
                            <input {...register('taxRate')} type="number" step="0.1" className="w-16 ml-2 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-right" />%
                          </div>
                          <span className="font-medium">{formatCurrency(tax, currency)}</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-gray-200 dark:border-gray-600 pt-3 text-lg font-bold text-gray-900 dark:text-white">
                          <span>Total</span>
                          <span>{formatCurrency(total, currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </form>
              </div>
              
              <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" form="invoiceForm" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Save Invoice
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewInvoiceId && (
        <InvoicePreviewModal 
          invoiceId={previewInvoiceId} 
          onClose={() => setPreviewInvoiceId(null)} 
        />
      )}
    </div>
  );
}
