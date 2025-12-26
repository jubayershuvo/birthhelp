"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";


// Define TypeScript interfaces
interface AppData {
  ubrn: string;
  personBirthDate: string;
  personNameBn: string | null;
  fatherNameBn: string | null;
  motherNameBn: string | null;
  officeNameBn: string | null;
}

export default function AppDataSearch() {
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [appDataList, setAppDataList] = useState<AppData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [serviceCost, setServiceCost] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const expandAll = () => {
    const allIndexes = new Set(appDataList.map((_, index) => index));
    setExpandedItems(allIndexes);
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  const handleSearch = async () => {
    if (!appId.trim()) {
      toast.error("Please enter an Application ID");
      return;
    }

    setLoading(true);
    setError(null);
    setAppDataList([]);
    setExpandedItems(new Set());

    try {
      const response = await fetch(`/api/possible-app-data/${appId}`);

      if (!response.ok) {
        throw new Error("No data found");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.length > 0) {
        setAppDataList(data);
        // Expand first item by default if only one result
        if (data.length === 1) {
          setExpandedItems(new Set([0]));
        }
        toast.success(
          `Found ${data.length} application${data.length === 1 ? "" : "s"}`
        );
      } else {
        throw new Error("No data available");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };


    const sessionReload = async () => {
    if (loading) return;
    try {
      const response = await fetch("/api/possible-app-data/session");

      if (response.ok) {
        const newData = await response.json();
        setServiceCost(newData.serviceCost);
      } else {
        toast.error("সেশন রিলোড করতে সমস্যা হয়েছে");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    sessionReload();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Application Data Search
          </h1>
          <p className="text-red-600 dark:text-red-300 text-lg">
            প্রতি বার {serviceCost} টাকা করে কাটা হবে
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 transition-all hover:shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="appId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Application ID
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="appId"
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Application ID (e.g., 198930904)"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {appDataList.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {appDataList.length} Application
                  {appDataList.length > 1 ? "s" : ""} Found
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Click on an application to view details
                </p>
              </div>
            </div>

            {appDataList.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-6">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                    No Data Found
                  </h3>
                  <p className="text-red-700 dark:text-red-400">
                    {error}. Please check the Application ID and try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data List */}
          {appDataList.length > 0 && (
            <div className="space-y-4">
              {appDataList.map((appData, index) => (
                <div
                  key={appData.ubrn}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl"
                >
                  {/* Application Header */}
                  <button
                    onClick={() => toggleExpand(index)}
                    className="w-full p-6 text-left flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-md font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          UBRN: {appData.ubrn}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to{" "}
                          {expandedItems.has(index) ? "collapse" : "expand"}{" "}
                          details
                        </p>
                      </div>
                    </div>
                    {expandedItems.has(index) ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </button>

                  {/* Expandable Content */}
                  {expandedItems.has(index) && (
                    <div className="p-6 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* UBRN (Full) */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              UBRN (Complete)
                            </p>
                            <p className="font-mono text-gray-900 dark:text-white break-all">
                              {appData.ubrn}
                            </p>
                          </div>
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-4">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            Personal Information
                          </h4>

                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Birth Date
                            </p>
                            <p className="text-gray-900 dark:text-white">
                              {appData.personBirthDate}
                            </p>
                          </div>

                          {appData.personNameBn && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Name (Bengali)
                              </p>
                              <p className="text-gray-900 dark:text-white font-bengali">
                                {appData.personNameBn}
                              </p>
                            </div>
                          )}

                          {appData.fatherNameBn && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Father&apos;s Name (Bengali)
                              </p>
                              <p className="text-gray-900 dark:text-white font-bengali">
                                {appData.fatherNameBn}
                              </p>
                            </div>
                          )}

                          {appData.motherNameBn && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Mother&apos;s Name (Bengali)
                              </p>
                              <p className="text-gray-900 dark:text-white font-bengali">
                                {appData.motherNameBn}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Office Information */}
                        <div className="space-y-4">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            Office Information
                          </h4>

                          {appData.officeNameBn && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Office Name (Bengali)
                              </p>
                              <p className="text-gray-900 dark:text-white font-bengali">
                                {appData.officeNameBn}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {!loading && !error && appDataList.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Search Results
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Enter an Application ID above to search for application data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
