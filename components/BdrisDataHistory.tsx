'use client';
import { useState, useEffect } from "react";
import {
  Search,
  User,
  Calendar,
  Eye,
  Copy,
  X,
  Filter,
  Download,
  ChevronRight,
  Clock,
  Hash,
  Users,
  MapPin,
  Building,
  Phone,
  Globe,
  Home,
  FileText,
  RefreshCw,
} from "lucide-react";

interface HistoryItem {
  _id: string;
  ubrn: string;
  user: string;
  securityCode: string | null;
  personBirthDate: string;
  personBirthDateString: string;
  personDeathDate: string | null;
  dateOfRegistration: string;
  dateOfRegistrationString: string;
  gender: string;
  personNameBn: string;
  personNameEn: string;
  motherNameBn: string;
  motherNameEn: string;
  motherNationality: string;
  motherNationalityEn: string;
  motherNid: string;
  motherBrn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  fatherNationality: string;
  fatherNationalityEn: string;
  fatherNid: string;
  fatherBrn: string;
  thChild: number;
  birthPlaceLocationId: number;
  birthPlaceBn: string;
  birthPlaceEn: string;
  fullBirthPlaceBn: string;
  fullBirthPlaceEn: string;
  permAddrLocationId: number;
  permAddrBn: string;
  permAddrBnFromPermAddrLocationId: string;
  permAddrEnFromPermAddrLocationId: string;
  permAddrEn: string;
  fullPermAddrBn: string;
  fullPermAddrEn: string;
  prsntAddrLocationId: number;
  prsntAddrBn: string;
  prsntAddrEn: string;
  fullPrsntAddrBn: string;
  fullPrsntAddrEn: string;
  deathAddrLocationId: number | null;
  deathAddrBn: string | null;
  fullDeathAddrBn: string | null;
  causeOfDeath: string | null;
  bookNumber: string | null;
  pageNumber: string | null;
  lineNumber: string | null;
  base64EncodedQrCode: string | null;
  base64EncodedBarcode: string | null;
  checksum: string | null;
  registrationStatus: string | null;
  geoLocationId: number | null;
  wardNo: string | null;
  wardNameBn: string | null;
  wardNameEn: string | null;
  wardId: string | null;
  registrationOfficeName: string | null;
  officeAddress: string | null;
  phone: string | null;
  hiddenPhone: string | null;
  email: string | null;
  birthRegisterId: string | null;
  familyUbrnList: string[] | null;
  messageBn: string | null;
  messageEn: string | null;
  officeAddressBn: string;
  officeAddressEn: string;
  foreign: boolean;
  searchText: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const HistoryPage = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch history data
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/data/ministry/history");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }
      
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on search term
  const filteredHistory = history.filter(item =>
    item.personNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubrn.includes(searchTerm) ||
    item.personNameBn.includes(searchTerm)
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format gender display
  const formatGender = (gender: string) => {
    const genderMap: Record<string, string> = {
      MALE: "Male",
      FEMALE: "Female",
      OTHER: "Other",
      M: "Male",
      F: "Female",
      O: "Other",
    };
    return genderMap[gender] || gender;
  };

  // Open modal with item details
  const openModal = (item: HistoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    document.body.style.overflow = 'auto';
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Export data as JSON
  const exportData = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'search-history.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Search History
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                View all previously searched records
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={fetchHistory}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, UBRN, or Bangla name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center">
              <User className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Records
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {history.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Filtered Results
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {filteredHistory.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last Updated
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {history.length > 0 ? formatDate(history[0].updatedAt) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Error
                </h3>
                <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Loading history...
                </p>
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && filteredHistory.length === 0 && !error && (
            <div className="text-center p-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No history found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? "Try a different search term" : "Search history will appear here"}
              </p>
            </div>
          )}

          {/* History Table */}
          {!loading && filteredHistory.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name (English)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name (Bangla)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      UBRN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Birth Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredHistory.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.personNameEn}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-bangla">
                          {item.personNameBn}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900 dark:text-white">
                          {item.ubrn}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {item.personBirthDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.gender === "MALE" || item.gender === "M"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : item.gender === "FEMALE" || item.gender === "F"
                              ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                          }`}
                        >
                          {formatGender(item.gender)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(item)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Showing {filteredHistory.length} of {history.length} records
          </p>
        </div>

        {/* Details Modal */}
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
              onClick={closeModal}
            ></div>

            {/* Modal container */}
            <div className="flex items-center justify-center min-h-screen p-4">
              {/* Modal panel */}
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal content */}
                <div className="px-6 pt-6 pb-4">
                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>

                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Person Details
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      UBRN: <span className="font-mono">{selectedItem.ubrn}</span>
                    </p>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <User className="h-6 w-6 text-blue-500 mr-3" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Personal Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Full Name (English)
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedItem.personNameEn}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Full Name (Bangla)
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white font-bangla">
                            {selectedItem.personNameBn}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Birth Date
                          </p>
                          <div className="mt-1 flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedItem.personBirthDate}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Gender
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              selectedItem.gender === "MALE" || selectedItem.gender === "M"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : selectedItem.gender === "FEMALE" || selectedItem.gender === "F"
                                ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                            }`}
                          >
                            {formatGender(selectedItem.gender)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Registration Date
                          </p>
                          <div className="mt-1 flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedItem.dateOfRegistration}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Child Number
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedItem.thChild}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Parent Information */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Users className="h-6 w-6 text-green-500 mr-3" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Parent Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Father
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Name (English)
                              </p>
                              <p className="text-base font-medium text-gray-900 dark:text-white">
                                {selectedItem.fatherNameEn}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Name (Bangla)
                              </p>
                              <p className="text-base font-medium text-gray-900 dark:text-white font-bangla">
                                {selectedItem.fatherNameBn}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Nationality
                              </p>
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 text-gray-400 mr-2" />
                                <p className="text-base font-medium text-gray-900 dark:text-white">
                                  {selectedItem.fatherNationalityEn}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Mother
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Name (English)
                              </p>
                              <p className="text-base font-medium text-gray-900 dark:text-white">
                                {selectedItem.motherNameEn}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Name (Bangla)
                              </p>
                              <p className="text-base font-medium text-gray-900 dark:text-white font-bangla">
                                {selectedItem.motherNameBn}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Nationality
                              </p>
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 text-gray-400 mr-2" />
                                <p className="text-base font-medium text-gray-900 dark:text-white">
                                  {selectedItem.motherNationalityEn}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <MapPin className="h-6 w-6 text-purple-500 mr-3" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Address Information
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Birth Place
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedItem.fullBirthPlaceEn}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white font-bangla mt-1">
                            {selectedItem.fullBirthPlaceBn}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Permanent Address
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedItem.fullPermAddrEn}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white font-bangla mt-1">
                            {selectedItem.fullPermAddrBn}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* JSON Data */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <FileText className="h-6 w-6 text-gray-500 mr-3" />
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Raw JSON Data
                          </h3>
                        </div>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(selectedItem, null, 2))}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy JSON
                        </button>
                      </div>
                      <div className="relative">
                        <pre className="text-xs bg-black text-gray-200 p-4 rounded-lg overflow-x-auto max-h-64">
                          {JSON.stringify(selectedItem, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last searched: {formatDate(selectedItem.updatedAt)}
                    </p>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;