"use client";

import React from "react";

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
  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Application Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The requested correction application could not be found.
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
              Correction Application Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View correction information and details
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
        </div>
      </div>
    </div>
  );
}
//
