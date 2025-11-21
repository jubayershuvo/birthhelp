'use client';

import { useState, useEffect } from 'react';

interface Service {
  _id: string;
  id: string;
  name: string;
  fee: number;
  href: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ServiceItem {
  service: Service;
  fee: number;
  _id: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto p-6 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error}</p>
            <button
              onClick={fetchServices}
              className="mt-4 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Services</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View all available services for you.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((item) => (
            <div
              key={item._id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:border-green-400 dark:hover:border-green-500/50"
            >
              <div className="p-6">
                {/* Service Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{item.service.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {item.service.id}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                </div>

                {/* Fee Information */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Current Fee:</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(item.fee + item.service.fee)}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>{formatDate(item.service.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <a
                    href={item.service.href}
                    className="flex-1 text-center py-2 px-4 rounded-lg transition-colors bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                  >
                    Use
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {services.length === 0 && !loading && (
          <div className="text-center py-16 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Services Found</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              There are no services available at the moment.
            </p>
            <button
              onClick={fetchServices}
              className="px-6 py-3 rounded-lg transition-colors bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium"
            >
              Refresh Services
            </button>
          </div>
        )}
      </main>
    </div>
  );
}