// app/(protected)/my-posts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";

interface PostFile {
  name: string;
  fileId: string;
}

interface Post {
  _id: string;
  deal_amount: number;
  service: {
    _id: string;
    title: string;
  };
  amount: number;
  description: string;
  files: PostFile[];
  deliveryFile?: PostFile; //
  status: "pending" | "processing" | "completed" | "cancelled";
  worker?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function MyPostsPage() {
  const { user } = useAppSelector((state) => state.userAuth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/my-posts");
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
        console.log(data.posts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      const response = await fetch(`/api/posts/${deletePostId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.filter((post) => post._id !== deletePostId));
        setIsDeleteModalOpen(false);
        setDeletePostId(null);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportPostId || !reportReason.trim()) {
      setReportError("Please provide a reason for the report");
      return;
    }

    if (reportReason.trim().length < 10) {
      setReportError("Please provide a more detailed reason (at least 10 characters)");
      return;
    }

    setIsSubmittingReport(true);
    setReportError("");

    try {
      const response = await fetch("/api/report/by-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: reportPostId,
          reason: reportReason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {

        
        // Close the modal and reset state
        setIsReportModalOpen(false);
        setReportPostId(null);
        setReportReason("");
        toast.success("Report submitted successfully");
      } else {
        setReportError(data.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      setReportError("An error occurred while submitting the report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleReportClick = (postId: string) => {
    setReportPostId(postId);
    setReportReason("");
    setReportError("");
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportPostId(null);
    setReportReason("");
    setReportError("");
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, { light: string; dark: string }> = {
      pending: {
        light: "bg-yellow-100 text-yellow-800",
        dark: "dark:bg-yellow-900 dark:text-yellow-300"
      },
      processing: {
        light: "bg-blue-100 text-blue-800",
        dark: "dark:bg-blue-900 dark:text-blue-300"
      },
      completed: {
        light: "bg-green-100 text-green-800",
        dark: "dark:bg-green-900 dark:text-green-300"
      },
      cancelled: {
        light: "bg-red-100 text-red-800",
        dark: "dark:bg-red-900 dark:text-red-300"
      },
    };

    const colors = statusColors[status] || { light: "bg-gray-100 text-gray-800", dark: "dark:bg-gray-700 dark:text-gray-300" };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.light} ${colors.dark}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "all") return true;
    return post.status === activeTab;
  });

  const downloadFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`);

      if (response.ok) {
        // 1. Extract file name from headers
        const disposition = response.headers.get("Content-Disposition");
        let fileName = "download";

        if (disposition && disposition.includes("filename=")) {
          fileName = disposition.split("filename=")[1].replace(/"/g, "");
        }

        // 2. Process blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // 3. Trigger file download
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName; // <--- using server name
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
       toast.error("Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleViewDetails = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (postId: string) => {
    setDeletePostId(postId);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletePostId(null);
  };

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isModalOpen) closeModal();
        if (isDeleteModalOpen) closeDeleteModal();
        if (isReportModalOpen) closeReportModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, isDeleteModalOpen, isReportModalOpen]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen || isReportModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isDeleteModalOpen, isReportModalOpen]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Posts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all your service requests</p>
        </div>
        <Link
          href="/post-services"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
        >
          + Create New Request
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab("all")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 ${
              activeTab === "pending"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Pending ({posts.filter((p) => p.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("processing")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 ${
              activeTab === "processing"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Processing ({posts.filter((p) => p.status === "processing").length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 ${
              activeTab === "completed"
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Completed ({posts.filter((p) => p.status === "completed").length})
          </button>
        </nav>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No {activeTab === "all" ? "" : activeTab} posts found</h3>
          {activeTab === "pending" && (
            <Link
              href="/post-services"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
            >
              Create your first request
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md dark:shadow-gray-700/50 transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{post.service.title}</h3>
                      {getStatusBadge(post.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {format(new Date(post.createdAt), "PPP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">৳{post.deal_amount}</span>
                    <div className="relative">
                      <button
                        onClick={() => handleViewDetails(post)}
                        className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{post.description}</p>

                {/* Footer */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-100 dark:border-gray-700 gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {post.status === "processing" && post.worker && (
                      <p>
                        Working on by: <span className="font-medium dark:text-white">{post.worker.name}</span>
                      </p>
                    )}
                    {post.status === "completed" && (
                      <p className="text-green-600 dark:text-green-400 font-medium">✓ Completed and delivered</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Files: {post.files.length}
                    </span>
                    {post.status === "pending" && (
                      <button
                        onClick={() => handleDeleteClick(post._id)}
                        className="inline-flex cursor-pointer items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    )}
                    {post.status === "processing" || post.status === "completed" && (
                      <>
                        <button
                          onClick={() => handleReportClick(post._id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Report
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Details Modal */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Post Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Service</h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPost.service.title}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Deal Amount</h4>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-500">৳{selectedPost.deal_amount}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h4>
                  <div className="inline-block">
                    {getStatusBadge(selectedPost.status)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Post ID</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedPost._id}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedPost.description}</p>
                  </div>
                </div>

                {selectedPost.worker && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Assigned Worker</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Name:</span> {selectedPost.worker.name}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Email:</span> {selectedPost.worker.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Uploaded Files ({selectedPost.files.length})</h4>
                  <div className="space-y-3">
                    {selectedPost.files.length > 0 ? (
                      selectedPost.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center min-w-0">
                            <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => downloadFile(file.fileId)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ml-4 flex-shrink-0 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No files uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Delivery</h4>
                  <div className="space-y-3">
                    {selectedPost.deliveryFile?.fileId  ? (
                        <div
                          key={selectedPost.deliveryFile.fileId}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center min-w-0">
                            <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={selectedPost.deliveryFile.name}>
                              {selectedPost.deliveryFile.name}
                            </span>
                          </div>
                          <button
                            onClick={() => downloadFile(selectedPost.deliveryFile?.fileId || "")}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ml-4 flex-shrink-0 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download
                          </button>
                        </div>
                  
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No files Delivered</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Timestamps</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(selectedPost.createdAt), "PPP 'at' p")}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(selectedPost.updatedAt), "PPP 'at' p")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
            onClick={closeDeleteModal}
          ></div>

          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/30 rounded-full">
                <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                Delete Post?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                This action cannot be undone. This will permanently delete your service request and all associated data.
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
            onClick={closeReportModal}
          ></div>

          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/30 rounded-full">
                <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                Report Issue
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Please provide details about the issue with this service request. This will cancel the request and notify the administrator.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue in detail (at least 10 characters)..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[120px] resize-y"
                  rows={4}
                />
                {reportError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{reportError}</p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {reportReason.length}/10 characters minimum
                </p>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={closeReportModal}
                  disabled={isSubmittingReport}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmittingReport || reportReason.trim().length < 10}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSubmittingReport ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}