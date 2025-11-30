"use client";

import axios from "axios";
import { useEffect, useState } from "react";

interface File {
  _id: string;
  user: string;
  path: string;
  name: string;
  type: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function FileHistory() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getFiles() {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/file", { withCredentials: true });
      setFiles(res.data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getFiles();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              File History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and download your uploaded files
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
                Loading files...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              File History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and download your uploaded files
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                {error}
              </p>
              <button
                onClick={getFiles}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            File History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and download your uploaded files
          </p>
        </div>

        {/* Files List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Uploaded Files ({files.length})
            </h2>
          </div>

          {files.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No files found
              </p>
              <button
                onClick={getFiles}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {files.map((file, index) => (
                <div
                  key={file._id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {file.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            {file.name}.{file.type}
                          </span>
                          <span className="flex items-center">
                            {formatDate(file.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(file._id, file.name)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3">
            <div className="flex items-center">

              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Files
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {files.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3">
            <div className="flex items-center">

              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  PDF Files
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {files.filter((f) => f.type === "pdf").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3">
            <div className="flex items-center">

              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last File
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {files.length > 0 ? formatDate(files[0].createdAt) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}