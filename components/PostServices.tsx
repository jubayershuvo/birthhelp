"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  X,
  File,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface IService {
  _id: string;
  title: string;
  description: string;
  admin_fee: number;
  worker_fee: number;
  reseller_fee: number;
  isAvailable: boolean;
  attachments: { _id: string; name: string }[];
}

interface UploadedFile {
  fileId: string;
  name: string;
  file: File | null;
}

export default function CreatePostPage() {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);

  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Load services
  const loadServices = async () => {
    setLoading(true);
    const res = await fetch("/api/post-services");
    const data = await res.json();
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Upload file
  const uploadFile = async (file: File, name: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.fileId;
  };

  // Submit post
  const handleCreatePost = async () => {
    if (!selectedService) return alert("Please select a service first.");

    // Only check file upload if the service has required attachments
    if (
      selectedService.attachments.length > 0 &&
      uploaded.length !== selectedService.attachments.length
    ) {
      return alert("Please upload all required files.");
    }

    if (!description.trim()) return alert("Description cannot be empty.");

    setSubmitting(true);

    const res = await fetch("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: selectedService._id,
        description: description,
        files: uploaded?.map(({ fileId, name }) => ({ fileId, name })) || [],
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (data.success) {
      window.location.href = "/my-posts";
    } else {
      toast.error(data.message);
    }
  };

  const handleFileSelect = async (file: File, name: string) => {
    setUploadingFile(name);
    try {
      const fileId = await uploadFile(file, name);
      setUploaded((prev) => [...prev, { fileId, name, file }]);
    } catch (error) {
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(null);
    }
  };

  const handleRemoveFile = (name: string) => {
    setUploaded((prev) => prev.filter((item) => item.name !== name));
  };

  const handleServiceSelect = (service: IService) => {
    if (!service.isAvailable) return;

    setSelectedService(service);
    setUploaded([]);
    setDescription(service.description || "");
  };

  const hasRequiredAttachments =
    selectedService && selectedService.attachments.length > 0;
  const progress = hasRequiredAttachments
    ? (uploaded.length / selectedService.attachments.length) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Create New Post
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedService
              ? "Fill in the details to complete your request"
              : "Select a service to get started"}
          </p>
        </div>

        {!selectedService ? (
          // Service Selection Cards
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Available Services
            </h2>

            {loading ? (
              <div className="flex items-center justify-center p-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-500 border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services?.map((service, idx) => (
                  <div
                    key={service._id}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 animate-slide-up group"
                    style={{ animationDelay: `${idx * 100}ms` }}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {service.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                          Service Fee
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {service.admin_fee +
                            service.reseller_fee +
                            service.worker_fee}{" "}
                          <span className="text-sm font-normal">BDT</span>
                        </p>
                      </div>
                      {service.attachments.length > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                            Documents
                          </p>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {service.attachments.length} required
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      className={`w-full mt-4 py-3 ${service.isAvailable ? "bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-purple-600 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-purple-700" : "bg-gray-300 dark:bg-gray-600"} rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg`}
                    >
                      {service.isAvailable ? "Select Service" : "Unavailable"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Selected Service Form
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedService(null);
                setUploaded([]);
                setDescription("");
              }}
              className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back to services</span>
            </button>

            {/* Selected Service Display */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-purple-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 dark:text-blue-200 text-sm mb-2">
                    Selected Service
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    {selectedService.title}
                  </h2>

                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <span className="text-sm">Fee:</span>
                    <span className="text-2xl font-bold">
                      {selectedService.admin_fee +
                        selectedService.reseller_fee +
                        selectedService.worker_fee}{" "}
                      BDT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar - Only show if service has attachments */}
            {hasRequiredAttachments && (
              <div className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {uploaded.length} of {selectedService.attachments.length}{" "}
                    files
                    <span className="ml-2">({Math.round(progress)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-500 dark:to-purple-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 mb-6 border border-gray-200 dark:border-gray-700 shadow-lg animate-slide-up">
              <label className="block mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                Description
              </label>
              <textarea
                rows={10}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900/90 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Provide detailed information about your request..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {description.length} characters
              </p>
            </div>

            {/* Attachments - Only show if service has required attachments */}
            {hasRequiredAttachments && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 mb-6 border border-gray-200 dark:border-gray-700 shadow-lg animate-slide-up">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Required Documents
                </h2>

                <div className="space-y-4">
                  {selectedService.attachments.map((a, idx) => {
                    const found = uploaded.find((u) => u.name === a.name);
                    const isUploading = uploadingFile === a.name;

                    return (
                      <div
                        key={a._id}
                        className="bg-gray-50/50 dark:bg-gray-900/60 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                              {a.name}
                              {isUploading && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent" />
                                  Uploading...
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {found ? "Upload complete" : "Required file"}
                            </p>
                          </div>
                          {found && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                            </div>
                          )}
                        </div>

                        {found ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                                  <File className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    File uploaded successfully
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {found.file && `File: ${found.file.name}`}
                                    <span className="block">
                                      ID: {found.fileId}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveFile(a.name)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                title="Remove file"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="block">
                            <input
                              type="file"
                              accept="application/pdf, image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleFileSelect(e.target.files[0], a.name);
                                }
                              }}
                              disabled={isUploading}
                            />
                            <div
                              className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all ${
                                isUploading
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isUploading
                                  ? "Uploading..."
                                  : "Click to upload or drag and drop"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Images, PDF (Max: 10MB)
                              </p>
                            </div>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Upload Status Summary */}
                {uploaded.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-blue-700 dark:text-blue-400 font-medium">
                            {uploaded.length} of{" "}
                            {selectedService.attachments.length} files uploaded
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {uploaded.length ===
                            selectedService.attachments.length
                              ? "All required files are ready!"
                              : "Please upload all required files to continue."}
                          </p>
                        </div>
                      </div>
                      {uploaded.length > 0 && (
                        <button
                          onClick={() => setUploaded([])}
                          className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional attachments note - Show when service has no required attachments */}
            {!hasRequiredAttachments && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-2xl p-6 md:p-8 mb-6 shadow-lg animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
                    No Documents Required
                  </h3>
                </div>
                <p className="text-green-700 dark:text-green-400 mb-2">
                  This service doesn&apos;t require any additional documents to
                  be uploaded.
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  You can proceed with creating your post by filling out the
                  description above.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCreatePost}
              disabled={
                submitting ||
                (hasRequiredAttachments &&
                  uploaded.length !== selectedService.attachments.length) ||
                !description.trim()
              }
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-purple-600 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-purple-700 rounded-xl text-lg font-bold text-white disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-700 dark:disabled:to-gray-800 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-500/30 disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] mb-6"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Creating...
                </span>
              ) : (
                "Create Post"
              )}
            </button>

            {/* Help Text */}
            {hasRequiredAttachments && uploaded.length > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    You can remove uploaded files by clicking the remove (×)
                    button
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
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

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}