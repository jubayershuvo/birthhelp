"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Phone,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface UpdateWhatsAppPopupProps {
  isOpen: boolean;
  currentPhone?: string;
}

export default function UpdateWhatsAppPopup({
  isOpen: initialIsOpen = false,
  currentPhone = "",
}: UpdateWhatsAppPopupProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle external isOpen prop changes
  useEffect(() => {
    setIsOpen(initialIsOpen);
  }, [initialIsOpen]);

  // Close popup function
  const handleClose = () => {
    setIsOpen(false);
    setError("");
    setSuccess("");
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone(currentPhone || "");
      setError("");
      setSuccess("");
    }
  }, [isOpen, currentPhone]);

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Only allow numbers and +
    value = value.replace(/[^\d+]/g, "");

    // Auto-add + if not present and starts with number
    if (!value.startsWith("+") && value.length > 0) {
      value = "+" + value;
    }

    setPhone(value);
    setError("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Enhanced validation
    if (!phone.startsWith("+")) {
      setError("Please include country code (e.g., +1)");
      return;
    }

    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    // Remove any spaces or special characters except +
    const cleanedPhone = phone.replace(/[^\d+]/g, "");

    if (cleanedPhone.length < 12) {
      // Minimum: +1 + 10 digits
      setError("Phone number is too short");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post<{
        message?: string;
        error?: string;
      }>(
        "/api/add/whatsapp",
        { phone: cleanedPhone },
        { withCredentials: true }
      );

      if (response.status === 200 || response.status === 201) {
        setSuccess("Verification code sent!");

        // Use toast notification if available
        if (toast) {
          toast.success("Verification code sent to your WhatsApp!");
        }

        // Redirect to verification page
        setTimeout(() => {
          router.push(`/verify?whatsapp=${encodeURIComponent(cleanedPhone)}`);
          handleClose();
        }, 100);
      } else {
        const errorMessage =
          response.data?.error || "Failed to send verification code";
        setError(errorMessage);

        if (toast) {
          toast.error(errorMessage);
        }
      }
    } catch (err: unknown) {
      let errorMessage = "Network error. Please try again.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage =
            err.response.data?.error || `Server error: ${err.response.status}`;
        } else if (err.request) {
          errorMessage =
            "No response from server. Please check your connection.";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      if (toast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Update WhatsApp Number
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter your WhatsApp number for verification
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Phone Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WhatsApp Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+1234567890"
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Include country code (e.g., +1 for US, +44 for UK, +880 for
              Bangladesh)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  {success}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Code
                  <MessageSquare className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              A verification code will be sent to this WhatsApp number. The code
              expires in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
