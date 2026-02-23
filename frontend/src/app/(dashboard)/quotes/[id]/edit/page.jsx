'use client';

import { useState, useEffect, use } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import Link from 'next/link';

export default function EditQuotePage({ params }) {
  const router = useRouter();
  const rawParams = use(params);
  const id = rawParams.id;
  
  const currency = useCurrency();
  const [customers, setCustomers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      customerId: '',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      expiryDate: '',
      taxRate: 0,
      status: 'DRAFT',
      items: [{ description: '', quantity: 1, rate: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');
  const watchTaxRate = watch('taxRate');

  // Computed Totals
  const subtotal = watchItems.reduce((acc, item) => acc + (parseFloat(item.quantity || 1) * parseFloat(item.rate || 0)), 0);
  const tax = subtotal * (parseFloat(watchTaxRate || 0) / 100);
  const total = subtotal + tax;

  useEffect(() => {
    const fetchDependenciesAndData = async () => {
      try {
        const [custRes, itemsRes, quoteRes] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/items?limit=100'),
          api.get(`/quotes/${id}`)
        ]);
        
        setCustomers(custRes.data.data);
        setItemsList(itemsRes.data.data);
        
        const quote = quoteRes.data;
        
        // Calculate an approximate tax rate from the total tax and subtotal
        let taxRt = 0;
        if (quote.tax > 0 && quote.subtotal > 0) {
          taxRt = (quote.tax / quote.subtotal) * 100;
        }

        reset({
          customerId: quote.customerId,
          issueDate: quote.issueDate ? format(new Date(quote.issueDate), 'yyyy-MM-dd') : '',
          expiryDate: quote.expiryDate ? format(new Date(quote.expiryDate), 'yyyy-MM-dd') : '',
          taxRate: parseFloat(taxRt.toFixed(2)),
          status: quote.status,
          items: quote.items.length ? quote.items.map(i => ({
            description: i.description,
            quantity: i.quantity,
            rate: i.rate
          })) : [{ description: '', quantity: 1, rate: 0 }]
        });
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error(error);
        alert('Failed to load quote details');
      }
    };
    fetchDependenciesAndData();
  }, [id, reset]);

  const handleItemSelect = (index, selectedItemId) => {
    const item = itemsList.find(i => i.id === selectedItemId);
    if (item) {
      setValue(`items.${index}.description`, item.name);
      setValue(`items.${index}.rate`, item.price);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formattedItems = data.items.map(i => {
        const itemQuantity = parseInt(i.quantity || 1);
        const itemRate = parseFloat(i.rate || 0);
        const itemTax = itemRate * itemQuantity * (parseFloat(data.taxRate || 0) / 100);
        const itemTotal = (itemRate * itemQuantity) + itemTax;
        
        return {
          description: i.description,
          quantity: itemQuantity,
          rate: itemRate,
          tax: itemTax,
          total: itemTotal
        };
      });

      const payload = {
        customerId: data.customerId,
        issueDate: data.issueDate ? new Date(data.issueDate).toISOString() : new Date().toISOString(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
        status: data.status,
        subtotal,
        tax,
        total,
        items: formattedItems
      };

      await api.patch(`/quotes/${id}`, payload);
      router.push(`/quotes/${id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating quote');
      setIsSubmitting(false);
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/quotes/${id}`} className="p-2 bg-white/70 backdrop-blur-3xl rounded-full shadow-sm border border-gray-900/10 hover:bg-white text-gray-500 hover:text-gray-900 transition flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Quotation</h1>
      </div>

      <div className="bg-white/70 backdrop-blur-3xl shadow-sm rounded-[32px] border border-gray-900/10 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Customer <span className="text-red-500">*</span></label>
              <select {...register('customerId', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white text-gray-900 border">
                <option value="">Select a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Issue Date <span className="text-red-500">*</span></label>
              <input type="date" {...register('issueDate', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white text-gray-900 border" />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Valid Until</label>
              <input type="date" {...register('expiryDate')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white text-gray-900 border" />
            </div>
            
            <div className="sm:col-span-1 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select {...register('status')} className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white text-gray-900 border">
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="mt-8">
            <h4 className="text-base font-medium text-gray-900 mb-4 border-b pb-2">Line Items</h4>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start">
                  <div className="w-1/4">
                    <select 
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white text-gray-900 border mb-1"
                    >
                      <option value="">(Select Template Item)</option>
                      {itemsList.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input {...register(`items.${index}.description`, { required: true })} placeholder="Custom description..." className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white text-gray-900 border" />
                  </div>
                  <div className="w-24">
                    <input {...register(`items.${index}.quantity`)} type="number" min="1" step="1" placeholder="Qty" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-2 bg-white text-gray-900 border" />
                  </div>
                  <div className="w-32">
                    <div className="flex bg-white border border-gray-300 rounded-md shadow-sm">
                      <span className="flex items-center pl-3 text-gray-500 sm:text-sm">{getCurrencySymbol(currency)}</span>
                      <input {...register(`items.${index}.rate`)} type="number" min="0" step="0.01" className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0 rounded-none rounded-r-md sm:text-sm py-2 px-2 border-0 bg-transparent text-gray-900" />
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:text-red-700 bg-red-50 rounded-md mt-0.5">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => append({ description: '', quantity: 1, rate: 0 })} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              + Add Another Item
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6 pb-2">
            <div className="flex justify-end">
              <div className="w-64 space-y-3 text-sm">
                <div className="flex justify-between items-end text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <div className="flex items-center">
                    Tax Rate (%)
                    <input {...register('taxRate')} type="number" step="0.1" className="w-16 ml-2 px-1 py-0.5 border border-gray-300 rounded bg-white text-gray-900 text-right" />
                  </div>
                  <span className="font-medium">{formatCurrency(tax, currency)}</span>
                </div>
                <div className="flex justify-between items-end border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t flex justify-end gap-3">
             <Link href={`/quotes/${id}`} className="px-5 py-2.5 bg-white border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
               Cancel
             </Link>
             <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 text-white shadow-sm text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center">
               {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               {isSubmitting ? 'Updating...' : 'Update Quotation'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
