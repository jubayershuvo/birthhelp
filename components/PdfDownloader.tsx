"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function BDRISPrint() {
  const [appId, setAppId] = useState("");
  const [dob, setDob] = useState("");
  const [appType, setAppType] = useState("br");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    pdfUrl?: string;
  } | null>(null);

  const [data, setData] = useState({
    serviceCost: 0,
  });

  const url = new URL(window.location.href);
  const error = url.searchParams.get("error");
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, []);

  const sessionReload = async () => {
    if (loading) return;
    try {
      const response = await fetch("/api/download/session");

      if (response.ok) {
        const newData = await response.json();
        setData(newData);
      } else {
        toast.error("সেশন রিলোড করতে সমস্যা হয়েছে");
      }
    } catch (error) {}
  };

  useEffect(() => {
    sessionReload();
  }, []);

  // Function to parse various date formats and convert to DD/MM/YYYY
  const parseAndFormatDate = (inputDate: string): string => {
    if (!inputDate) return "";

    // Remove any non-digit characters
    const digitsOnly = inputDate.replace(/\D/g, "");

    // Don't format incomplete dates
    if (digitsOnly.length < 6) return inputDate;

    // If input has exactly 8 digits, format as DD/MM/YYYY
    if (digitsOnly.length === 8) {
      const day = digitsOnly.substring(0, 2);
      const month = digitsOnly.substring(2, 4);
      const year = digitsOnly.substring(4, 8);
      return `${day}/${month}/${year}`;
    }

    // Try to parse with different separators
    const separators = ["/", "-", "."];
    let parts: string[] = [];

    for (const sep of separators) {
      if (inputDate.includes(sep)) {
        parts = inputDate.split(sep);
        break;
      }
    }

    // If no separators found, try to parse as 8 digits
    if (parts.length === 0 && digitsOnly.length >= 6) {
      // Try to infer the format
      if (digitsOnly.length === 6) {
        // Assume DDMMYY format
        const day = digitsOnly.substring(0, 2);
        const month = digitsOnly.substring(2, 4);
        const year = digitsOnly.substring(4, 6);
        // Add 2000 to years less than 100
        const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        return `${day}/${month}/${fullYear}`;
      } else if (digitsOnly.length === 8) {
        // Try to determine if it's DDMMYYYY or YYYYMMDD
        const firstTwo = parseInt(digitsOnly.substring(0, 2));
        if (firstTwo > 31) {
          // Likely YYYYMMDD
          const year = digitsOnly.substring(0, 4);
          const month = digitsOnly.substring(4, 6);
          const day = digitsOnly.substring(6, 8);
          return `${day}/${month}/${year}`;
        } else {
          // Likely DDMMYYYY
          const day = digitsOnly.substring(0, 2);
          const month = digitsOnly.substring(2, 4);
          const year = digitsOnly.substring(4, 8);
          return `${day}/${month}/${year}`;
        }
      }
    }

    if (parts.length !== 3) return inputDate;

    // Try to determine the format
    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);
    const third = parseInt(parts[2]);

    // YYYY-MM-DD format
    if (first > 1000 && first < 3000) {
      const year = parts[0].padStart(4, "0");
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${day}/${month}/${year}`;
    }

    // MM-DD-YYYY or DD-MM-YYYY format
    if (first <= 12 && second <= 31) {
      // Assume MM-DD-YYYY
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2].padStart(4, "0");
      return `${day}/${month}/${year}`;
    } else if (first <= 31 && second <= 12) {
      // Assume DD-MM-YYYY
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2].padStart(4, "0");
      return `${day}/${month}/${year}`;
    }

    // Default to DD/MM/YYYY format
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2].padStart(4, "0");
    return `${day}/${month}/${year}`;
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;

    // Only format when the user has finished typing (blur event) or when the date is complete
    // For now, we'll just store the input as is and format on blur
    setDob(inputDate);
  };

  // Format the date when the user leaves the input field
  const handleDateBlur = () => {
    const formattedDate = parseAndFormatDate(dob);
    setDob(formattedDate);
  };
   const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/file/downloader/${fileId}`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Format the date before submitting
    const formattedDate = parseAndFormatDate(dob);

    try {
      // Fetch the PDF
      const response = await fetch(
        `/api/download/pdf?appId=${appId}&dob=${formattedDate}&appType=${appType}`
      );

      // Check if the response is successful
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "ডাউনলোড করতে সমস্যা হয়েছে";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        setLoading(false);
        toast.error(errorMessage);
        setResult({
          type: "error",
          message: errorMessage,
        });
        return;
      }

      const resData = await response.json();

      setLoading(false);
      setAppId("");
      setDob("");

      toast.success("PDF ডাউনলোড সফল হয়েছে");
      handleDownload(resData.file._id, resData.file.name);
      setResult({
        type: "success",
        message: "PDF সফলভাবে ডাউনলোড হয়েছে",
      });
    } catch (error) {
      setLoading(false);
      toast.error("ডাউনলোড করতে সমস্যা হয়েছে");
      setResult({
        type: "error",
        message: "ডাউনলোড করতে সমস্যা হয়েছে",
      });
    }
  };

  return (
    <>
      {/* Full Page Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center">
            <div className="relative w-24 h-24 mb-4">
              <svg
                className="animate-spin w-24 h-24 text-blue-600 dark:text-blue-400"
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
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-blue-800 dark:text-blue-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              PDF প্রস্তুত হচ্ছে
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              অনুগ্রহ করে অপেক্ষা করুন, আপনার ডাউনলোড শীঘ্রই শুরু হবে...
            </p>
            <div className="mt-4 flex space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-3">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  বিডিআরআইএস প্রিন্ট
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                জন্ম ও মৃত্যু নিবন্ধনের যেকোনো আবেদন প্রিন্ট করুন
              </p>
              <p className="text-red-500 dark:text-red-400 mt-2">
                প্রতি বার {data.serviceCost} টাকা করে কাটা হবে
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Application ID */}
              <div>
                <label
                  htmlFor="appId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  আবেদন নম্বর (Application ID)
                </label>
                <input
                  type="text"
                  id="appId"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="যেমন: 257699728"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Date of Birth/Death */}
              <div>
                <label
                  htmlFor="dob"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  জন্ম/মৃত্যু তারিখ (যেকোনো ফরম্যাট)
                </label>
                <input
                  type="text"
                  id="dob"
                  value={dob}
                  onChange={handleDateChange}
                  onBlur={handleDateBlur}
                  placeholder="যেমন: 12/07/1982, 12-07-1982, 1982-07-12, 12071982"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  তারিখটি স্বয়ংক্রিয়ভাবে DD/MM/YYYY ফরম্যাটে রূপান্তরিত হবে
                </p>
              </div>

              {/* Application Type */}
              <div>
                <label
                  htmlFor="appType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  আবেদনের ধরন
                </label>
                <select
                  id="appType"
                  value={appType}
                  onChange={(e) => setAppType(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="br">জন্ম নিবন্ধনের জন্য আবেদন</option>
                  <option value="br_correction">জন্ম তথ্য সংশোধন</option>
                  <option value="br_reprint">জন্ম নিবন্ধন প্রতিলিপি</option>
                  <option value="br_cancel">জন্ম সনদ বাতিলের আবেদন</option>
                  <option value="dr">মৃত্যু নিবন্ধনের জন্য আবেদন</option>
                  <option value="dr_correction">মৃত্যু তথ্য সংশোধন</option>
                  <option value="dr_reprint">মৃত্যু নিবন্ধন প্রতিলিপি</option>
                  <option value="dr_cancel">মৃত্যু সনদ বাতিলের আবেদন</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
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
                    PDF তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    PDF ডাউনলোড করুন
                  </>
                )}
              </button>
              <div className="w-full text-center">
                <Link
                  className="px-4 py-2 w-2/3 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                  href="/file/history"
                >
                  History
                </Link>
              </div>
            </form>

            {/* Result Message */}
            {result && (
              <div
                className={`mt-6 p-4 rounded-lg animate-fade-in ${
                  result.type === "success"
                    ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-800 dark:text-green-300"
                    : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-800 dark:text-red-300"
                }`}
              >
                <div className="flex items-start">
                  {result.type === "success" ? (
                    <svg
                      className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <div className="flex-1">
                    <strong className="block text-sm">
                      {result.type === "success"
                        ? "ডাউনলোড সফল!"
                        : "ডাউনলোড ব্যর্থ!"}
                    </strong>
                    <span className="text-sm mt-1 block">{result.message}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Note */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
              <strong className="block text-yellow-800 dark:text-yellow-300 text-sm mb-2">
                দ্রষ্টব্য:
              </strong>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• আবেদন নম্বর ও সঠিক তারিখ দিতে হবে</li>
                <li>• সার্ভারে কিছু সময় লাগতে পারে (৫-১৫ সেকেন্ড)</li>
                <li>• PDF ডাউনলোড স্বয়ংক্রিয়ভাবে শুরু হবে</li>
                <li>• যদি ডাউনলোড না হয়, ব্রাউজারের পপ-আপ ব্লকার চেক করুন</li>
                <li>• ডাউনলোড লিঙ্ক ২৪ ঘন্টা বৈধ থাকবে</li>
                <li>
                  • তারিখ যেকোনো ফরম্যাটে দিতে পারেন, স্বয়ংক্রিয়ভাবে
                  DD/MM/YYYY হবে
                </li>
                <li>• ফিল্ড থেকে বের হলে তারিখ স্বয়ংক্রিয়ভাবে ফরম্যাট হবে</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add custom animations */}
        <style jsx global>{`
          @import url("https://fonts.maateen.me/solaiman-lipi/font.css");

          body {
            font-family: "SolaimanLipi", Arial, sans-serif;
          }

          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </>
  );
}
