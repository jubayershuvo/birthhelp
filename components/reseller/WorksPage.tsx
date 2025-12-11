// app/(protected)/works/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/lib/hooks";
import { format } from "date-fns";

interface PostFile {
  name: string;
  fileId: string;
  _id: string;
}

interface Service {
  _id: string;
  title: string;
  admin_fee: number;
  worker_fee: number;
  reseller_fee: number;
  attachments: Array<{
    name: string;
    _id: string;
  }>;
}

interface Post {
  _id: string;
  service: Service;
  user: string;
  worker?: string;
  description: string;
  admin_fee: number;
  worker_fee: number;
  reseller_fee: number;
  files: PostFile[];
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  deliveryFile?: {
    name: string;
    fileId: string;
    path?: string;
    uploadedAt?: string;
  };
}

export default function WorksFinderPage() {
  const { user } = useAppSelector((state) => state.userAuth);
  const [availablePosts, setAvailablePosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );
  const [acceptingPostId, setAcceptingPostId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [completingPostId, setCompletingPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchAllPosts();
    }
  }, [user]);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);

      // Fetch available works (pending posts)
      const availableResponse = await fetch("/api/reseller/works");
      const availableData = await availableResponse.json();

      // Fetch my accepted works
      const myWorksResponse = await fetch("/api/reseller/works/my");
      const myWorksData = await myWorksResponse.json();

      if (availableData.success) {
        console.log("Available posts:", availableData.posts);
        setAvailablePosts(availableData.posts || []);
      } else {
        console.error("Failed to fetch available works:", availableData);
      }

      if (myWorksData.success) {
        console.log("My posts:", myWorksData.posts);
        setMyPosts(myWorksData.posts || []);
      } else {
        console.error("Failed to fetch my works:", myWorksData);
      }
    } catch (error) {
      console.error("Error fetching works:", error);
      setMessage({
        type: "error",
        text: "Failed to load works",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptWork = async (postId: string) => {
    if (!user) {
      setMessage({
        type: "error",
        text: "You must be logged in to accept work",
      });
      return;
    }

    try {
      setAcceptingPostId(postId);
      setMessage(null);

      const response = await fetch(`/api/reseller/works/accept/${postId}`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Successfully accepted the work!",
        });

        // Remove the accepted post from available posts
        const acceptedPost = availablePosts.find((post) => post._id === postId);
        if (acceptedPost) {
          setAvailablePosts((prev) =>
            prev.filter((post) => post._id !== postId)
          );

          // Add to my posts with updated status
          setMyPosts((prev) => [
            {
              ...acceptedPost,
              status: "processing",
              worker: user._id,
            },
            ...prev,
          ]);
        }

        setSelectedPost(null);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to accept work",
        });
      }
    } catch (error) {
      console.error("Error accepting work:", error);
      setMessage({
        type: "error",
        text: "Failed to accept work",
      });
    } finally {
      setAcceptingPostId(null);
    }
  };

  const handleCompleteWork = async (postId: string) => {
    if (!selectedFile) {
      setMessage({
        type: "error",
        text: "Please select a delivery file",
      });
      return;
    }

    try {
      setCompletingPostId(postId);
      setUploading(true);
      setMessage(null);

      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileName", fileName || selectedFile.name);

      const response = await fetch(`/api/reseller/works/complete/${postId}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Work marked as completed successfully!",
        });

        // Update the post in my posts
        setMyPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  status: "completed",
                  deliveryFile: data.post.deliveryFile,
                }
              : post
          )
        );

        // Update selected post if it's open
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  status: "completed",
                  deliveryFile: data.post.deliveryFile,
                }
              : null
          );
        }

        setSelectedPost(null);
        setSelectedFile(null);
        setFileName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to complete work",
        });
      }
    } catch (error) {
      console.error("Error completing work:", error);
      setMessage({
        type: "error",
        text: "Failed to complete work",
      });
    } finally {
      setUploading(false);
      setCompletingPostId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file && !fileName) {
      setFileName(file.name);
    }
  };

  const downloadFile = async (fileId: string, fileName?: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`);

      if (response.ok) {
        // 1. Extract file name from headers or use provided name
        const disposition = response.headers.get("Content-Disposition");
        let downloadFileName = fileName || "download";

        if (disposition && disposition.includes("filename=")) {
          downloadFileName = disposition
            .split("filename=")[1]
            .replace(/"/g, "");
        }

        // 2. Process blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // 3. Trigger file download
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setMessage({
          type: "error",
          text: "Failed to download file",
        });
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      setMessage({
        type: "error",
        text: "Error downloading file",
      });
    }
  };

  const downloadDeliveryFile = async (post: Post) => {
    if (!post.deliveryFile) {
      setMessage({
        type: "error",
        text: "No delivery file available",
      });
      return;
    }

    try {
      await downloadFile(post.deliveryFile.fileId, post.deliveryFile.name);
    } catch (error) {
      console.error("Error downloading delivery file:", error);
      setMessage({
        type: "error",
        text: "Failed to download delivery file",
      });
    }
  };

  const getFilteredPosts = () => {
    if (activeTab === "available") {
      return availablePosts;
    } else if (activeTab === "my_works") {
      return myPosts.filter((post) => post.status === "processing");
    } else if (activeTab === "completed") {
      return myPosts.filter((post) => post.status === "completed");
    } else if (activeTab === "cancelled") {
      return myPosts.filter((post) => post.status === "cancelled");
    }
    return [];
  };

  // Close modal when clicking outside or pressing ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPost(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (selectedPost && target.classList.contains("modal-backdrop")) {
        setSelectedPost(null);
        // Clear file selection when closing modal
        setSelectedFile(null);
        setFileName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    if (selectedPost) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("click", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [selectedPost]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Find Works
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Browse and accept available service requests
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "error"
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
          }`}
        >
          <div className="flex items-center">
            {message.type === "error" ? (
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab("available")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "available"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Available Works ({availablePosts.length})
          </button>
          <button
            onClick={() => setActiveTab("my_works")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "my_works"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            My Active Works (
            {myPosts.filter((p) => p.status === "processing").length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "completed"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Completed ({myPosts.filter((p) => p.status === "completed").length})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`mr-6 py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "cancelled"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Cancelled ({myPosts.filter((p) => p.status === "cancelled").length})
          </button>
        </nav>
      </div>

      {/* Works List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {activeTab === "available"
              ? "No available works at the moment"
              : activeTab === "my_works"
              ? "You don't have any active works"
              : activeTab === "completed"
              ? "No completed works yet"
              : "No cancelled works"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === "available"
              ? "Check back later for new service requests"
              : "Accept available works to get started"}
          </p>
          <button
            onClick={fetchAllPosts}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-md dark:hover:shadow-gray-800 transition-shadow overflow-hidden"
            >
              <div className="p-6">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        : post.status === "processing"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        : post.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(post.createdAt), "MMM d")}
                  </span>
                </div>

                {/* Service Info */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {post.service?.title || "Untitled Service"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {post.description || "No description provided"}
                </p>

                {/* Files */}
                {post.files && post.files.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Required Files:
                    </p>
                    <div className="space-y-1">
                      {post.files.slice(0, 3).map((file, index) => (
                        <div
                          key={file._id || index}
                          className="flex items-center text-sm"
                        >
                          <span className="text-gray-500 dark:text-gray-400 mr-2">
                            •
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {file.name}
                          </span>
                        </div>
                      ))}
                      {post.files.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{post.files.length - 3} more files
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery File (for completed posts in list view) */}
                {post.status === "completed" && post.deliveryFile && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery File:
                    </p>
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {post.deliveryFile.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDeliveryFile(post);
                        }}
                        className="ml-2 p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 focus:outline-none"
                        title="Download delivery file"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Price & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ৳{post.worker_fee || 0}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Payment
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      View
                    </button>

                    {activeTab === "available" && (
                      <button
                        onClick={() => handleAcceptWork(post._id)}
                        disabled={acceptingPostId === post._id}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
                          acceptingPostId === post._id
                            ? "bg-blue-400 dark:bg-blue-600 text-white cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                        }`}
                      >
                        {acceptingPostId === post._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1.5"></div>
                            Accepting...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Accept Work
                          </>
                        )}
                      </button>
                    )}

                    {activeTab === "my_works" &&
                      post.status === "processing" && (
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setSelectedFile(null);
                            setFileName("");
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                        >
                          <svg
                            className="w-4 h-4 mr-1.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Complete
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 modal-backdrop"
            onClick={() => {
              setSelectedPost(null);
              setSelectedFile(null);
              setFileName("");
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          ></div>

          {/* Modal Content */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedPost.service?.title || "Work Details"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ID: {selectedPost._id}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPost(null);
                        setSelectedFile(null);
                        setFileName("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Status */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Status
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPost.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : selectedPost.status === "processing"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : selectedPost.status === "completed"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {selectedPost.status.charAt(0).toUpperCase() +
                          selectedPost.status.slice(1)}
                      </span>
                    </div>

                    {/* Price */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Amount
                      </h4>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ৳{selectedPost.worker || 0}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          payment
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Description
                      </h4>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {selectedPost.description ||
                            "No description provided"}
                        </p>
                      </div>
                    </div>

                    {/* Original Files */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Required Files
                      </h4>
                      {selectedPost.files && selectedPost.files.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPost.files.map((file, index) => (
                            <div
                              key={file._id || index}
                              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-700/30"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <svg
                                    className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                    {file.name}
                                  </span>
                                </div>
                              </div>
                              {selectedPost.status === "processing" && (
                                <button
                                  onClick={() =>
                                    downloadFile(
                                      file.fileId || file._id,
                                      file.name
                                    )
                                  }
                                  className="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 flex-shrink-0"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Download
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                          <p className="text-gray-500 dark:text-gray-400">
                            No files required
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Delivery File Upload for Processing Posts */}
                    {selectedPost.status === "processing" && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-3">
                          📤 Upload Delivery File
                        </h4>

                        {/* File Input */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select File
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400
                              hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                          />
                        </div>

                        {/* File Name Input */}
                        {selectedFile && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              File Display Name
                            </label>
                            <input
                              type="text"
                              value={fileName}
                              onChange={(e) => setFileName(e.target.value)}
                              placeholder="Enter a name for this file"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Original: {selectedFile.name} (
                              {Math.round(selectedFile.size / 1024)}KB)
                            </p>
                          </div>
                        )}

                        {/* Upload Status */}
                        {uploading && completingPostId === selectedPost._id && (
                          <div className="flex items-center text-blue-600 dark:text-blue-400 mb-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent mr-2"></div>
                            Uploading and completing work...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display Delivery File for Completed Posts */}
                    {selectedPost.status === "completed" &&
                      selectedPost.deliveryFile && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-green-900 dark:text-green-300 mb-3">
                            ✅ Delivery File
                          </h4>
                          <div className="flex items-center justify-between p-3 border border-green-200 dark:border-green-700 rounded-lg bg-white dark:bg-gray-700">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <svg
                                  className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {selectedPost.deliveryFile.name}
                                </span>
                              </div>
                              {selectedPost.deliveryFile.uploadedAt && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Delivered on:{" "}
                                  {format(
                                    new Date(
                                      selectedPost.deliveryFile.uploadedAt
                                    ),
                                    "PPpp"
                                  )}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => downloadDeliveryFile(selectedPost)}
                              className="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 flex-shrink-0"
                            >
                              <svg
                                className="w-4 h-4 mr-1.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Download
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Timestamps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Created
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {format(new Date(selectedPost.createdAt), "PPpp")}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Last Updated
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {format(new Date(selectedPost.updatedAt), "PPpp")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedPost(null);
                        setSelectedFile(null);
                        setFileName("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                    >
                      Close
                    </button>

                    {selectedPost.status === "pending" && (
                      <button
                        onClick={() => handleAcceptWork(selectedPost._id)}
                        disabled={acceptingPostId === selectedPost._id}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
                          acceptingPostId === selectedPost._id
                            ? "bg-blue-400 dark:bg-blue-600 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        }`}
                      >
                        {acceptingPostId === selectedPost._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1.5 inline-block"></div>
                            Accepting...
                          </>
                        ) : (
                          "Accept This Work"
                        )}
                      </button>
                    )}

                    {selectedPost.status === "processing" && (
                      <button
                        onClick={() => handleCompleteWork(selectedPost._id)}
                        disabled={uploading || !selectedFile}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 ${
                          uploading || !selectedFile
                            ? "bg-green-400 dark:bg-green-600 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        }`}
                      >
                        {uploading && completingPostId === selectedPost._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1.5 inline-block"></div>
                            Completing...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-1.5 inline-block"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Mark as Complete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
