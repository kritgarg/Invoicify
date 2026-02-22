'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      // Create Organization + Admin User via backend
      await api.post('/auth/sign-up/email', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      // Optionally create an organization immediately for them:
      // await api.post('/auth/organization/create', { name: `${data.name}'s Org`, slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') });
      
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Join to start managing invoices</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                {...register('name')}
                suppressHydrationWarning
                type="text"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                {...register('email')}
                suppressHydrationWarning
                type="email"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                {...register('password')}
                suppressHydrationWarning
                type="password"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Creating Account...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
