'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, setValue } = useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/me');
      if (data.user?.role !== 'admin') {
        window.location.href = '/dashboard'; // Redirect non-admins
      }
      if (data.user?.organization?.name) {
        setValue('organizationName', data.user.organization.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      setMessage(null);
      await api.patch('/users/organization', { name: data.organizationName });
      setMessage({ type: 'success', text: 'Organization details updated successfully. They will now appear on all generated invoices.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update organization settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your business and organization details.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Organization Details</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This information is displayed publicly on elements like your invoice PDFs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Organization Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="organizationName"
                  {...register('organizationName', { required: true })}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
