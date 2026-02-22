'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { Plus, UserX, Shield, Users as UsersIcon, X, UserCheck } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || []); // Assuming standard array payload, checking endpoint design
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/users', data);
      setIsModalOpen(false);
      reset();
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving user');
    }
  };

  const handleDeactivate = async (id) => {
    if (confirm('Are you sure you want to deactivate this user? They will lose access immediately.')) {
      try {
        await api.patch(`/users/${id}/deactivate`);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to deactivate');
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/users/${id}/activate`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to activate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => { reset(); setIsModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Staff Member
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-3xl shadow-sm rounded-[32px] overflow-hidden border border-gray-900/10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className={clsx("transition-colors", !user.isActive && "bg-gray-50 opacity-50")}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase">{user.name[0]}</span>
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500 ml-10">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1",
                    user.role === 'admin' ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  )}>
                    {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UsersIcon className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                    user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {user.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.role !== 'admin' && (
                    user.isActive ? (
                      <button onClick={() => handleDeactivate(user.id)} className="text-red-600 hover:text-red-900:text-red-400 flex items-center gap-1 justify-end ml-auto">
                        <UserX className="h-4 w-4" /> Deactivate
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(user.id)} className="text-green-600 hover:text-green-900:text-green-400 flex items-center gap-1 justify-end ml-auto">
                        <UserCheck className="h-4 w-4" /> Activate
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                  Loading users...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <div className="relative bg-white/90 backdrop-blur-3xl rounded-[32px] border border-gray-900/10 px-4 pt-5 pb-4 text-left shadow-2xl transform transition-all sm:my-8 w-full max-w-lg sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Invite New Staff Member
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">Staff members will have access to create and manage customers and invoices, but cannot view reports or manage other users.</p>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input {...register('name', { required: true })} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-transparent !text-gray-900 dark:!text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input {...register('email', { required: true })} type="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-transparent !text-gray-900 dark:!text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                      <input {...register('password', { required: true, minLength: 8 })} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-transparent !text-gray-900 dark:!text-white" />
                      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters.</p>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Create Staff
                      </button>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 sm:mt-0 sm:w-auto sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Cancel
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
