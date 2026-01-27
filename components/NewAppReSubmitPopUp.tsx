// components/ReSubmitPopup.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Phone,
  Mail,
  Key,
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

export interface Attachment {
  id: number;
  name: string;
  type: string;
  size: number;
  _id: string;
}

export interface PersonInfoForBirth {
  personFirstNameBn: string;
  personLastNameBn: string;
  personNameBn: string;
  personFirstNameEn: string;
  personLastNameEn: string;
  personNameEn: string;
  personBirthDate: string;
  thChild: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  religion: string;
  religionOther: string;
  personNid: string;
  _id: string;
}

export interface ParentInfo {
  personNameBn: string;
  personNameEn: string;
  personNationality: string;
  personNid: string;
  passportNumber: string;
  ubrn: string;
  personBirthDate: string;
  _id: string;
}

export interface Application {
  _id: string;
  csrf: string;
  otp: string;
  user: string;
  status: "submitted" | "pending" | "approved" | "rejected" | "processing";
  applicationId: string;
  printLink: string;
  cost: number;
  lastDate: string;
  cookies: string[];
  officeAddressType: "PERMANENT" | "BIRTHPLACE" | "PRESENT";
  officeAddrCountry: string;
  officeAddrCity: string;
  officeAddrDivision: string;
  officeAddrDistrict: string;
  officeAddrCityCorpCantOrUpazila: string;
  officeAddrPaurasavaOrUnion: string;
  officeAddrWard: string;
  officeAddrOffice: string;
  personInfoForBirth: PersonInfoForBirth;
  father: ParentInfo;
  mother: ParentInfo;
  birthPlaceCountry: string;
  birthPlaceDiv: string;
  birthPlaceDist: string;
  birthPlaceCityCorpCantOrUpazila: string;
  birthPlacePaurasavaOrUnion: string;
  birthPlaceWardInPaurasavaOrUnion: string;
  birthPlaceVilAreaTownBn: string;
  birthPlaceVilAreaTownEn: string;
  birthPlacePostOfc: string;
  birthPlacePostOfcEn: string;
  birthPlaceHouseRoadBn: string;
  birthPlaceHouseRoadEn: string;
  copyBirthPlaceToPermAddr: "yes" | "no";
  permAddrCountry: string;
  permAddrDiv: string;
  permAddrDist: string;
  permAddrCityCorpCantOrUpazila: string;
  permAddrPaurasavaOrUnion: string;
  permAddrWardInPaurasavaOrUnion: string;
  copyPermAddrToPrsntAddr: "yes" | "no";
  prsntAddrCountry: string;
  prsntAddrDiv: string;
  prsntAddrDist: string;
  prsntAddrCityCorpCantOrUpazila: string;
  prsntAddrPaurasavaOrUnion: string;
  prsntAddrWardInPaurasavaOrUnion: string;
  applicantName: string;
  phone: string;
  email: string;
  relationWithApplicant: "SELF" | "FATHER" | "MOTHER" | "GUARDIAN";
  attachments: Attachment[];
  declaration: "on" | "off";
  personImage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ReSubmitPopupProps {
  application: Application;
  sessionData: { cookies: string[]; csrf: string };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (submissionId: string) => void;
}

const ReSubmitPopup: React.FC<ReSubmitPopupProps> = ({
  application,
  sessionData,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [phone, setPhone] = useState(
    application.phone.replace("+88", "") || "",
  );
  const [email, setEmail] = useState(application.email || "");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [lastSentPhone, setLastSentPhone] = useState<string>("");
  const [showOtpExpiredWarning, setShowOtpExpiredWarning] = useState(false);

  const prevPhoneRef = useRef(phone);
  const otpExpiredRef = useRef(false);

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      const oldPhone = application.phone.replace("+88", "");
      setPhone(oldPhone);
      setLastSentPhone(oldPhone);
      setEmail(application.email || "");
      setOtp("");
      setIsOtpSent(false);
      setOtpCountdown(0);
      setPhoneValid(true);
      setEmailValid(true);
      setShowOtpExpiredWarning(false);
      prevPhoneRef.current = oldPhone;
      otpExpiredRef.current = false;
    }
  }, [isOpen, application]);

  // Handle OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            // OTP expired
            clearInterval(interval);
            if (!otpExpiredRef.current) {
              otpExpiredRef.current = true;
              setShowOtpExpiredWarning(true);
              toast.error("OTP এর মেয়াদ শেষ হয়েছে। নতুন OTP পাঠান।", {
                duration: 5000,
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpCountdown]);

  // Reset OTP state when phone number changes
  useEffect(() => {
    if (isOpen && prevPhoneRef.current !== phone) {
      // Check if phone number actually changed (not just initial render)
      if (prevPhoneRef.current && phone !== prevPhoneRef.current) {
        // Reset OTP state for new phone number
        setIsOtpSent(false);
        setOtpCountdown(0);
        setOtp("");
        setShowOtpExpiredWarning(false);
        otpExpiredRef.current = false;
      }
      prevPhoneRef.current = phone;
    }
  }, [phone, isOpen]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const validatePhone = (phone: string) => {
    const regex = /^01[0-9]{9}$/;
    return regex.test(phone);
  };

  const validateEmail = (email: string) => {
    if (!email) return true; // Email is optional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value) {
      const isValid = validatePhone(value);
      setPhoneValid(isValid);
      if (!isValid) {
        // If phone becomes invalid, reset OTP state
        setIsOtpSent(false);
        setOtpCountdown(0);
      }
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      setEmailValid(validateEmail(value));
    }
  };

  const handleUseOldNumber = () => {
    const oldPhone = application.phone.replace("+88", "");
    setPhone(oldPhone);
    setPhoneValid(true);
    // Keep OTP state if already sent to this number
    if (lastSentPhone === oldPhone && isOtpSent && otpCountdown > 0) {
      // Don't reset OTP for same number
      return;
    }
    // Reset OTP state
    setIsOtpSent(false);
    setOtpCountdown(0);
    setOtp("");
    setShowOtpExpiredWarning(false);
  };

  const handleSendOTP = async () => {
    // Validate phone
    if (!phone) {
      toast.error("মোবাইল নম্বর পূরণ করুন");
      setPhoneValid(false);
      return;
    }

    if (!validatePhone(phone)) {
      toast.error(
        "মোবাইল নম্বর সঠিকভাবে পূরণ করুন (01 দিয়ে শুরু করে 11 সংখ্যা)",
      );
      setPhoneValid(false);
      return;
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      toast.error("ইমেইল ঠিকানা সঠিকভাবে পূরণ করুন");
      setEmailValid(false);
      return;
    }

    try {
      setResendLoading(true);
      setShowOtpExpiredWarning(false);
      toast.loading("OTP পাঠানো হচ্ছে...", { id: "otp-send" });

      const response = await fetch("/api/birth/application/registration/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: `+88${phone}`,
          personName: `${application.personInfoForBirth.personFirstNameBn} ${application.personInfoForBirth.personLastNameBn}`,
          ubrn: application.father?.ubrn || "",
          relation: application.relationWithApplicant,
          email: email || "",
          csrf: sessionData.csrf,
          cookies: sessionData.cookies,
          officeAddressType: application.officeAddressType,
          officeId: application.officeAddrOffice,
          isResubmit: true,
          originalApplicationId: application._id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpCountdown(600); // 10 minutes = 600 seconds
        setIsOtpSent(true);
        setLastSentPhone(phone);
        setOtp(""); // Clear previous OTP
        otpExpiredRef.current = false;

        toast.success("OTP সফলভাবে পাঠানো হয়েছে", { id: "otp-send" });

        // Auto-focus OTP input
        setTimeout(() => {
          const otpInput = document.querySelector(
            'input[placeholder*="OTP"]',
          ) as HTMLInputElement;
          if (otpInput) otpInput.focus();
        }, 100);
      } else {
        toast.error(data.error?.message || "OTP পাঠাতে সমস্যা হয়েছে", {
          id: "otp-send",
        });
      }
    } catch (error) {
      console.error("OTP sending error:", error);
      toast.error("OTP পাঠাতে সমস্যা হয়েছে");
    } finally {
      setResendLoading(false);
    }
  };

  const handleResendOTP = async () => {
    await handleSendOTP();
  };

  const handleVerifyAndSubmit = async () => {
    if (!otp) {
      toast.error("OTP পূরণ করুন");
      return;
    }

    if (otp.length !== 6) {
      toast.error("OTP 6 সংখ্যার হতে হবে");
      return;
    }

    if (isOtpSent && otpCountdown <= 0) {
      toast.error("OTP এর মেয়াদ শেষ হয়েছে। নতুন OTP পাঠান।");
      return;
    }

    // Check if OTP was sent to current phone number
    if (phone !== lastSentPhone) {
      toast.error("এই নম্বরে OTP পাঠানো হয়নি। নতুন OTP পাঠান।");
      return;
    }

    try {
      setLoading(true);
      toast.loading("OTP যাচাই করা হচ্ছে...", { id: "otp-verify" });

      // Step 1: Verify OTP
      const otpResponse = await fetch(
        "/api/birth/application/registration/otp-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personUbrn: application.father?.ubrn || "",
            cookies: sessionData.cookies,
            csrf: sessionData.csrf,
            otp: otp,
            email: email,
            phone: `+88${phone}`,
          }),
        },
      );

      const otpData = await otpResponse.json();

      if (otpData.data?.isVerified !== true) {
        toast.error("OTP যাচাই ব্যর্থ হয়েছে", { id: "otp-verify" });
        return;
      }

      toast.success("OTP সফলভাবে যাচাই হয়েছে", { id: "otp-verify" });

      // Step 2: Prepare submission data
      const submissionData = {
        csrf: sessionData.csrf,
        otp: otp,
        cookies: sessionData.cookies,
        officeAddressType: application.officeAddressType,
        officeAddrCountry: application.officeAddrCountry,
        officeAddrDivision: application.officeAddrDivision,
        officeAddrDistrict: application.officeAddrDistrict,
        officeAddrCityCorpCantOrUpazila:
          application.officeAddrCityCorpCantOrUpazila,
        officeAddrPaurasavaOrUnion: application.officeAddrPaurasavaOrUnion,
        officeAddrWard: application.officeAddrWard,
        officeAddrCity: application.officeAddrCity,
        officeAddrOffice: application.officeAddrOffice,
        personInfoForBirth: application.personInfoForBirth,
        father: application.father,
        mother: application.mother,
        birthPlaceCountry: application.birthPlaceCountry,
        birthPlaceDiv: application.birthPlaceDiv,
        birthPlaceDist: application.birthPlaceDist,
        birthPlaceCityCorpCantOrUpazila:
          application.birthPlaceCityCorpCantOrUpazila,
        birthPlacePaurasavaOrUnion: application.birthPlacePaurasavaOrUnion,
        birthPlaceWardInPaurasavaOrUnion:
          application.birthPlaceWardInPaurasavaOrUnion,
        birthPlaceVilAreaTownBn: application.birthPlaceVilAreaTownBn,
        birthPlaceVilAreaTownEn: application.birthPlaceVilAreaTownEn,
        birthPlacePostOfc: application.birthPlacePostOfc,
        birthPlacePostOfcEn: application.birthPlacePostOfcEn,
        birthPlaceHouseRoadBn: application.birthPlaceHouseRoadBn,
        birthPlaceHouseRoadEn: application.birthPlaceHouseRoadEn,
        copyBirthPlaceToPermAddr: application.copyBirthPlaceToPermAddr,
        permAddrCountry: application.permAddrCountry,
        permAddrDiv: application.permAddrDiv,
        permAddrDist: application.permAddrDist,
        permAddrCityCorpCantOrUpazila:
          application.permAddrCityCorpCantOrUpazila,
        permAddrPaurasavaOrUnion: application.permAddrPaurasavaOrUnion,
        permAddrWardInPaurasavaOrUnion:
          application.permAddrWardInPaurasavaOrUnion,
        copyPermAddrToPrsntAddr: application.copyPermAddrToPrsntAddr,
        prsntAddrCountry: application.prsntAddrCountry,
        prsntAddrDiv: application.prsntAddrDiv,
        prsntAddrDist: application.prsntAddrDist,
        prsntAddrCityCorpCantOrUpazila:
          application.prsntAddrCityCorpCantOrUpazila,
        prsntAddrPaurasavaOrUnion: application.prsntAddrPaurasavaOrUnion,
        prsntAddrWardInPaurasavaOrUnion:
          application.prsntAddrWardInPaurasavaOrUnion,
        applicantName: application.applicantName,
        phone: `+88${phone}`,
        email: email,
        relationWithApplicant: application.relationWithApplicant,
        attachments: application.attachments,
        declaration: application.declaration,
        personImage: application.personImage,
        isResubmit: true,
        originalApplicationId: application._id,
        cost: application.cost,
        lastDate: application.lastDate,
      };

      // Step 3: Submit the application
      toast.loading("আবেদন জমা দেওয়া হচ্ছে...", { id: "resubmit" });

      const submitResponse = await fetch(
        `/api/birth/application/registration?id=${application._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        },
      );

      const submitData = await submitResponse.json();

      if (submitData.success) {
        toast.success("আবেদন সফলভাবে পুনঃজমা দেওয়া হয়েছে!", {
          id: "resubmit",
          duration: 5000,
        });

        onSuccess(submitData.id || submitData.applicationId);
        onClose();
      } else {
        toast.error(submitData.error || "আবেদন জমা দিতে সমস্যা হয়েছে", {
          id: "resubmit",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("আবেদন জমা দিতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const canSendOTP = phone && phoneValid && !resendLoading;
  const canSubmit = otp.length === 6 && !loading && phoneValid;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                আবেদন পুনঃজমা দিন
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                আবেদন আইডি: {application.applicationId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Application Info */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-300 font-semibold">
                  {application.personInfoForBirth.personNameEn.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {application.personInfoForBirth.personNameEn}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {application.personInfoForBirth.personNameBn}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    application.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}
                >
                  {application.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  পূর্বের নম্বর:
                </span>
                <p className="font-medium">{application.phone}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  আবেদনকারী:
                </span>
                <p className="font-medium">{application.applicantName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body - Single Step */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Email Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ইমেইল ঠিকানা
                </label>
                {email && !emailValid && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    সঠিক ইমেইল নয়
                  </div>
                )}
                {email && emailValid && (
                  <div className="flex items-center gap-1 text-emerald-500 text-sm">
                    <Check className="w-4 h-4" />
                    সঠিক ইমেইল
                  </div>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 border ${
                    emailValid
                      ? "border-gray-300 dark:border-gray-700"
                      : "border-red-300 dark:border-red-700"
                  } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ইমেইল ঐচ্ছিক, তবে সুপারিশকৃত
              </p>
            </div>
            {/* Phone Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                {phone === application.phone.replace("+88", "") && (
                  <button
                    onClick={handleUseOldNumber}
                    className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  >
                    পূর্বের নম্বর ব্যবহার করুন
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className={`w-full pl-10 pr-4 py-3 border ${
                      phoneValid
                        ? "border-gray-300 dark:border-gray-700"
                        : "border-red-300 dark:border-red-700"
                    } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={!canSendOTP}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                    !canSendOTP
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  {resendLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isOtpSent && phone === lastSentPhone
                        ? "নতুন OTP"
                        : "OTP পাঠান"}
                    </>
                  )}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  01 দিয়ে শুরু করে 11 সংখ্যা
                </p>
                {phone !== lastSentPhone && isOtpSent && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    নম্বর পরিবর্তন হয়েছে
                  </p>
                )}
              </div>
            </div>

            {/* OTP Section - ALWAYS VISIBLE */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  OTP <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {isOtpSent && phone === lastSentPhone && otpCountdown > 0 && (
                    <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(otpCountdown)}</span>
                    </div>
                  )}
                  {showOtpExpiredWarning && (
                    <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>মেয়াদ শেষ</span>
                    </div>
                  )}
                  <button
                    onClick={handleResendOTP}
                    disabled={
                      !canSendOTP ||
                      (isOtpSent && phone === lastSentPhone && otpCountdown > 0)
                    }
                    className={`text-sm px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      !canSendOTP ||
                      (isOtpSent && phone === lastSentPhone && otpCountdown > 0)
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${resendLoading ? "animate-spin" : ""}`}
                    />
                    {resendLoading ? "পাঠানো হচ্ছে..." : "পুনঃপ্রেরণ"}
                  </button>
                </div>
              </div>

              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6 সংখ্যার OTP লিখুন"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    গুরুত্বপূর্ণ তথ্য
                  </p>
                  <ul className="space-y-1.5 text-sm text-amber-700 dark:text-amber-400">
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>নম্বর পরিবর্তন করলে পূর্বের OTP বাতিল হবে</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>
                        OTP ১০ মিনিটের জন্য বৈধ (সর্বোচ্চ ২ বার পুনঃপ্রেরণ করা
                        যাবে)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>
                        পূর্বের নম্বর ব্যবহার করতে &quot;পূর্বের নম্বর ব্যবহার
                        করুন&quot; বাটনে ক্লিক করুন
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>OTP যাচাই না করলে আবেদন জমা দেওয়া যাবে না</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              বাতিল করুন
            </button>

            <button
              onClick={handleVerifyAndSubmit}
              disabled={!canSubmit}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                !canSubmit
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  প্রক্রিয়াকরণ...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  যাচাই করুন ও জমা দিন
                </>
              )}
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {!isOtpSent
                ? "OTP পাঠান"
                : phone !== lastSentPhone
                  ? "নতুন নম্বরে OTP পাঠান"
                  : otpCountdown <= 0
                    ? "OTP মেয়াদোত্তীর্ণ"
                    : `OTP সক্রিয়: ${formatTime(otpCountdown)}`}
            </div>
            <div className="flex items-center gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isOtpSent && phone === lastSentPhone && otpCountdown > 0 && (
                  <>
                    {Math.floor(otpCountdown / 60)} মিনিট {otpCountdown % 60}{" "}
                    সেকেন্ড
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReSubmitPopup;
