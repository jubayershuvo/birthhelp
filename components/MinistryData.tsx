"use client";
import { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Info,
  X,
  RefreshCw,
  User,
  Hash,
  AlertCircle,
  Calendar,
  MapPin,
  Home,
  FileText,
  Phone,
  Users,
  Globe,
  Building,
  Tag,
  Copy,
  ChevronRight,
  History,
} from "lucide-react";
import axios from "axios";
import { decryptFile } from "@/lib/decryptFile";
import Link from "next/link";
import toast from "react-hot-toast";

// Updated Types matching your actual API response
interface Person {
  ubrn: string;
  udrn: string | null;
  uid: string | null;
  securityCode: string;
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
  motherNid: string | null;
  motherBrn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  fatherNationality: string;
  fatherNationalityEn: string;
  fatherNid: string | null;
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
  score?: number;
}

interface SearchResponse {
  count: number;
  usedTextIndex: boolean;
  hintApplied: boolean;
  autoHintApplied: string | null;
  matchMode: string;
  yearFiltersApplied: {
    birthYearFrom: number | null;
    birthYearTo: number | null;
    regYearFrom: number | null;
    regYearTo: number | null;
  };
  results: Person[];
}

interface ErrorResponse {
  error: string;
  unknownParams?: string[];
  allowedParams?: string[];
  allowedHints?: string[];
  allowedSort?: string[];
  allowedMatch?: string[];
  allowedFields?: string[];
  allowedYearParams?: string[];
  allowedFilters?: string[];
}

const SearchPage = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<Omit<
    SearchResponse,
    "results"
  > | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);

  // Modal state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    ubrn: "",
    personNameEn: "",
    personNameBn: "",
    personBirthDate: "",
    gender: "",
    dateOfRegistration: "",
  });

  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    birthYearFrom: "",
    birthYearTo: "",
    regYearFrom: "",
    regYearTo: "",
  });

  // Search options
  const [searchOptions, setSearchOptions] = useState({
    fields: "personNameEn,personNameBn,ubrn",
    match: "exact",
    limit: "20",
    skip: "0",
    sort: "score",
    hint: "",
  });

  // UI state
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [serviceCost, setServiceCost] = useState(0);

  // Field options
  const fieldOptions = [
    "ubrn",
    "personNameEn",
    "personNameBn",
    "personBirthDate",
    "gender",
    "dateOfRegistration",
    "searchText",
  ];

  const matchOptions = [
    { value: "exact", label: "Exact Match" },
    { value: "prefix", label: "Prefix Match" },
    { value: "contains", label: "Contains" },
  ];

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  const sortOptions = [
    { value: "score", label: "Relevance Score" },
    { value: "ubrn", label: "UBRN" },
    { value: "personNameEn", label: "Name (English)" },
    { value: "personNameBn", label: "Name (Bangla)" },
    { value: "personBirthDate", label: "Birth Date" },
    { value: "dateOfRegistration", label: "Registration Date" },
    { value: "gender", label: "Gender" },
  ];

  const modalRef = useRef<HTMLDivElement>(null);

  // Build query parameters
  const buildQueryParams = () => {
    const params: Record<string, string> = {};

    // Add search query if present
    if (searchQuery.trim()) {
      params.q = searchQuery.trim();
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        params[key] = value.trim();
      }
    });

    // Add advanced filters
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value.trim()) {
        params[key] = value.trim();
      }
    });

    // Add search options
    if (searchOptions.fields) params.fields = searchOptions.fields;
    if (searchOptions.match) params.match = searchOptions.match;
    if (searchOptions.limit) params.limit = searchOptions.limit;
    if (searchOptions.skip) params.skip = searchOptions.skip;
    if (searchOptions.sort) params.sort = searchOptions.sort;
    if (searchOptions.hint) params.hint = searchOptions.hint;

    return params;
  };

  // Perform search
  const performSearch = async (page = 0) => {
    setLoading(true);
    setError(null);

    const params = buildQueryParams();
    params.skip = (page * parseInt(searchOptions.limit)).toString();

    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(
        `/api/data/ministry/search?${queryString}`,
        {
          responseType: "arraybuffer", // important for binary data
        }
      );

      const arrayBuffer = response.data as ArrayBuffer;

      const result = decryptFile<{ results: Person[] }>(arrayBuffer);

      const data = result as SearchResponse;
      setResults(data.results);
      setApiInfo({
        count: data.count,
        usedTextIndex: data.usedTextIndex,
        hintApplied: data.hintApplied,
        autoHintApplied: data.autoHintApplied,
        matchMode: data.matchMode,
        yearFiltersApplied: data.yearFiltersApplied,
      });
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
      setApiInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    performSearch(0);
  };

  // Handle filter change
  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle advanced filter change
  const handleAdvancedFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdvancedFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle option change
  const handleOptionChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSearchOptions((prev) => ({ ...prev, [name]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      ubrn: "",
      personNameEn: "",
      personNameBn: "",
      personBirthDate: "",
      gender: "",
      dateOfRegistration: "",
    });
    setAdvancedFilters({
      birthYearFrom: "",
      birthYearTo: "",
      regYearFrom: "",
      regYearTo: "",
    });
    setSearchQuery("");
  };

  // Reset to default options
  const resetOptions = () => {
    setSearchOptions({
      fields: "personNameEn,personNameBn,ubrn",
      match: "exact",
      limit: "20",
      skip: "0",
      sort: "score",
      hint: "",
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    performSearch(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setSearchOptions((prev) => ({ ...prev, limit: newRowsPerPage.toString() }));
    setCurrentPage(0);
    performSearch(0);
  };

  // Open modal with person details
  const openPersonModal = async (person: Person) => {
    try {
      setBuyLoading(true);
      toast.loading("ক্রয় হচ্ছে...", { id: "buyLoading" });
      await axios.get(`/api/data/ministry/buy/${person.ubrn}`);
      setSelectedPerson(person);
      setIsModalOpen(true);
      setBuyLoading(false);
      toast.success("ক্রয় সফল হয়েছে", { id: "buyLoading" });
      document.body.style.overflow = "hidden";
    } catch (error) {
      setBuyLoading(false);
      toast.error("ক্রয় ব্যর্থ হয়েছে", { id: "buyLoading" });
      console.log(error);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
    document.body.style.overflow = "auto";
  };

  // Handle click outside modal
  const handleClickOutside = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      closeModal();
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-BD", {
        year: "numeric",
        month: "long",
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
    };
    return genderMap[gender] || gender;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isModalOpen]);
  const sessionReload = async () => {
    if (loading) return;
    try {
      const response = await fetch("/api/data/ministry/session");

      if (response.ok) {
        const newData = await response.json();
        setServiceCost(newData.serviceCost);
      } else {
        toast.error("সেশন রিলোড করতে সমস্যা হয়েছে");
      }
    } catch (error) {}
  };

  useEffect(() => {
    sessionReload();
  }, []);
  console.log(serviceCost);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between">
          <div className="">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              People Search
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Search through the people database with advanced filtering options
            </p>
            <p className="text-red-500 dark:text-red-400 mt-2">
              প্রতি বার {serviceCost} টাকা করে কাটা হবে
            </p>
          </div>
          <Link href="/data/ministry/history" className="">
            <History />
          </Link>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Filters Panel */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Filters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Basic Filters
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name (English)
                    </label>
                    <input
                      type="text"
                      name="personNameEn"
                      value={filters.personNameEn}
                      onChange={handleFilterChange}
                      placeholder="Enter English name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name (Bangla)
                    </label>
                    <input
                      type="text"
                      name="personNameBn"
                      value={filters.personNameBn}
                      onChange={handleFilterChange}
                      placeholder="Enter Bangla name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Advanced Filters
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Birth Year From
                      </label>
                      <input
                        type="number"
                        name="birthYearFrom"
                        value={advancedFilters.birthYearFrom}
                        onChange={handleAdvancedFilterChange}
                        placeholder="YYYY"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Birth Year To
                      </label>
                      <input
                        type="number"
                        name="birthYearTo"
                        value={advancedFilters.birthYearTo}
                        onChange={handleAdvancedFilterChange}
                        placeholder="YYYY"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={filters.gender}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          gender: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Genders</option>
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Search Options
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Match Mode
                    </label>
                    <select
                      name="match"
                      value={searchOptions.match}
                      onChange={handleOptionChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {matchOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Results Per Page
                    </label>
                    <select
                      name="limit"
                      value={searchOptions.limit}
                      onChange={handleOptionChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={resetOptions}
                  className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Options to Default
                </button>

                <div className="flex flex-col md:flex-row md:space-x-2 gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Info */}
        {apiInfo && !loading && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center">
                <User className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Results
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {apiInfo.count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Search Mode
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {apiInfo.usedTextIndex ? "Text Index" : "Regex"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-purple-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Match Mode
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {apiInfo.matchMode}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center">
                <Hash className="h-5 w-5 text-orange-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Index Hint
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {apiInfo.hintApplied
                      ? "Applied"
                      : apiInfo.autoHintApplied || "Auto"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Searching database...
                </p>
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && !error && apiInfo && (
            <div className="text-center p-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}

          {/* Results Table */}
          {!loading && results.length > 0 && (
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
                  {results.map((person, index) => (
                    <tr
                      key={`${person.ubrn}-${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {person.personNameEn}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-bangla">
                          {person.personNameBn}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {person.personBirthDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            person.gender === "MALE" || person.gender === "M"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : person.gender === "FEMALE" ||
                                person.gender === "F"
                              ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                          }`}
                        >
                          {formatGender(person.gender)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openPersonModal(person)}
                          disabled={buyLoading}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <span>Buy Birth Details</span>
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={results.length < parseInt(searchOptions.limit)}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing page{" "}
                        <span className="font-medium">{currentPage + 1}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={
                            results.length < parseInt(searchOptions.limit)
                          }
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Person Details Modal */}
        {isModalOpen && selectedPerson && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={handleClickOutside}
          >
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"></div>

            {/* Modal container */}
            <div className="flex items-center justify-center min-h-screen p-4">
              {/* Modal panel */}
              <div
                ref={modalRef}
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal content */}
                <div className="px-4 pt-5 pb-4 sm:p-6">
                  <div className="absolute top-4 right-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="sr-only">Close</span>
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Person Details
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          UBRN:{" "}
                          <span className="font-mono">
                            {selectedPerson.ubrn}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(selectedPerson, null, 2)
                          )
                        }
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy JSON
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Personal Information Card */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <User className="h-6 w-6 text-blue-500 mr-3" />
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Personal Information
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Full Name (English)
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPerson.personNameEn}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Full Name (Bangla)
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white font-bangla">
                              {selectedPerson.personNameBn}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Gender
                            </p>
                            <span
                              className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                selectedPerson.gender === "MALE" ||
                                selectedPerson.gender === "M"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  : selectedPerson.gender === "FEMALE" ||
                                    selectedPerson.gender === "F"
                                  ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                              }`}
                            >
                              {formatGender(selectedPerson.gender)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Birth Date
                            </p>
                            <div className="mt-1 flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedPerson.personBirthDate}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Registration Date
                            </p>
                            <div className="mt-1 flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedPerson.dateOfRegistration}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Child Number
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPerson.thChild}
                            </p>
                          </div>
                          {selectedPerson.score !== undefined && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Relevance Score
                              </p>
                              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedPerson.score.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parent Information Card */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <Users className="h-6 w-6 text-green-500 mr-3" />
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Parent Information
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                Father
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Name (English)
                                  </p>
                                  <p className="text-base font-medium text-gray-900 dark:text-white">
                                    {selectedPerson.fatherNameEn}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Name (Bangla)
                                  </p>
                                  <p className="text-base font-medium text-gray-900 dark:text-white font-bangla">
                                    {selectedPerson.fatherNameBn}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    BRN
                                  </p>
                                  <p className="text-base font-medium text-gray-900 dark:text-white font-mono">
                                    {selectedPerson.fatherBrn}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Nationality
                                  </p>
                                  <div className="flex items-center">
                                    <Globe className="h-4 w-4 text-gray-400 mr-2" />
                                    <p className="text-base font-medium text-gray-900 dark:text-white">
                                      {selectedPerson.fatherNationalityEn}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                Mother
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Name (English)
                                  </p>
                                  <p className="text-base font-medium text-gray-900 dark:text-white">
                                    {selectedPerson.motherNameEn}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Name (Bangla)
                                  </p>
                                  <p className="text-base font-medium text-gray-900 dark:text-white font-bangla">
                                    {selectedPerson.motherNameBn}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    BRN
                                  </p>
                                  <p className="text-base font-medium text-gray-900 dark:text-white font-mono">
                                    {selectedPerson.motherBrn}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Nationality
                                  </p>
                                  <div className="flex items-center">
                                    <Globe className="h-4 w-4 text-gray-400 mr-2" />
                                    <p className="text-base font-medium text-gray-900 dark:text-white">
                                      {selectedPerson.motherNationalityEn}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Address Information Card */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <MapPin className="h-6 w-6 text-purple-500 mr-3" />
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Address Information
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center mb-3">
                              <Home className="h-5 w-5 text-blue-400 mr-2" />
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                                Birth Place
                              </h5>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  English
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {selectedPerson.fullBirthPlaceEn}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Bangla
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white font-bangla">
                                  {selectedPerson.fullBirthPlaceBn}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center mb-3">
                              <Home className="h-5 w-5 text-green-400 mr-2" />
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                                Permanent Address
                              </h5>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  English
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {selectedPerson.fullPermAddrEn}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Bangla
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white font-bangla">
                                  {selectedPerson.fullPermAddrBn}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center mb-3">
                              <Home className="h-5 w-5 text-orange-400 mr-2" />
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                                Present Address
                              </h5>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  English
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {selectedPerson.fullPrsntAddrEn}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Bangla
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white font-bangla">
                                  {selectedPerson.fullPrsntAddrBn}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Registration Details Card */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <FileText className="h-6 w-6 text-orange-500 mr-3" />
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Registration Details
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Security Code
                            </p>
                            <p className="mt-1 text-lg font-mono font-semibold text-gray-900 dark:text-white">
                              {selectedPerson.securityCode}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Book Number
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPerson.bookNumber || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Page Number
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPerson.pageNumber || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Line Number
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPerson.lineNumber || "N/A"}
                            </p>
                          </div>
                          {selectedPerson.registrationOfficeName && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Registration Office
                              </p>
                              <div className="mt-1 flex items-center">
                                <Building className="h-4 w-4 text-gray-400 mr-2" />
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {selectedPerson.registrationOfficeName}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedPerson.phone && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Contact Phone
                              </p>
                              <div className="mt-1 flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {selectedPerson.phone}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Raw JSON Data */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Tag className="h-6 w-6 text-gray-500 mr-3" />
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Raw JSON Data
                            </h4>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                JSON.stringify(selectedPerson, null, 2)
                              )
                            }
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy JSON
                          </button>
                        </div>
                        <div className="relative">
                          <pre className="text-xs bg-black text-gray-200 p-4 rounded-lg overflow-x-auto max-h-96">
                            {JSON.stringify(selectedPerson, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start">
              <Info className="h-6 w-6 text-blue-400 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Search Tips
                </h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                  <li>
                    • Use the main search bar for quick text searches across
                    multiple fields
                  </li>
                  <li>• Apply specific filters to narrow down results</li>
                  <li>
                    • Use year range filters for birth date and registration
                    date queries
                  </li>
                  <li>
                    • Select &quot;Exact Match&quot; for precise name searches
                  </li>
                  <li>• Try different sort options to organize results</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Powered by MongoDB Search API • Results limited to 2000 records per
            query
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
