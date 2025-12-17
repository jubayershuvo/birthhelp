'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Certificate {
  _id: string;
  registrationDate: string;
  issuanceDate: string;
  dateOfBirth: string;
  birthRegNumber: string;
  personNameBn: string;
  sex: string;
  certificateNumber: string;
  createdAt: string;
  motherNameBn: string;
  fatherNameBn: string;
  birthPlaceBn: string;
}

interface CertificateHistoryProps {
  initialCertificates?: Certificate[];
}

export default function CertificateHistory({ initialCertificates = [] }: CertificateHistoryProps) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>(initialCertificates);
  const [loading, setLoading] = useState(!initialCertificates.length);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');

  // Fetch certificates on mount
  useEffect(() => {
    if (!initialCertificates.length) {
      fetchCertificates();
    }
  }, []);

  // Apply filters whenever search term, gender filter, or certificates change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, genderFilter, certificates]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/birth/certificate/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch certificate history');
      }
      
      const data = await response.json();
      setCertificates(data.history || []);
      setFilteredCertificates(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...certificates];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cert =>
        cert.personNameBn.toLowerCase().includes(term) ||
        cert.birthRegNumber.toLowerCase().includes(term) ||
        cert.certificateNumber.toLowerCase().includes(term) ||
        cert.motherNameBn.toLowerCase().includes(term) ||
        cert.fatherNameBn.toLowerCase().includes(term) ||
        cert.birthPlaceBn.toLowerCase().includes(term)
      );
    }

    // Apply gender filter
    if (genderFilter !== 'ALL') {
      filtered = filtered.filter(cert => cert.sex === genderFilter);
    }

    setFilteredCertificates(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleGenderFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGenderFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter('ALL');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Error loading certificates
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  <p>{error}</p>
                </div>
                <button
                  onClick={fetchCertificates}
                  className="mt-3 text-sm font-medium text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200"
                >
                  Try again →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Birth Certificate History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {filteredCertificates.length} of {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} shown
              </p>
            </div>
            <Link
              href="/birth/certificate/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New
            </Link>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Certificates
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by name, registration number, parent name..."
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label htmlFor="gender-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Gender
              </label>
              <select
                id="gender-filter"
                value={genderFilter}
                onChange={handleGenderFilterChange}
                className="w-full md:w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              >
                <option value="ALL">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No certificates found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No certificates match your search criteria.
            </p>
            <div className="mt-6">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow duration-300"
              >
                <div className="p-6">
                  {/* Main Info Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {certificate.personNameBn}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Created on {formatDate(certificate.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        certificate.sex === 'FEMALE' 
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {certificate.sex}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs font-medium">
                        {certificate.certificateNumber}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Date</p>
                      <p className="text-gray-900 dark:text-white">{certificate.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration No</p>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">{certificate.birthRegNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mother</p>
                      <p className="text-gray-900 dark:text-white">{certificate.motherNameBn}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Father</p>
                      <p className="text-gray-900 dark:text-white">{certificate.fatherNameBn}</p>
                    </div>
                  </div>

                  {/* Birth Place and Action Buttons */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Place</p>
                      <p className="text-gray-900 dark:text-white">{certificate.birthPlaceBn}</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Link
                        href={`/birth/certificate/edit/${certificate._id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <Link
                        href={`/birth/certificate/pdf/${certificate._id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}