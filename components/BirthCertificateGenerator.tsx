"use client";
import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useParams } from "next/navigation";

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
  const id = params.id as string;
  const fetchCertificateData = async () => {
    try {
      const response = await fetch(`/api/birth/certificate/get/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch certificate data: ${response.status}`);
      }

      const data: CertificateData = await response.json();
      setCertificateData(data);
    } catch (err) {
      console.error("Error fetching certificate data:", err);
    }
  };

  useEffect(() => {
    fetchCertificateData();
  }, []);

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
    if (!certificateRef.current) return;

    setIsGenerating(true);

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
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

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
            disabled={isGenerating}
            className={`bg-${
              isGenerating ? "green-500" : "green-700"
            } hover:bg-green-600 dark:text-black text-white dark:bg-white bg-black font-semibold px-4 py-2 rounded-full shadow-md transition-colors duration-200 ease-in-out`}
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
            fontFamily: "Arial, sans-serif",
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
                transform: "translate(-50%, -50%)",
                width: "550px",
                opacity: "0.75",
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
                marginBottom: "24px",
              }}
            >
              {/* Left - QR Code */}
              <div
                style={{
                  position: "absolute",
                  top: "45px",
                  left: "35px",
                }}
              >
                <div
                  style={{
                    width: "105px",
                    height: "105px",
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img src={certificateData.qrCode} alt="QR Code" />
                </div>
                <p
                  style={{
                    marginTop: "3px",
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
              <div style={{ flex: 1, textAlign: "center", padding: "0 16px" }}>
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{
                    position: "absolute",
                    left: "314px",
                    top: "-8px",
                    height: "auto",
                    width: "auto",
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    width: "128px",
                    height: "80px",
                    margin: "0 auto 8px",
                    opacity: 0,
                  }}
                ></div>
                <p
                  style={{
                    fontSize: "18px",
                    marginBottom: "6px",
                    color: "#000000",
                  }}
                >
                  Government of the People&apos;s Republic of Bangladesh
                </p>
                <p style={{ fontSize: "16px", color: "#000000" }}>
                  Office of the Registrar, Birth and Death Registration
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    marginTop: "4px",
                    color: "#000000",
                  }}
                >
                  {capitalizeWords(certificateData.registrationOffice)}
                </p>
                <p
                  style={{
                    fontSize: "16px",
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
                  right: "60px",
                  top: "50px",
                }}
              >
                <img
                  style={{ width: "180px", height: "30px" }}
                  src={certificateData.barCode}
                  alt="Barcode"
                ></img>
              </div>
            </div>

            {/* Certificate Title */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                <span>জন্ম নিবন্ধন সনদ / </span>
                <span>Birth Registration Certificate</span>
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
                marginTop: "13px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#232323",
                  }}
                >
                  Date of Registration
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginTop: "2px",
                    color: "#232323",
                  }}
                >
                  {formatDateToDDMMYYYY(certificateData.registrationDate)}
                </p>
              </div>
              <div style={{ textAlign: "center", marginLeft: "-37px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    marginBottom: "3px",
                    color: "#1a1a1a",
                  }}
                >
                  Birth Registration Number
                </h2>
                <h1
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#000000",
                  }}
                >
                  {certificateData.birthRegNumber || "N/A"}
                </h1>
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#232323",
                  }}
                >
                  Date of Issuance
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginTop: "2px",
                    color: "#232323",
                  }}
                >
                  {formatDateToDDMMYYYY(certificateData.issuanceDate)}
                </p>
              </div>
            </div>

            {/* Certificate Body */}
            <div style={{ padding: "0 20px 0 52px" }}>
              {/* Date of Birth & Sex */}
              <div
                style={{
                  display: "flex",
                  marginTop: "2px",
                  marginBottom: "5px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Date of Birth
                  </span>
                  <span
                    style={{
                      marginLeft: "18px",
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
                      fontSize: "16px",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    {formatDateToDDMMYYYY(certificateData.dateOfBirth)}
                  </span>
                </div>
                <div
                  style={{ width: "39%", display: "flex", marginLeft: "35px" }}
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
                    fontSize: "18px",
                    color: "#000000",
                    fontWeight: "500",
                  }}
                >
                  In Word
                </span>
                <span
                  style={{
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
                    fontStyle: "italic",
                    fontSize: "18px",
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
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    নাম
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
                      fontSize: "18px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                  marginTop: "17px",
                  marginBottom: "17px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    মাতা
                  </span>
                  <span
                    style={{
                      marginLeft: "89px",
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
                      fontSize: "18px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Mother
                  </span>
                  <span
                    style={{
                      marginLeft: "46px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                  marginTop: "17px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    মাতার জাতীয়তা
                  </span>
                  <span
                    style={{
                      marginLeft: "20px",
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
                      fontSize: "18px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Nationality
                  </span>
                  <span
                    style={{
                      marginLeft: "21px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                  marginTop: "16px",
                  marginBottom: "17px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    পিতা
                  </span>
                  <span
                    style={{
                      marginLeft: "92px",
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
                      fontSize: "18px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Father
                  </span>
                  <span
                    style={{
                      marginLeft: "55px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                  marginTop: "17px",
                  marginBottom: "17px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    পিতার জাতীয়তা
                  </span>
                  <span
                    style={{
                      marginLeft: "21px",
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
                      fontSize: "18px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                  marginTop: "17px",
                  marginBottom: "30px",
                }}
              >
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    জন্মস্থান
                  </span>
                  <span
                    style={{
                      marginLeft: "75px",
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
                      fontSize: "18px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
                      color: "#000000",
                      fontWeight: "500",
                    }}
                  >
                    Place of Birth
                  </span>
                  <span
                    style={{
                      marginLeft: "7px",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
              <div style={{ display: "flex", marginTop: "25px" }}>
                <div style={{ flex: 1, display: "flex" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      fontFamily: "Kalpurush",
                    }}
                  >
                    স্থায়ী ঠিকানা
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
                      fontSize: "18px",
                      color: "#2f2f2f",
                      fontWeight: "500",
                      width: "188px",
                      lineHeight: "1.2",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                      fontSize: "18px",
                      fontFamily: "Dai Banna SIL",
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
                marginTop: "80px",
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
              <div style={{ textAlign: "center", marginTop: "70px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#232323",
                    fontWeight: "400",
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
