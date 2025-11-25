"use client";
import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

interface CertificateData {
  registrationOffice?: string;
  officeLocation?: string;
  registrationDate?: string;
  birthRegNumber?: string;
  issuanceDate?: string;
  dateOfBirth?: string;
  sex?: string;
  personNameBn?: string;
  personNameEn?: string;
  motherNameBn?: string;
  motherNameEn?: string;
  motherNationalityBn?: string;
  motherNationalityEn?: string;
  fatherNameBn?: string;
  fatherNameEn?: string;
  fatherNationalityBn?: string;
  fatherNationalityEn?: string;
  birthPlaceBn?: string;
  birthPlaceEn?: string;
  permanentAddressBn?: string;
  permanentAddressEn?: string;
  dateInWords?: string;
  randomCode?: string;
  qrCode?: string;
  barCode?: string;
}

const BirthCertificate: React.FC = () => {
  const params = useParams();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = params.id as string;

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/birth/certificate/get/${id}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch certificate data: ${response.status} - ${errorText}`
        );
      }

      const data: CertificateData = await response.json();

      // Check if data is empty or invalid
      if (!data || Object.keys(data).length === 0) {
        throw new Error("No certificate data found");
      }

      setCertificateData(data);
      toast.success("Certificate data loaded successfully");
    } catch (err) {
      console.error("Error fetching certificate data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load certificate data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCertificateData();
    } else {
      setError("No certificate ID provided");
      toast.error("No certificate ID provided");
    }
  }, [id]);

  const capitalizeWords = (str: string | undefined): string => {
    if (!str) return "N/A";
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDateToDDMMYYYY = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return dateString;

      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const processOfficeLocation = (location: string | undefined): string => {
    if (!location) return "N/A";
    let processed = capitalizeWords(location);
    if (processed.endsWith(".")) {
      processed = processed.slice(0, -1);
    }
    const firstCommaIndex = processed.indexOf(",");
    if (firstCommaIndex !== -1) {
      processed = processed.slice(firstCommaIndex + 1).trim();
    }
    return processed;
  };

  const downloadPDF = async () => {
    if (!certificateRef.current) {
      toast.error("Certificate content not found");
      return;
    }

    if (Object.keys(certificateData).length === 0) {
      toast.error("No certificate data available to download");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      const element = certificateRef.current;

      // Wait a bit for any fonts to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 2,
      } as unknown as Parameters<typeof html2canvas>[1]);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, "", "FAST");
      pdf.save(
        `birth-certificate-${certificateData.birthRegNumber || "download"}.pdf`
      );

      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const retryFetch = () => {
    fetchCertificateData();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            Loading certificate data...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Certificate
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={retryFetch}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem 1rem",
        position: "relative",
      }}
    >
      <div className="max-w-6xl mx-auto mb-6">
        <div className="mb-6 text-center">
          <button
            onClick={downloadPDF}
            disabled={isGenerating || Object.keys(certificateData).length === 0}
            className={`bg-${
              isGenerating ? "green-500" : "green-700"
            } hover:bg-green-600 dark:text-black text-white dark:bg-white bg-black font-semibold px-4 py-2 rounded-full shadow-md transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGenerating ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>

        <div
          ref={certificateRef}
          id="certificate-content"
          style={{
            backgroundColor: "white",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            margin: "0 auto",
            width: "210mm",
            height: "297mm",
            padding: "25px",
            position: "relative",
            color: "#000000",
            fontFamily: "Prima Sans",
            fontSize: "12px",
          }}
        >
          {/* Watermark */}
          <div
            style={{
              position: "absolute",
              top: "32px",
              left: "0",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <img
              src="/images/watermark.png"
              alt="Watermark"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-52%, -58%)",
                width: "520px",
              }}
            />
          </div>

          <div style={{ position: "relative", zIndex: 10 }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {/* Left - QR Code */}
              <div
                style={{
                  position: "absolute",
                  top: "55px",
                  left: "40px",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingLeft: "5px",
                  }}
                >
                  <img src={certificateData.qrCode} alt="QR Code" />
                </div>
                <p
                  style={{
                    marginTop: "1px",
                    color: "#9ca3af",
                    fontSize: "16px",
                    fontWeight: "100",
                    letterSpacing: "0.05em",
                    textAlign: "center",
                  }}
                >
                  {certificateData.randomCode}
                </p>
              </div>

              {/* Middle - Title */}
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "0 20px",
                  marginTop: "15px",
                  marginLeft: "30px",
                }}
              >
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{
                    position: "absolute",
                    left: "300px",
                    height: "85px",
                    width: "auto",
                  }}
                />
                <div
                  style={{
                    width: "128px",
                    height: "80px",
                    opacity: 0,
                  }}
                ></div>
                <p
                  style={{
                    fontSize: "17px",
                    marginBottom: "5px",
                    color: "#000000",
                  }}
                >
                  Government of the People&apos;s Republic of Bangladesh
                </p>
                <p style={{ fontSize: "14px", color: "#000000" }}>
                  Office of the Registrar, Birth and Death Registration
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    marginTop: "4px",
                    color: "#000000",
                  }}
                >
                  {capitalizeWords(certificateData.registrationOffice)}
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    marginTop: "6px",
                    color: "#000000",
                  }}
                >
                  {processOfficeLocation(certificateData.officeLocation)}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    marginTop: "2px",
                    color: "#000000",
                  }}
                >
                  (Rule 9, 10)
                </p>
              </div>

              {/* Right - Barcode */}
              <div
                style={{
                  position: "absolute",
                  right: "80px",
                  top: "60px",
                }}
              >
                <img
                  style={{ width: "190px", height: "25px" }}
                  src={certificateData.barCode}
                  alt="Barcode"
                ></img>
              </div>
            </div>

            {/* Certificate Title */}
            <div style={{ textAlign: "center", marginBottom: "5px" }}>
              <p
                style={{
                  fontSize: "17px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                <span
                  style={{
                    fontFamily: "Kalpurush",
                    fontWeight: "600",
                    fontSize: "18px",
                  }}
                >
                  জন্ম নিবন্ধন সনদ /{" "}
                </span>
                <span
                  style={{
                    fontFamily: "Dai Banna SIL",
                    fontWeight: "600",
                    fontSize: "20px",

                  }}
                >
                  Birth Registration Certificate
                </span>
              </p>
            </div>

            {/* Registration Info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 51px",
                marginBottom: "20px",
              }}
            >
              <div style={{ textAlign: "left", paddingRight: "10px",paddingLeft:"10px" }}>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#232323",
                    fontFamily: "Prima Sans",
                  }}
                >
                  Date of Registration
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    marginTop: "2px",
                    color: "#232323",
                    fontFamily: "Prima Sans",
                  }}
                >
                  {formatDateToDDMMYYYY(certificateData.registrationDate)}
                </p>
              </div>
              <div style={{ textAlign: "center", marginLeft: "-37px" }}>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "500",
                    color: "#1a1a1a",
                    fontFamily: "Prima Sans",
                  }}
                >
                  Birth Registration Number
                </h2>
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "550",
                    color: "#000000",
                    fontFamily: "sans-serif",
                    letterSpacing: "0.05em",
                  }}
                >
                  {certificateData.birthRegNumber || "N/A"}
                </h1>
              </div>
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#232323",
                    fontFamily: "Prima Sans",
                  }}
                >
                  Date of Issuance
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    marginTop: "2px",
                    color: "#232323",
                    fontFamily: "Prima Sans",
                  }}
                >
                  {formatDateToDDMMYYYY(certificateData.issuanceDate)}
                </p>
              </div>
            </div>

            {/* Certificate Body */}
            <div style={{ padding: "0 30px 0 62px" }}>
              {/* Date of Birth & Sex */}
              <div
                style={{
                  display: "flex",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                      fontFamily: "Prima Sans",
                    }}
                  >
                    Date of Birth
                  </span>
                  <span
                    style={{
                      marginLeft: "22px",
                      fontSize: "16px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    {formatDateToDDMMYYYY(certificateData.dateOfBirth)}
                  </span>
                </div>
                <div
                  style={{ width: "49%", display: "flex", marginLeft: "35px" }}
                >
                  <span
                    style={{
                      marginLeft: "83px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Sex :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    {capitalizeWords(certificateData.sex)}
                  </span>
                </div>
              </div>

              {/* In Words */}
              <div
                style={{
                  display: "flex",
                  marginTop: "5px",
                  marginBottom: "24px",
                }}
              >
                <span
                  style={{
                    width: "120px",
                    whiteSpace: "nowrap",
                    fontSize: "15px",
                    color: "#000000",
                    fontWeight: "500",
                  }}
                >
                  In Word
                </span>
                <span
                  style={{
                    marginLeft: "0px",
                    fontSize: "16px",
                    color: "#000000",
                    fontWeight: "500",
                  }}
                >
                  :
                </span>
                <span
                  style={{
                    marginLeft: "13px",
                    fontStyle: "italic",
                    fontSize: "15px",
                    color: "#000000",
                    fontWeight: "400",
                    width: "400px",
                  }}
                >
                  {certificateData.dateInWords}
                </span>
              </div>

              {/* Name */}
              <div
                style={{
                  display: "flex",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    নাম
                  </span>
                  <span
                    style={{
                      marginLeft: "98px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    {capitalizeWords(certificateData.personNameBn)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      color: "#000000",
                      fontWeight: "500",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                    }}
                  >
                    Name
                  </span>
                  <span
                    style={{
                      marginLeft: "57px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      color: "#000000",
                      fontWeight: "500",
                      width: "188px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                    }}
                  >
                    {capitalizeWords(certificateData.personNameEn)}
                  </span>
                </div>
              </div>

              {/* Mother */}
              <div
                style={{
                  display: "flex",
                  marginTop: "15px",
                  marginBottom: "15px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    মাতা
                  </span>
                  <span
                    style={{
                      marginLeft: "94px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    {capitalizeWords(certificateData.motherNameBn)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Mother
                  </span>
                  <span
                    style={{
                      marginLeft: "49px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                      width: "188px",
                    }}
                  >
                    {capitalizeWords(certificateData.motherNameEn)}
                  </span>
                </div>
              </div>

              {/* Mother Nationality */}
              <div
                style={{
                  display: "flex",
                  marginTop: "15px",
                  marginBottom: "15px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    মাতার জাতীয়তা
                  </span>
                  <span
                    style={{
                      marginLeft: "35px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    {capitalizeWords(certificateData.motherNationalityBn)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Nationality
                  </span>
                  <span
                    style={{
                      marginLeft: "23px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                      width: "188px",
                    }}
                  >
                    {capitalizeWords(certificateData.motherNationalityEn)}
                  </span>
                </div>
              </div>

              {/* Father */}
              <div
                style={{
                  display: "flex",
                  marginTop: "15px",
                  marginBottom: "15px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    পিতা
                  </span>
                  <span
                    style={{
                      marginLeft: "95px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    {capitalizeWords(certificateData.fatherNameBn)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Father
                  </span>
                  <span
                    style={{
                      marginLeft: "57px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                      width: "188px",
                    }}
                  >
                    {capitalizeWords(certificateData.fatherNameEn)}
                  </span>
                </div>
              </div>

              {/* Father Nationality */}
              <div
                style={{
                  display: "flex",
                  marginTop: "15px",
                  marginBottom: "15px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    পিতার জাতীয়তা
                  </span>
                  <span
                    style={{
                      marginLeft: "33px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    {capitalizeWords(certificateData.fatherNationalityBn)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Nationality
                  </span>
                  <span
                    style={{
                      marginLeft: "24px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                      width: "188px",
                    }}
                  >
                    {capitalizeWords(certificateData.fatherNationalityEn)}
                  </span>
                </div>
              </div>

              {/* Birth Place */}
              <div
                style={{
                  display: "flex",
                  marginTop: "15px",
                  marginBottom: "15px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    জন্মস্থান
                  </span>
                  <span
                    style={{
                      marginLeft: "80px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    {capitalizeWords(certificateData.birthPlaceBn)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "start" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Place of Birth
                  </span>
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                      width: "188px",
                    }}
                  >
                    {capitalizeWords(certificateData.birthPlaceEn)}
                  </span>
                </div>
              </div>

              {/* Permanent Address */}
              <div style={{ display: "flex", marginTop: "10px" }}>
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    স্থায়ী ঠিকানা
                  </span>
                  <span
                    style={{
                      marginLeft: "56px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    {capitalizeWords(certificateData.permanentAddressBn)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "start" }}>
                  <span
                    style={{
                      width: "90px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Permanent Address
                  </span>
                  <span
                    style={{
                      marginLeft: "17px",
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      marginLeft: "13px",
                      fontSize: "15px",
                      fontFamily: "Prima Sans",
                      color: "#000000",
                      fontWeight: "500",
                      width: "188px",
                    }}
                  >
                    {capitalizeWords(certificateData.permanentAddressEn)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "0 60px",
                marginTop: "150px",
                position: "relative",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <h2
                    style={{
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "400",
                      marginBottom: "5px",
                    }}
                  >
                    Seal & Signature
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#232323",
                      fontWeight: "600",
                      marginBottom: "0",
                    }}
                  >
                    Assistant to Registrar
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#232323",
                      fontWeight: "400",
                      marginTop: "0",
                    }}
                  >
                    (Preparation, Verification)
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <h2
                    style={{
                      fontSize: "15px",
                      color: "#000000",
                      fontWeight: "400",
                      marginBottom: "5px",
                    }}
                  >
                    Seal & Signature
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#232323",
                      fontWeight: "600",
                    }}
                  >
                    Registrar
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "60px" }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#232323",
                    fontWeight: "400",
                    fontFamily: "Dai Banna SIL",
                  }}
                >
                  This certificate is generated from bdris.gov.bd, and to verify
                  this certificate, please scan the above QR Code & Bar Code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthCertificate;
