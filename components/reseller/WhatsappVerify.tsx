"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  Shield,
  Smartphone,
} from "lucide-react";
import { useAppDispatch } from "@/lib/hooks";

import axios from "axios";
import { resellerLogin } from "@/lib/resellerSlice";
import { useRouter, useSearchParams } from "next/navigation";

type VerificationStatus = "pending" | "success" | "error";

export default function VerifyWhatsAppOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("pending");
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [otpFromQuery, setOtpFromQuery] = useState("");
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const maxAttempts = 3;
  const dispatch = useAppDispatch();

  // Refs for OTP inputs
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // Format based on length
    if (cleaned.startsWith("+")) {
      if (cleaned.length === 14) {
        // +8801964753086 example
        return `${cleaned.substring(0, 4)} ${cleaned.substring(
          4,
          7
        )} ${cleaned.substring(7, 10)} ${cleaned.substring(10)}`;
      }
    }
    return cleaned;
  };

  // Initialize from URL parameters
  useEffect(() => {
    // Get whatsapp parameter from URL
    const whatsappParam = searchParams.get("whatsapp");
    const otpParam = searchParams.get("otp");

    // Scenario 1: No whatsapp parameter - redirect to signup
    if (!whatsappParam) {
      console.log("No WhatsApp number found, redirecting...");
      setMessage("No WhatsApp number provided. Redirecting to signup...");
      setTimeout(() => {
        router.push("/reseller/signup");
      }, 2000);
      return;
    }

    // Set phone number
    const decodedPhone = decodeURIComponent(whatsappParam);
    setPhoneNumber(decodedPhone);
    setFormattedPhone(formatPhoneNumber(decodedPhone));

    // Scenario 2: Both whatsapp and OTP in query - auto verify
    if (whatsappParam && otpParam) {
      setOtpFromQuery(otpParam);
      setIsAutoVerifying(true);
      autoVerifyWithPhoneAndOtp(decodedPhone, otpParam);
      return;
    }

  }, [searchParams, router]);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, canResend]);

  // Send initial OTP when component loads
  const sendInitialOtp = async (phone: string) => {
    setIsResending(true);
    setMessage("Sending verification code...");

    try {
      const response = await fetch("/api/send-whatsapp-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
        }),
      });

      const data: { error?: string } = await response.json();

      if (response.ok) {
        setMessage("Verification code sent! Please check your WhatsApp.");
        setCanResend(false);
        setCountdown(60); // 60 seconds cooldown
        inputRefs.current[0]?.focus();
      } else {
        setMessage(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Auto verify when both phone and OTP are provided in URL
  const autoVerifyWithPhoneAndOtp = async (
    phoneParam: string,
    otpParam: string
  ) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/reseller/verify-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsapp: phoneParam,
          otp: otpParam,
        }),
      });

      const data: { error?: string; } = await response.json();

      if (response.ok) {
        
        setVerificationStatus("success");
        setMessage(
          "Your WhatsApp number has been successfully verified! Redirecting..."
        );

        // Auto redirect after 2 seconds
        setTimeout(() => {
          router.push("/reseller/profile");
        }, 200);
      } else {
        setVerificationStatus("error");
        setMessage(
          data.error ||
            "Verification failed. Please try manually entering the OTP."
        );
        setIsAutoVerifying(false);
      }
    } catch (error) {
      setVerificationStatus("error");
      setMessage("Network error. Please try manually entering the OTP.");
      setIsAutoVerifying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-focus next input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      setTimeout(() => verifyOtpWithPhone(newOtp.join("")), 100);
    }
  };

  // Handle backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      setTimeout(() => verifyOtpWithPhone(pasteData), 100);
    }
  };

  // Verify OTP with phone number
  const verifyOtpWithPhone = async (otpCode: string) => {
    if (otpCode.length !== 6 || attempts >= maxAttempts || !phoneNumber) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "/api/reseller/verify-whatsapp",
        {
          whatsapp: phoneNumber,
          otp: otpCode,
        },
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      if (response.status === 200) {
        dispatch(resellerLogin(data.user));
        setVerificationStatus("success");
        setMessage(
          "Your WhatsApp has been successfully verified! Redirecting..."
        );

        // Auto redirect after 2 seconds
        setTimeout(() => {
          router.push("/reseller/profile");
        }, 200);
      } else {
        setVerificationStatus("error");
        setAttempts((prev) => prev + 1);

        if (response.status === 400) {
          setMessage("OTP has expired. Please request a new one.");
        } else if (response.status === 429) {
          setMessage("Too many attempts. Please wait before trying again.");
        } else {
          const remainingAttempts =
            data.remainingAttempts ?? maxAttempts - attempts - 1;
          setMessage(
            data.error ||
              `Invalid OTP. ${remainingAttempts} attempts remaining.`
          );

          if (remainingAttempts <= 0) {
            setMessage("Maximum attempts reached. Please request a new OTP.");
          }
        }

        // Clear OTP inputs on error
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setVerificationStatus("error");
      setMessage("Verification failed. Please check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!canResend || !phoneNumber) return;

    setIsResending(true);
    setAttempts(0); // Reset attempts on new OTP
    setOtp(Array(6).fill("")); // Clear current OTP
    setMessage("");
    setVerificationStatus("pending");

    try {
      const response = await fetch("/api/resend-whatsapp-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data: { message?: string } = await response.json();

      if (response.ok) {
        setMessage("New verification code sent! Please check your WhatsApp.");
        setCanResend(false);
        setCountdown(60); // 60 seconds cooldown
        inputRefs.current[0]?.focus();
      } else {
        setMessage(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "success":
        return <CheckCircle2 className="w-16 h-16 text-green-500" />;
      case "error":
        return <XCircle className="w-16 h-16 text-red-500" />;
      case "pending":
      default:
        return isLoading ? (
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        ) : (
          <MessageSquare className="w-16 h-16 text-green-500" />
        );
    }
  };

  const getStatusTitle = () => {
    if (isAutoVerifying) {
      return "Auto-Verifying WhatsApp...";
    }

    switch (verificationStatus) {
      case "success":
        return "WhatsApp Verified Successfully!";
      case "error":
        return "Verification Failed";
      case "pending":
      default:
        return isLoading ? "Verifying OTP..." : "Verify WhatsApp Number";
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "pending":
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const isMaxAttemptsReached = attempts >= maxAttempts;

  // Don't render the form if no phone number (will redirect)
  if (!phoneNumber) {
    return (
      <div className={`min-h-screen transition-colors duration-300`}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Invalid Access
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message || "No WhatsApp number provided. Redirecting..."}
            </p>
            <div className="animate-pulse">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300`}>
      {/* Background with WhatsApp-like gradient */}
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => window.history.back()}
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center min-h-screen px-4 py-12">
          <div className="max-w-md w-full">
            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              {/* Status Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-green-50 dark:bg-green-900/20">
                  {getStatusIcon()}
                </div>
              </div>

              {/* Status Title */}
              <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
                {getStatusTitle()}
              </h1>

              {/* Auto-verifying state */}
              {isAutoVerifying && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Automatically verifying your WhatsApp with the provided
                    code...
                  </p>
                  <div className="flex justify-center">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  </div>
                </div>
              )}

              {/* Description - only show if not auto-verifying and not success */}
              {!isAutoVerifying && verificationStatus === "pending" && (
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  We&apos;ve sent a 6-digit verification code to your WhatsApp
                  number
                </p>
              )}

              {/* WhatsApp Number Display */}
              {formattedPhone && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Verification code sent to:
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                      {formattedPhone}
                    </p>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      WhatsApp
                    </span>
                  </div>
                </div>
              )}

              {/* Success State */}
              {verificationStatus === "success" && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-green-800 dark:text-green-300 font-medium">
                      {message}
                    </p>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Redirecting automatically...
                  </p>
                </div>
              )}

              {/* OTP Input - Only show if not success and not auto-verifying */}
              {verificationStatus !== "success" && !isAutoVerifying && (
                <div className="space-y-6">
                  {/* Show OTP from query if available */}
                  {otpFromQuery && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Using OTP from verification link:{" "}
                        <span className="font-mono font-bold">
                          {otpFromQuery}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* OTP Input Fields */}
                  <div className="flex justify-center space-x-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          if (el) {
                            inputRefs.current[index] = el;
                          }
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isLoading || isMaxAttemptsReached}
                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none ${
                          verificationStatus === "error"
                            ? "border-red-500 focus:ring-red-500"
                            : digit
                            ? "border-green-500 focus:ring-green-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500"
                        } ${
                          isMaxAttemptsReached
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    ))}
                  </div>

                  {/* Manual Verify Button */}
                  <button
                    onClick={() => verifyOtpWithPhone(otp.join(""))}
                    disabled={
                      otp.some((digit) => !digit) ||
                      isLoading ||
                      isMaxAttemptsReached
                    }
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg disabled:shadow-none flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Verify WhatsApp
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {message && verificationStatus === "error" && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-400 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {message}
                      </p>
                    </div>
                  )}

                  {/* Success Message for Resend */}
                  {message &&
                    verificationStatus === "pending" &&
                    message.includes("sent") && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-400 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {message}
                        </p>
                      </div>
                    )}

                  {/* Resend Button */}
                  {/* <button
                    onClick={resendOtp}
                    disabled={isResending || !canResend}
                    className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : !canResend ? (
                      <>
                        <Clock className="w-5 h-5 mr-2" />
                        Resend in {countdown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Resend Code
                      </>
                    )}
                  </button> */}

                  {/* Attempts Counter */}
                  {attempts > 0 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {maxAttempts - attempts} attempts remaining
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                      Didn&apos;t receive the code?
                    </h3>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                      <li>• Make sure you have WhatsApp installed</li>
                      <li>• Check your WhatsApp messages</li>
                      <li>• Ensure the phone number is correct</li>
                      <li>• The code expires in 10 minutes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Need help with verification?
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a
                  href="/reseller/help"
                  className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors flex items-center"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Contact Support
                </a>
                <a
                  href="/reseller/faq"
                  className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors flex items-center"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  FAQ
                </a>
              </div>
            </div>

            {/* WhatsApp Notice */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-start">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">
                    WhatsApp Verification
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your verification code is sent via WhatsApp for secure and
                    instant delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
