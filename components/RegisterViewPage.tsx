"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface ISendData {
  id: string;
  dob: string;
  applicationId: string;
  lastDate: string;
}

interface ViewCorrectionPageProps {
  application: ISendData;
}

export default function ViewCorrectionPage({
  application,
}: ViewCorrectionPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDFWithFetch = async (appId: string) => {
    toast.loading("Downloading PDF...", { id: "pdf" });
    try {
      setIsDownloading(true);
      const response = await fetch(
        `/api/download/application?appId=${appId}&appType=br`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies if needed
        },
      );

      // Check if response is OK
      if (!response.ok) {
        setIsDownloading(false);
        // Try to parse error message
        return toast.error("Faild to download", { id: "pdf" });
      }

      // Get blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${appId}.pdf`;
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!", { id: "pdf" });
    } catch (error) {
      setIsDownloading(false);
      return toast.error("Faild to download", { id: "pdf" });
    }
  };
  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Application Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The requested register application could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Birth Registration Application Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View registration information and details
            </p>
          </div>

          {/* Basic Information */}
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Application ID
              </label>
              <p className="mt-1 font-bold text-gray-900 dark:text-white">
                {application.applicationId}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Date of Birth
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {application.dob}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Submition Date
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {application.lastDate}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            onClick={() => window.history.back()}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => downloadPDFWithFetch(application.applicationId)}
            disabled={isDownloading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isDownloading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Downloading...
              </>
            ) : (
              "Download PDF (10tk)"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
//
