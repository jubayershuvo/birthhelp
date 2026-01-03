"use client";
import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Download,
  FileText,
  Filter,
  Search,
  User,
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
  Edit,
  History,
  BadgeAlert,
  FileEdit,
  FileCheck,
  FileX,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ==================== Types ====================
export interface CorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
  _id: string;
}

export interface FileInfo {
  id: string;
  name: string;
  url: string;
  deleteUrl: string;
  attachmentTypeId: string;
  fileType: string;
  _id: string;
}

export interface AddressInfo {
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

export interface ApplicantInfo {
  name: string;
  officeId: number;
  email: string;
  phone: string;
  relationWithApplicant: string;
  _id: string;
}

export interface CorrectionApplication {
  addresses: {
    birthPlace: AddressInfo;
    permAddress: AddressInfo;
    prsntAddress: AddressInfo;
  };
  _id: string;
  ubrn: string;
  dob: string;
  user: string;
  submit_status:
    | "submitted"
    | "pending"
    | "approved"
    | "rejected"
    | "processing";
  applicationId: string;
  printLink: string;
  correctionInfos: CorrectionInfo[];
  applicantInfo: ApplicantInfo;
  files: FileInfo[];
  otp: string;
  captcha: string;
  csrf: string;
  cost: number;
  cookies: string[];
  isPermAddressIsSameAsBirthPlace: boolean;
  isPrsntAddressIsSameAsPermAddress: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// ==================== Helper Functions ====================
const getStatusBadgeColor = (
  status: CorrectionApplication["submit_status"]
) => {
  switch (status) {
    case "approved":
      return "bg-green-900/30 text-green-300 border-green-700";
    case "rejected":
      return "bg-red-900/30 text-red-300 border-red-700";
    case "processing":
      return "bg-yellow-900/30 text-yellow-300 border-yellow-700";
    case "submitted":
      return "bg-blue-900/30 text-blue-300 border-blue-700";
    case "pending":
      return "bg-purple-900/30 text-purple-300 border-purple-700";
    default:
      return "bg-gray-900/30 text-gray-300 border-gray-700";
  }
};

const getStatusIcon = (status: CorrectionApplication["submit_status"]) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="w-4 h-4" />;
    case "rejected":
      return <XCircle className="w-4 h-4" />;
    case "processing":
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case "submitted":
      return <FileCheck className="w-4 h-4" />;
    case "pending":
      return <Clock className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

const getFieldDisplayName = (key: string): string => {
  const fieldMap: Record<string, string> = {
    personFirstNameEn: "First Name (EN)",
    personLastNameEn: "Last Name (EN)",
    fatherNameEn: "Father Name (EN)",
    motherNameEn: "Mother Name (EN)",
    personNationality: "Nationality",
    gender: "Gender",
    personBirthDate: "Date of Birth",
    personFirstNameBn: "First Name (BN)",
    personLastNameBn: "Last Name (BN)",
    fatherNameBn: "Father Name (BN)",
    motherNameBn: "Mother Name (BN)",
    religion: "Religion",
    birthPlace: "Birth Place",
    permAddress: "Permanent Address",
    prsntAddress: "Present Address",
  };

  return (
    fieldMap[key] ||
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
  );
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getCorrectionCauseText = (cause: string): string => {
  const causeMap: Record<string, string> = {
    "1": "Typing Error",
    "2": "Misspelling",
    "3": "Wrong Information",
    "4": "Legal Name Change",
    "5": "Marriage",
    "6": "Other",
  };
  return causeMap[cause] || "Not specified";
};

// ==================== Main Component ====================
const CorrectionAppHistory: React.FC = () => {
  const [applications, setApplications] = useState<CorrectionApplication[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "ubrn" | "status">("date");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          "/api/birth/application/correction/history",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setApplications(data.history);
      } catch (err) {
        console.error("Error fetching correction applications:", err);
        setError("Failed to load correction applications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.applicantInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.ubrn.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || app.submit_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "ubrn":
        return a.ubrn.localeCompare(b.ubrn);
      case "status":
        return a.submit_status.localeCompare(b.submit_status);
      default:
        return 0;
    }
  });

  const toggleExpand = (appId: string) => {
    setExpandedAppId(expandedAppId === appId ? null : appId);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = (printLink: string) => {
    window.open(printLink, "_blank");
  };

  const handleDownloadFile = (file: FileInfo) => {
    console.log("Downloading:", file.name);
    // In real implementation, you would use the file.url to download
  };

  const handleViewDetails = (appId: string) => {
    console.log("View details for:", appId);
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    submitted: applications.filter((app) => app.submit_status === "submitted")
      .length,
    processing: applications.filter((app) => app.submit_status === "processing")
      .length,
    approved: applications.filter((app) => app.submit_status === "approved")
      .length,
    rejected: applications.filter((app) => app.submit_status === "rejected")
      .length,
    corrections: applications.reduce(
      (total, app) => total + app.correctionInfos.length,
      0
    ),
    avgCorrections:
      applications.length > 0
        ? (
            applications.reduce(
              (total, app) => total + app.correctionInfos.length,
              0
            ) / applications.length
          ).toFixed(1)
        : "0",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg">Loading correction applications...</p>
          <p className="text-sm text-gray-400 mt-2">
            Fetching your correction request history
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Error Loading Applications
          </h3>
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
              <FileEdit className="w-8 h-8 text-blue-400" />
              Correction Request History
            </h1>
            <p className="text-gray-400 mt-2">
              View and manage your birth registration correction applications
            </p>
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
              Total:{" "}
              <span className="font-semibold text-white">
                {applications.length}
              </span>{" "}
              applications
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Corrections</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileEdit className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">Total Fields Edited</p>
                <p className="text-2xl font-bold">{stats.corrections}</p>
              </div>
              <Edit className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Avg: {stats.avgCorrections} per application
            </p>
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

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
              <Loader2 className="w-8 h-8 text-yellow-400" />
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
                  placeholder="Search by name, UBRN, application ID..."
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
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <select
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "date" | "ubrn" | "status")
                  }
                >
                  <option value="date">Sort by Date</option>
                  <option value="ubrn">Sort by UBRN</option>
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
            <FileEdit className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No correction applications found
            </h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "You have no correction applications yet"}
            </p>
          </div>
        ) : (
          sortedApplications.map((app) => {
            const isExpanded = expandedAppId === app._id;

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
                        <div
                          className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusBadgeColor(
                            app.submit_status
                          )}`}
                        >
                          {getStatusIcon(app.submit_status)}
                          <span className="capitalize">
                            {app.submit_status}
                          </span>
                        </div>

                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(app.createdAt)}
                        </div>

                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <BadgeAlert className="w-3 h-3" />
                          {app.correctionInfos.length} fields to correct
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {app.applicantInfo.name}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                            <Tag className="w-3 h-3" />
                            UBRN: {app.ubrn}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            <span>Date of Birth: {app.dob}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{app.applicantInfo.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {app.submit_status !== "submitted" ? (
                        <div className="flex items-center">
                          <button
                            className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => {
                              router.push(
                                `/birth/application/correction?id=${app._id}`
                              );
                            }}
                          >
                            Submit
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            Application ID
                          </div>
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
                      )}

                      <button className="text-gray-400 hover:text-white transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Correction Details */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Correction Information */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Edit className="w-5 h-5 text-blue-400" />
                            Correction Details
                          </h4>
                          <div className="space-y-3">
                            {app.correctionInfos.map((correction, index) => (
                              <div
                                key={correction._id}
                                className="bg-gray-800/70 p-4 rounded-lg border border-gray-700"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm text-gray-400">
                                        Field #{index + 1}
                                      </span>
                                      <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded">
                                        {getFieldDisplayName(correction.key)}
                                      </span>
                                    </div>
                                    <p className="text-lg font-medium">
                                      {correction.value}
                                    </p>
                                  </div>
                                  {correction.cause && (
                                    <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded">
                                      {getCorrectionCauseText(correction.cause)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400 mt-2">
                                  Field ID:{" "}
                                  <span className="font-mono">
                                    {correction.key}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Files */}
                        {app.files.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <FileText className="w-5 h-5" />
                              Supporting Documents ({app.files.length})
                            </h4>
                            <div className="space-y-2">
                              {app.files.map((file) => (
                                <div
                                  key={file._id}
                                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-blue-400" />
                                    <div>
                                      <p className="font-medium text-sm">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {file.fileType}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Type ID: {file.attachmentTypeId}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDownloadFile(file)}
                                    className="text-gray-400 hover:text-white transition-colors px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Application Info */}
                      <div className="space-y-6">
                        {/* Applicant Information */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Applicant Information
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">
                                Applicant Name
                              </p>
                              <p className="font-medium">
                                {app.applicantInfo.name}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">
                                  Phone
                                </p>
                                <p className="font-medium flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {app.applicantInfo.phone}
                                </p>
                              </div>
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">
                                  Relation
                                </p>
                                <p className="font-medium">
                                  {app.applicantInfo.relationWithApplicant}
                                </p>
                              </div>
                            </div>
                            {app.applicantInfo.email && (
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">
                                  Email
                                </p>
                                <p className="font-medium flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {app.applicantInfo.email}
                                </p>
                              </div>
                            )}
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">
                                Office ID
                              </p>
                              <p className="font-medium">
                                {app.applicantInfo.officeId}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Application Details */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Application Details
                          </h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">
                                  Cost
                                </p>
                                <p className="font-medium">৳{app.cost}</p>
                              </div>
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">
                                  UBRN
                                </p>
                                <p className="font-medium text-sm font-mono">
                                  {app.ubrn}
                                </p>
                              </div>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">
                                Date of Birth (Current)
                              </p>
                              <p className="font-medium">{app.dob}</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">
                                Created At
                              </p>
                              <p className="font-medium">
                                {formatDate(app.createdAt)}
                              </p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">
                                Last Updated
                              </p>
                              <p className="font-medium">
                                {formatDate(app.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-400">
                                Application Status
                              </p>
                              <p className="text-lg font-semibold capitalize">
                                {app.submit_status}
                              </p>
                            </div>
                            <div
                              className={`px-3 py-2 rounded-lg ${getStatusBadgeColor(
                                app.submit_status
                              )}`}
                            >
                              {getStatusIcon(app.submit_status)}
                            </div>
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
            <span>
              All correction data is securely fetched from the Birth
              Registration System
            </span>
          </div>
          <div className="text-center md:text-right">
            <p>
              Showing{" "}
              <span className="font-semibold text-white">
                {sortedApplications.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-white">
                {applications.length}
              </span>{" "}
              applications
            </p>
            <p className="text-xs mt-1">
              Total corrections requested:{" "}
              <span className="font-semibold text-white">
                {stats.corrections}
              </span>{" "}
              fields
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionAppHistory;
