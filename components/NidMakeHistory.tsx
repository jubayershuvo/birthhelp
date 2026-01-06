'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Edit, FileText } from 'lucide-react';
import Link from 'next/link';

type Address = {
  division: string;
  district: string;
  rmo: string;
  city_corporation_or_municipality: string;
  upozila: string;
  union_ward: string;
  mouza_moholla: string;
  additional_mouza_moholla: string;
  ward_for_union_porishod: string;
  village_road: string;
  additional_village_road: string;
  home_holding_no: string;
  post_office: string;
  postal_code: string;
  region: string;
  _id: string;
};

type HistoryItem = {
  _id: string;
  citizen_status: string;
  nid: string;
  pincode: string;
  status: string;
  afis_status: string;
  lock_flag: string;
  voter_no: string;
  form_no: string;
  sl_no: string;
  tag: string;
  name_bn: string;
  name_en: string;
  dob: string;
  birth_place: string;
  birth_other: string;
  birth_reg_no: string;
  father_name: string;
  mother_name: string;
  spouse_name: string;
  gender: string;
  marital_status: string;
  occupation: string;
  disability: string;
  disability_other: string;
  present_address: Address;
  permanent_address: Address;
  education: string;
  blood_group: string;
  religion: string;
  present_address_full: string;
  permanent_address_full: string;
  addresses_same: boolean;
  tin: string;
  driving_lic: string;
  passport: string;
  laptop_id: string;
  father_nid: string;
  mother_nid: string;
  spouse_nid: string;
  father_voter_no: string;
  mother_voter_no: string;
  spouse_voter_no: string;
  phone: string;
  mobile: string;
  email: string;
  religion_other: string;
  father_death_date: string;
  mother_death_date: string;
  spouse_death_date: string;
  no_finger: number;
  no_finger_print: number;
  voter_area: string;
  voter_at: string;
  __v: number;
  barcode: string;
  photo: string;
  signature: string;
  user: string;
  createdAt?: string;
  updatedAt?: string;
};

type HistoryResponse = {
  history: HistoryItem[];
};

export default function NidHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/nid/history')
      .then(res => res.json())
      .then((res: HistoryResponse) => {
        setHistory(res.history || []);
        // All items initially collapsed
        setExpandedItems(new Set());
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set(history.map(item => item._id));
    setExpandedItems(allIds);
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading NID history...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            NID Application History
          </h1>
          
          {history.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={expandAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {history.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            No NID history available
          </p>
        )}

        <div className="space-y-4">
          {history.map((item, index) => {
            const isExpanded = expandedItems.has(item._id);
            
            return (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleItem(item._id)}
                  className="w-full p-4 sm:p-6 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                    
                    <div className="text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {item.name_en} ({item.name_bn})
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={item.status} />
                          <StatusBadge status={item.citizen_status} label="Citizen" />
                        </div>
                      </div>
                      
                      <div className="mt-1 flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>NID: {item.nid}</span>
                        <span>Voter ID: {item.voter_no}</span>
                        <span>Entry #{index + 1}</span>
                        {item.createdAt && (
                          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/nid/edit/${item._id}`}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                    
                    <Link
                      href={`/nid/pdf/${item._id}`}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </Link>
                  </div>
                </button>

                {/* Expandable Content - Initially hidden */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 pt-0 space-y-6">
                    {/* Basic Information */}
                    <Section title="Basic Information">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Info label="NID Number" value={item.nid} />
                        <Info label="Voter ID" value={item.voter_no} />
                        <Info label="Birth Registration" value={item.birth_reg_no} />
                        <Info label="Pincode" value={item.pincode} />
                      </div>
                    </Section>

                    {/* Personal Details */}
                    <Section title="Personal Details">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Info label="Name (English)" value={item.name_en} />
                        <Info label="Name (Bengali)" value={item.name_bn} />
                        <Info label="Date of Birth" value={item.dob} />
                        <Info label="Gender" value={item.gender} />
                        <Info label="Marital Status" value={item.marital_status} />
                        <Info label="Occupation" value={item.occupation} />
                        <Info label="Father's Name" value={item.father_name} />
                        <Info label="Mother's Name" value={item.mother_name} />
                        <Info label="Spouse's Name" value={item.spouse_name} />
                        <Info label="Blood Group" value={item.blood_group} />
                        <Info label="Religion" value={item.religion} />
                        <Info label="Education" value={item.education} />
                      </div>
                    </Section>

                    {/* Contact Information */}
                    <Section title="Contact Information">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Info label="Mobile" value={item.mobile} />
                        <Info label="Phone" value={item.phone} />
                        <Info label="Email" value={item.email} />
                        <Info label="TIN" value={item.tin} />
                      </div>
                    </Section>

                    {/* Address Section */}
                    <Section title="Address Information">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Present Address */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Present Address
                          </h4>
                          <div className="space-y-3">
                            <AddressField label="Division" value={item.present_address.division} />
                            <AddressField label="District" value={item.present_address.district} />
                            <AddressField label="Upozila" value={item.present_address.upozila} />
                            <AddressField label="Union/Ward" value={item.present_address.union_ward} />
                            <AddressField label="Post Office" value={item.present_address.post_office} />
                            <AddressField label="Postal Code" value={item.present_address.postal_code} />
                          </div>
                        </div>

                        {/* Permanent Address */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              Permanent Address
                            </h4>
                            {item.addresses_same && (
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                Same as Present
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <AddressField label="Division" value={item.permanent_address.division} />
                            <AddressField label="District" value={item.permanent_address.district} />
                            <AddressField label="Upozila" value={item.permanent_address.upozila} />
                            <AddressField label="Union/Ward" value={item.permanent_address.union_ward} />
                            <AddressField label="Post Office" value={item.permanent_address.post_office} />
                            <AddressField label="Postal Code" value={item.permanent_address.postal_code} />
                          </div>
                        </div>
                      </div>
                    </Section>

                    {/* Additional Information */}
                    <Section title="Additional Information">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Info label="Disability" value={item.disability} />
                        <Info label="Passport" value={item.passport} />
                        <Info label="Driving License" value={item.driving_lic} />
                        <Info label="AFIS Status" value={item.afis_status} />
                        <Info label="Voter Area" value={item.voter_area} />
                        <Info label="Form Number" value={item.form_no} />
                        <Info label="Lock Flag" value={item.lock_flag} />
                        <Info label="Tag" value={item.tag} />
                        <Info label="Serial No" value={item.sl_no} />
                      </div>
                    </Section>

                    {/* Footer with action buttons */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p>Created by user: {item.user}</p>
                        {item.createdAt && (
                          <p>Created at: {new Date(item.createdAt).toLocaleString()}</p>
                        )}
                        {item.updatedAt && (
                          <p>Updated at: {new Date(item.updatedAt).toLocaleString()}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/edit/${item._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Record
                        </Link>
                        
                        <Link
                          href={`/pdf/${item._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-700 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Generate PDF
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Reusable Components */

function Section({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100 break-all">
        {value || 'N/A'}
      </p>
    </div>
  );
}

function AddressField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}: </span>
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {value || 'N/A'}
      </span>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('checked') || lowerStatus.includes('citizen') || lowerStatus.includes('unlocked')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('locked')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
    if (lowerStatus.includes('rejected') || lowerStatus.includes('no_match')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {label ? `${label}: ${status}` : status}
    </span>
  );
}