"use client";
import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Download,
  FileText,
  Filter,
  Search,
  User,
  Home,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Printer,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Loader2,
  ExternalLink,
  Shield,
  Users,
  Baby,
  FileCheck
} from 'lucide-react';

// ==================== Types ====================
export interface Attachment {
  id: number;
  name: string;
  type: string;
  size: number;
  _id: string;
}

export interface PersonInfoForBirth {
  personFirstNameBn: string;
  personLastNameBn: string;
  personNameBn: string;
  personFirstNameEn: string;
  personLastNameEn: string;
  personNameEn: string;
  personBirthDate: string;
  thChild: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  religion: string;
  religionOther: string;
  personNid: string;
  _id: string;
}

export interface ParentInfo {
  personNameBn: string;
  personNameEn: string;
  personNationality: string;
  personNid: string;
  passportNumber: string;
  ubrn: string;
  personBirthDate: string;
  _id: string;
}

export interface Application {
  _id: string;
  csrf: string;
  otp: string;
  user: string;
  status: 'submitted' | 'pending' | 'approved' | 'rejected' | 'processing';
  applicationId: string;
  printLink: string;
  cost: number;
  lastDate: string;
  cookies: string[];
  officeAddressType: 'PERMANENT' | 'BIRTHPLACE' | 'PRESENT';
  officeAddrCountry: string;
  officeAddrCity: string;
  officeAddrDivision: string;
  officeAddrDistrict: string;
  officeAddrCityCorpCantOrUpazila: string;
  officeAddrPaurasavaOrUnion: string;
  officeAddrWard: string;
  officeAddrOffice: string;
  personInfoForBirth: PersonInfoForBirth;
  father: ParentInfo;
  mother: ParentInfo;
  birthPlaceCountry: string;
  birthPlaceDiv: string;
  birthPlaceDist: string;
  birthPlaceCityCorpCantOrUpazila: string;
  birthPlacePaurasavaOrUnion: string;
  birthPlaceWardInPaurasavaOrUnion: string;
  birthPlaceVilAreaTownBn: string;
  birthPlaceVilAreaTownEn: string;
  birthPlacePostOfc: string;
  birthPlacePostOfcEn: string;
  birthPlaceHouseRoadBn: string;
  birthPlaceHouseRoadEn: string;
  copyBirthPlaceToPermAddr: 'yes' | 'no';
  permAddrCountry: string;
  permAddrDiv: string;
  permAddrDist: string;
  permAddrCityCorpCantOrUpazila: string;
  permAddrPaurasavaOrUnion: string;
  permAddrWardInPaurasavaOrUnion: string;
  copyPermAddrToPrsntAddr: 'yes' | 'no';
  prsntAddrCountry: string;
  prsntAddrDiv: string;
  prsntAddrDist: string;
  prsntAddrCityCorpCantOrUpazila: string;
  prsntAddrPaurasavaOrUnion: string;
  prsntAddrWardInPaurasavaOrUnion: string;
  applicantName: string;
  phone: string;
  email: string;
  relationWithApplicant: 'SELF' | 'FATHER' | 'MOTHER' | 'GUARDIAN';
  attachments: Attachment[];
  declaration: 'on' | 'off';
  personImage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// ==================== Helper Functions ====================
const getStatusBadgeColor = (status: Application['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-green-900/30 text-green-300 border-green-700';
    case 'rejected':
      return 'bg-red-900/30 text-red-300 border-red-700';
    case 'processing':
      return 'bg-yellow-900/30 text-yellow-300 border-yellow-700';
    case 'submitted':
      return 'bg-blue-900/30 text-blue-300 border-blue-700';
    case 'pending':
      return 'bg-purple-900/30 text-purple-300 border-purple-700';
    default:
      return 'bg-gray-900/30 text-gray-300 border-gray-700';
  }
};

const getStatusIcon = (status: Application['status']) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'submitted':
      return <FileCheck className="w-4 h-4" />;
    case 'pending':
      return <Clock className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getDaysRemaining = (lastDate: string): number => {
  const today = new Date();
  const lastDay = new Date(lastDate.split('/').reverse().join('-'));
  const diffTime = lastDay.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ==================== Main Component ====================
const BirthApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulating API call with your provided data structure
        const response = await fetch('/api/birth/application/registration/history');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Assuming the API returns an object with a 'history' array
        if (data && data.history && Array.isArray(data.history)) {
          setApplications(data.history);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again.');

        
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.personInfoForBirth.personNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personInfoForBirth.personNameBn.includes(searchTerm) ||
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name':
        return a.personInfoForBirth.personNameEn.localeCompare(b.personInfoForBirth.personNameEn);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const toggleExpand = (appId: string) => {
    setExpandedAppId(expandedAppId === appId ? null : appId);
  };

  const handleRefresh = () => {
    // Refresh data
    window.location.reload();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = (printLink: string) => {
    window.open(printLink, '_blank');
  };

  const handleViewDetails = (appId: string) => {
    // Navigate to detailed view or show modal
    console.log('View details for:', appId);
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    // Implement download logic
    console.log('Downloading:', attachment.name);
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    submitted: applications.filter(app => app.status === 'submitted').length,
    processing: applications.filter(app => app.status === 'processing').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg">Loading applications...</p>
          <p className="text-sm text-gray-400 mt-2">Fetching your birth registration history</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Applications</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Baby className="w-8 h-8 text-blue-400" />
              Birth Registration Applications
            </h1>
            <p className="text-gray-400 mt-2">View and manage your birth registration application history</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="text-sm text-gray-400">
              Total: <span className="font-semibold text-white">{applications.length}</span> applications
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">Submitted</p>
                <p className="text-2xl font-bold">{stats.submitted}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
              <Loader2 className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-red-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, application ID..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <select
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'status')}
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {sortedApplications.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No applications found</h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms' 
                : 'You have no birth registration applications yet'}
            </p>
          </div>
        ) : (
          sortedApplications.map((app) => {
            const isExpanded = expandedAppId === app._id;
            const daysRemaining = getDaysRemaining(app.lastDate);
            
            return (
              <div
                key={app._id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-gray-600"
              >
                {/* Application Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  onClick={() => toggleExpand(app._id)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusBadgeColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          <span className="capitalize">{app.status}</span>
                        </div>
                        
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(app.createdAt)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {app.personInfoForBirth.personNameEn}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">{app.personInfoForBirth.personNameBn}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Baby className="w-3 h-3" />
                            <span>DOB: {app.personInfoForBirth.personBirthDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{app.relationWithApplicant}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Application ID</div>
                        <div className="font-mono font-bold flex items-center gap-2">
                          {app.applicationId}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyId(app.applicationId);
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === app.applicationId ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <button className="text-gray-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Personal Info */}
                      <div className="space-y-6">
                        {/* Personal Information */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Personal Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Full Name (EN)</p>
                              <p className="font-medium">{app.personInfoForBirth.personNameEn}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Full Name (BN)</p>
                              <p className="font-medium">{app.personInfoForBirth.personNameBn}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Date of Birth</p>
                              <p className="font-medium">{app.personInfoForBirth.personBirthDate}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Gender</p>
                              <p className="font-medium capitalize">{app.personInfoForBirth.gender.toLowerCase()}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Child Number</p>
                              <p className="font-medium">{app.personInfoForBirth.thChild}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Religion</p>
                              <p className="font-medium">{app.personInfoForBirth.religion.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Parents Information */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Parents Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">Father</p>
                              <p className="font-medium">{app.father.personNameEn}</p>
                              {app.father.personNameBn && (
                                <p className="text-sm text-gray-400">{app.father.personNameBn}</p>
                              )}
                              {app.father.ubrn && (
                                <p className="text-xs text-blue-400 mt-1">UBRN: {app.father.ubrn}</p>
                              )}
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">Mother</p>
                              <p className="font-medium">{app.mother.personNameEn}</p>
                              {app.mother.personNameBn && (
                                <p className="text-sm text-gray-400">{app.mother.personNameBn}</p>
                              )}
                              {app.mother.ubrn && (
                                <p className="text-xs text-blue-400 mt-1">UBRN: {app.mother.ubrn}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Application Details */}
                      <div className="space-y-6">
                        {/* Application Details */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Application Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Applicant</p>
                              <p className="font-medium">{app.applicantName}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Relation</p>
                              <p className="font-medium">{app.relationWithApplicant}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Phone</p>
                              <p className="font-medium flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {app.phone}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Cost</p>
                              <p className="font-medium">৳{app.cost}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Last Date</p>
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-3 h-3" />
                                <span className="font-medium">{app.lastDate}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${daysRemaining < 0 ? 'bg-red-900/30 text-red-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                                  {daysRemaining < 0 ? 'Expired' : `${daysRemaining} days left`}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Office Type</p>
                              <p className="font-medium">{app.officeAddressType}</p>
                            </div>
                          </div>
                        </div>

                        {/* Attachments */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Attachments ({app.attachments.length})
                          </h4>
                          <div className="space-y-2">
                            {app.attachments.map((attachment) => (
                              <div
                                key={attachment._id}
                                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-blue-400" />
                                  <div>
                                    <p className="font-medium text-sm">{attachment.name}</p>
                                    <p className="text-xs text-gray-400">
                                      {formatFileSize(attachment.size)} • {attachment.type}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownloadAttachment(attachment)}
                                  className="text-gray-400 hover:text-white transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>


                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>All data is securely fetched from the Birth Registration System API</span>
          </div>
          <div>
            Showing <span className="font-semibold text-white">{sortedApplications.length}</span> of{' '}
            <span className="font-semibold text-white">{applications.length}</span> applications
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthApplications;