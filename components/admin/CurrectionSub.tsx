"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

interface Address {
  vilAreaTownBn: string;
  vilAreaTownEn: string;
}

interface CorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
  _id: string;
}

interface File {
  name: string;
  url: string;
  fileType: string;
  _id: string;
}

interface Application {
  _id: string;
  ubrn: string;
  dob: string;
  submit_status: string;
  applicationId: string;
  correctionInfos: CorrectionInfo[];
  files: File[];
  addresses: {
    birthPlace: Address;
    permAddress: Address;
    prsntAddress: Address;
  };
  createdAt: string;
}

interface SessionData {
  cookies: string[];
  csrf: string;
  captchaSrc: string;
}

interface CorrectionDetailsProps {
  params: {
    id: string;
  };
}

const CorrectionDetailsPage = ({ params }: CorrectionDetailsProps) => {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(true);
  const [timer, setTimer] = useState(0);
  const [showSubmitSection, setShowSubmitSection] = useState(true);
  const [applicant, setApplicant] = useState({
    applicantName: "",
    applicantBrn: "",
    applicantDob: "",
  });
  const [captchaAns, setCaptchaAns] = useState("");

  useEffect(() => {
    fetchApplication();
  }, [params.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/currection-application-req/${params.id}`,
      );
      setApplication(response.data.currection);
      setSession(response.data.session);
    } catch (error) {
      toast.error("Failed to fetch application");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (
      !applicant.applicantName ||
      !applicant.applicantBrn ||
      !applicant.applicantDob
    ) {
      toast.error("Please enter applicant name, BRN and DOB");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "/api/admin/currection-application-req/send-otp",
        {
          personUbrn: application?.ubrn,
          applicantName: applicant.applicantName,
          applicantBrn: applicant.applicantBrn,
          applicantDob: applicant.applicantDob,
          relation: "GUARDIAN",
          session,
        },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setOtpSent(true);
        setTimer(10000); // 10 minutes timer
      } else {
        toast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send OTP",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitResponse = await axios.post(
        `/api/admin/currection-application-req/${params.id}`,
        {
          applicant,
          session,
          otp,
          captchaAns,
        },
      );

      toast.success("Application submitted successfully");
      setShowSubmitSection(false);
      setOtp("");
      setOtpSent(false);
      setTimer(0);
      fetchApplication();
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit application",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      created: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        text: "Draft",
      },
      submitted: {
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        text: "Submitted",
      },
      processing: {
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        text: "Processing",
      },
      approved: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        text: "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        text: "Rejected",
      },
    };
    return (
      statusConfig[status] || {
        color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        text: status,
      }
    );
  };

  const getCorrectionCause = (cause: string) => {
    const causes: Record<string, string> = {
      "1": "Wrong Information",
      "2": "Spelling Mistake",
      "3": "Date Error",
      "4": "Other",
    };
    return causes[cause] || cause;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Application not found
          </h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(application.submit_status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Correction Application
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              UBRN: {application.ubrn}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Application ID
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {application.applicationId || "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
              >
                {status.text}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Submitted Date
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Correction Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Correction Details
          </h2>
          <div className="space-y-3">
            {application.correctionInfos.map((info) => (
              <div
                key={info._id}
                className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Field: {info.key}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="text-gray-500 dark:text-gray-400">
                      From:
                    </span>{" "}
                    {application.dob}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="text-gray-500 dark:text-gray-400">
                      To:
                    </span>{" "}
                    {info.value}
                  </p>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {getCorrectionCause(info.cause)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Section - Only show for created status */}
        {application.submit_status === "created" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Submit Application
              </h2>
              {!showSubmitSection && (
                <button
                  onClick={() => setShowSubmitSection(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Start Submission
                </button>
              )}
            </div>

            {showSubmitSection && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Applicant info */}
                  <div className="">
                    <div className="">
                      <label htmlFor="applicantName">Applicant Name</label>
                      <input
                        type="text"
                        id="applicantName"
                        value={applicant.applicantName}
                        onChange={(e) =>
                          setApplicant({
                            ...applicant,
                            applicantName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="pt-2">
                      <label htmlFor="applicantBrn">Applicant BRN</label>
                      <input
                        type="text"
                        id="applicantBrn"
                        value={applicant.applicantBrn}
                        onChange={(e) =>
                          setApplicant({
                            ...applicant,
                            applicantBrn: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="pt-2">
                      <label htmlFor="applicantDob">Applicant DOB</label>
                      <input
                        type="text"
                        id="applicantDob"
                        value={applicant.applicantDob}
                        placeholder="31/12/2000"
                        onChange={(e) =>
                          setApplicant({
                            ...applicant,
                            applicantDob: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="text-center mt-4">
                      <button
                        onClick={handleSendOtp}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isSubmitting
                          ? "Sending..."
                          : otpSent
                            ? "OTP Sent"
                            : "Send OTP"}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        OTP
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        maxLength={6}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {/* Capcha */}
                      <div className="pt-2">
                        <img src={session?.captchaSrc} alt="" />
                        <input
                          type="text"
                          value={captchaAns}
                          onChange={(e) => setCaptchaAns(e.target.value)}
                          placeholder="Enter Captcha"
                          className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowSubmitSection(false);
                      setOtp("");
                      setOtpSent(false);
                      setTimer(0);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || otp.length !== 6 || !captchaAns}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionDetailsPage;
