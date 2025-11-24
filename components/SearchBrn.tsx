"use client";

import { useState, useCallback, useMemo } from "react";
import axios from "axios";

// Limited data interface for search results
interface ISearchData {
  _id: string;
  ubrn: string;
  personNameEn: string;
  personNameBn: string;
  dateOfBirth: string;
}

// Full data interface for edit page (not exposed here)
interface IFullData {
  _id: string;
  registrationDate: string;
  registrationOffice: string;
  issuanceDate: string;
  dateOfBirth: string;
  birthRegNumber: string;
  sex: string;
  personNameBn: string;
  personNameEn: string;
  birthPlaceBn: string;
  birthPlaceEn: string;
  motherNameBn: string;
  motherNameEn: string;
  motherNationalityBn: string;
  motherNationalityEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  fatherNationalityBn: string;
  fatherNationalityEn: string;
  officeLocation: string;
  permanentAddressBn?: string;
  permanentAddressEn?: string;
  randomCode: string;
  verificationKey: string;
  qrCodeData: string;
  barcodeData: string;
  dateInWords: string;
  certificateNumber: string;
  charged: boolean;
  amount_charged: number;
}

interface SearchForm {
  ubrn: string;
  dob: string;
}

export default function BirthCertificateSearch() {
  const [searchForm, setSearchForm] = useState<SearchForm>({ ubrn: "", dob: "" });
  const [searchData, setSearchData] = useState<ISearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Search form handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchForm.ubrn || !searchForm.dob) {
      setMessage("❌ Please fill in both UBRN and Date of Birth");
      return;
    }

    setLoading(true);
    setMessage("");
    setSearchPerformed(true);

    try {
      const response = await axios.post("/api/birth/certificate/find", searchForm);
      if (response.data) {
        setSearchData(response.data);
        setMessage("✅ Record found!");
      } else {
        setMessage("❌ No record found");
        setSearchData(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      setMessage("❌ Error searching for record");
      setSearchData(null);
    } finally {
      setLoading(false);
    }
  }, [searchForm]);

  // Show full data handler - redirect to edit page
  const handleShowFull = useCallback(() => {
    if (searchData?._id) {
      // Redirect to the edit page with the record ID
      window.location.href = `/birth/certificate/edit/${searchData._id}`;
    }
  }, [searchData]);

  // Reset search
  const handleReset = useCallback(() => {
    setSearchForm({ ubrn: "", dob: "" });
    setSearchData(null);
    setMessage("");
    setSearchPerformed(false);
  }, []);

  // Search result fields
  const searchResultFields = useMemo(() => [
    { label: "UBRN", key: "ubrn" as keyof ISearchData },
    { label: "Name (English)", key: "personNameEn" as keyof ISearchData },
    { label: "Name (Bangla)", key: "personNameBn" as keyof ISearchData },
    { label: "Date of Birth", key: "dateOfBirth" as keyof ISearchData },
  ], []);

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl transition-all duration-500">
      {/* Title */}
      <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800 dark:text-gray-100">
        Birth Certificate Search
      </h2>

      {/* Search Form */}
      <div className="space-y-6 mb-8">
        <div>
          <label htmlFor="ubrn" className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            UBRN (Unique Birth Registration Number)
          </label>
          <input
            id="ubrn"
            type="text"
            name="ubrn"
            value={searchForm.ubrn}
            onChange={handleSearchChange}
            placeholder="Enter UBRN"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label htmlFor="dob" className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            Date of Birth
          </label>
          <input
            id="dob"
            type="date"
            name="dob"
            value={searchForm.dob}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Search Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Searching...
              </span>
            ) : (
              "Search"
            )}
          </button>

          {searchPerformed && (
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`text-center mb-6 p-3 rounded-lg ${
          message.includes("✅") 
            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
            : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
        }`}>
          {message}
        </div>
      )}

      {/* Search Results */}
      {searchData && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
            Search Results
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {searchResultFields.map((item) => (
              <div key={item.key}>
                <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                  {item.label}
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                  {searchData[item.key] || "N/A"}
                </div>
              </div>
            ))}
          </div>

          {/* Show Full Data Button */}
          <div className="text-center">
            <button
              onClick={handleShowFull}
              className="bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Show Full Data & Edit
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              You will be redirected to the full edit page
            </p>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchPerformed && !searchData && !loading && (
        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No records found. Please check your search criteria and try again.
          </p>
        </div>
      )}
    </div>
  );
}