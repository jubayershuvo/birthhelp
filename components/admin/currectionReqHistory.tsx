// app/admin/correction-application-req/appHistory.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, User, FileText, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface Application {
  _id: string;
  ubrn: string;
  dob: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  submit_status: string;
  applicationId: string;
  printLink: string;
  correctionInfos: CorrectionInfo[];
  applicantInfo: ApplicantInfo;
  addresses: Addresses;
  files: File[];
  createdAt: string;
  updatedAt: string;
  isPermAddressIsSameAsBirthPlace: boolean;
  isPrsntAddressIsSameAsPermAddress: boolean;
}

interface CorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
  _id: string;
}

interface ApplicantInfo {
  name: string;
  officeId: number;
  email: string;
  phone: string;
  relationWithApplicant: string;
  _id: string;
}

interface Addresses {
  birthPlace: Address;
  permAddress: Address;
  prsntAddress: Address;
}

interface Address {
  country: string;
  geoId: string;
  division: string;
  divisionName: string;
  district: string;
  districtName: string;
  cityCorpCantOrUpazila: string;
  upazilaName: string;
  paurasavaOrUnion: string;
  unionName: string;
  postOfc: string;
  postOfcEn: string;
  vilAreaTownBn: string;
  vilAreaTownEn: string;
  houseRoadBn: string;
  houseRoadEn: string;
  ward: string;
  wardName: string;
  _id: string;
}

interface File {
  id: string;
  name: string;
  url: string;
  deleteUrl: string;
  attachmentTypeId: string;
  fileType: string;
  _id: string;
}

const AppHistory: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/currection-application-req');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setError(null);
    } catch (err) {
      setError('আবেদন তালিকা লোড করতে সমস্যা হয়েছে');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created':
        return 'খসড়া';
      case 'submitted':
        return 'জমা দেওয়া';
      case 'approved':
        return 'অনুমোদিত';
      case 'rejected':
        return 'বাতিল';
      default:
        return status;
    }
  };

  const getCorrectionFieldName = (key: string) => {
    const fieldMap: { [key: string]: string } = {
      'personBirthDate': 'জন্ম তারিখ',
      'thChild': 'কততম সন্তান',
      'personName': 'নাম',
      'fatherName': 'পিতার নাম',
      'motherName': 'মাতার নাম',
      'birthPlace': 'জন্মস্থান',
      'permanentAddress': 'স্থায়ী ঠিকানা',
      'presentAddress': 'বর্তমান ঠিকানা'
    };
    return fieldMap[key] || key;
  };

  const getCauseText = (cause: string) => {
    const causeMap: { [key: string]: string } = {
      '1': 'ভুল তথ্য',
      '2': 'পরিবর্তন',
      '3': 'অন্যান্য'
    };
    return causeMap[cause] || cause;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">আবেদন তালিকা লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">সমস্যা হয়েছে</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors dark:bg-red-600 dark:hover:bg-red-700"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">কোন আবেদন পাওয়া যায়নি</h2>
          <p className="text-gray-500 dark:text-gray-400">এখনও কোনো জন্ম সংশোধন আবেদন জমা পড়েনি।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          জন্ম সংশোধন আবেদন তালিকা
        </h1>
        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          রিফ্রেশ
        </button>
      </div>
      
      <div className="space-y-4">
        {applications.map((app) => (
          <div
            key={app._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
          >
            {/* Header Section */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{app.ubrn}</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(app.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.submit_status)}`}>
                    {getStatusText(app.submit_status)}
                  </span>
                  <Link
                    href={`/admin/correction-application-req/${app._id}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    বিস্তারিত দেখুন
                  </Link>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Applicant Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    আবেদনকারীর তথ্য
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md space-y-1">
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      <span className="font-medium text-gray-700 dark:text-gray-400">নাম:</span> {app.applicantInfo.name}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      <span className="font-medium text-gray-700 dark:text-gray-400">সম্পর্ক:</span> {app.applicantInfo.relationWithApplicant === 'SELF' ? 'নিজে' : app.applicantInfo.relationWithApplicant}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      <span className="font-medium text-gray-700 dark:text-gray-400">ফোন:</span> {app.applicantInfo.phone || 'দেওয়া নেই'}
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    ব্যবহারকারীর তথ্য
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md space-y-1">
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      <span className="font-medium text-gray-700 dark:text-gray-400">নাম:</span> {app.user.name}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      <span className="font-medium text-gray-700 dark:text-gray-400">ইমেইল:</span> {app.user.email}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      <span className="font-medium text-gray-700 dark:text-gray-400">জন্ম তারিখ:</span> {app.dob}
                    </p>
                  </div>
                </div>

                {/* Correction Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    সংশোধনীর তথ্য
                  </h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md space-y-1">
                    {app.correctionInfos.map((info) => (
                      <div key={info._id} className="text-sm border-b border-yellow-100 dark:border-yellow-800 last:border-0 py-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{getCorrectionFieldName(info.key)}:</span>{' '}
                        <span className="text-gray-700 dark:text-gray-300">{info.value}</span>
                        {info.cause && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">
                            কারণ: {getCauseText(info.cause)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address Summary */}
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    ঠিকানা সংক্ষিপ্তসার
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {app.addresses.birthPlace.divisionName && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-400">জন্মস্থান</p>
                        <p className="text-sm truncate text-gray-900 dark:text-gray-300">{app.addresses.birthPlace.divisionName}</p>
                      </div>
                    )}
                    {app.addresses.permAddress.divisionName && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                        <p className="text-xs font-medium text-green-800 dark:text-green-400">স্থায়ী ঠিকানা</p>
                        <p className="text-sm truncate text-gray-900 dark:text-gray-300">{app.addresses.permAddress.divisionName}</p>
                      </div>
                    )}
                    {app.addresses.prsntAddress.divisionName && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-md">
                        <p className="text-xs font-medium text-purple-800 dark:text-purple-400">বর্তমান ঠিকানা</p>
                        <p className="text-sm truncate text-gray-900 dark:text-gray-300">{app.addresses.prsntAddress.divisionName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Files Summary */}
                {app.files.length > 0 && (
                  <div className="space-y-2 md:col-span-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">সংযুক্ত ফাইল ({app.files.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {app.files.map((file) => (
                        <span
                          key={file._id}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          {file.fileType}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppHistory;