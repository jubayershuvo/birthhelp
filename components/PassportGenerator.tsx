"use client";
import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";

interface PassportData {
  passportNumber?: string;
  user: string;
  name?: string;
  fathersName?: string;
  mothersName?: string;
  spousesName?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactAddress?: string;
  emergencyContactTelephone?: string;
  surname?: string;
  givenName?: string;
  nationality?: string;
  personalNumber?: string;
  birthDate?: string;
  gender?: string;
  birthPlace?: string;
  issueDate?: string;
  issuingAuthority?: string;
  expiryDate?: string;
  photo?: string;
  signature?: string;
  mrzLine1?: string;
  mrzLine2?: string;
  previousPassportNo?: string;
}

const PassportCard: React.FC = () => {
  const params = useParams();
  const passportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [passportData, setPassportData] = useState<PassportData>({
    user: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = params.id as string;
  const { user } = useAppSelector((state) => state.userAuth);
  const router = useRouter();
  function normalizeNationality(input: string): string {
  const map: Record<string, string> = {
    BANGLADESH: "BGD",
    BANGLADESHI: "BGD",
    INDIA: "IND",
    INDIAN: "IND",
    PAKISTAN: "PAK",
    PAKISTANI: "PAK",
    UNITEDSTATES: "USA",
    AMERICAN: "USA",
    UNITEDKINGDOM: "GBR",
    BRITISH: "GBR",
  };

  const key = input
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  return map[key] || input.toUpperCase().slice(0, 3);
}

  function generatePassportMRZ({
  country,
  passportNo,
  surname,
  givenName,
  nationality,
  dob,
  sex,
  expiry,
  personalNo = "",
}: {
  country: string;
  passportNo: string;
  surname: string;
  givenName: string;
  nationality: string;
  dob: string;
  sex: string;
  expiry: string;
  personalNo?: string;
}) {
  const weights = [7, 3, 1];

  const months: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04",
    MAY: "05", JUN: "06", JUL: "07", AUG: "08",
    SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };

  const charValue = (c: string) => {
    if (c >= "0" && c <= "9") return Number(c);
    if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
    return 0;
  };

  const checkDigit = (str: string) =>
    (
      str.split("").reduce(
        (sum, c, i) => sum + charValue(c) * weights[i % 3],
        0
      ) % 10
    ).toString();

  const padRight = (str: string, len: number) =>
    (str.toUpperCase().replace(/ /g, "<") + "<".repeat(len)).slice(0, len);

  const toYYMMDD = (dateStr: string) => {
    const [day, mon, year] = dateStr.toUpperCase().split(" ");
    return year.slice(-2) + months[mon] + day.padStart(2, "0");
  };

  const dobYYMMDD = toYYMMDD(dob);
  const expYYMMDD = toYYMMDD(expiry);

  // -------- LINE 1 (44 chars) --------
  const line1 = padRight(
    `P<${country.toUpperCase()}${surname}<<${givenName}`,
    44
  );

  // -------- LINE 2 (44 chars) --------
  const pNo = padRight(passportNo, 9);
  const line2 =
    `${pNo}${checkDigit(pNo)}` +
    `${nationality.toUpperCase()}` +
    `${dobYYMMDD}${checkDigit(dobYYMMDD)}` +
    `${sex}` +
    `${expYYMMDD}${checkDigit(expYYMMDD)}` +
    `${padRight(personalNo, 14)}${checkDigit(padRight(personalNo, 14))}`;

  return {
    line1,
    line2: padRight(line2, 44),
  };
}


  const fetchPassportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/passport?id=${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch passport data: ${response.status}`);
      }
      const resData = await response.json();
      const data = resData as PassportData;

      if (user._id !== data.user) {
        router.push(`/passport?id=${id}`);
        return;
      }

      if (!data || Object.keys(data).length === 0) {
        throw new Error("No passport data found");
      }

      const mrz = generatePassportMRZ({
        country: "BGD",
        passportNo: data.passportNumber || "",
        surname: data.surname || "",
        givenName: data.givenName || "",
        nationality: normalizeNationality(data.nationality || ""),
        dob: data.birthDate || "",
        sex: data.gender || "",
        expiry: data.expiryDate || "",
        personalNo: data.personalNumber || "",
      });
      setPassportData({
        ...data,
        mrzLine1: mrz.line1,
        mrzLine2: mrz.line2,
      });
      toast.success("Passport data loaded successfully");
    } catch (err) {
      console.error("Error fetching passport data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load passport data";
      setError(errorMessage);
      toast.error("Failed to load passport data");
      router.push("/passport");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPassportData();
    } else {
      setError("No passport ID provided");
      toast.error("Using static data instead");
      router.push("/passport");
    }
  }, [id]);

  const downloadPDF = async () => {
    if (!passportRef.current) {
      toast.error("Passport content not found");
      return;
    }

    if (Object.keys(passportData).length === 0) {
      toast.error("No passport data available to download");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      const canvas = await html2canvas(passportRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: false,

        backgroundColor: "#ffffff",
        width: 2480,
        height: 3508,
      } as unknown as Parameters<typeof html2canvas>[1]);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [2480 / 4, 3508 / 4],
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, "", "FAST");
      pdf.save(`passport-${passportData.passportNumber || "download"}.pdf`);

      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const retryFetch = () => {
    fetchPassportData();
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1f2937",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              animation: "spin 1s linear infinite",
              borderRadius: "9999px",
              height: "3rem",
              width: "3rem",
              borderBottomWidth: "2px",
              borderColor: "#2563eb",
              margin: "0 auto",
            }}
          ></div>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "1.125rem",
              color: "#d1d5db",
            }}
          >
            Loading passport data...
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          overflowY: "auto",
          margin: "2rem 0",
        }}
      >
        <div
          style={{
            marginBottom: "1.5rem",
            marginTop: "1rem",
            textAlign: "center",
            position: "absolute",
            zIndex: "10",
            width: "100%",
          }}
        >
          <button
            onClick={downloadPDF}
            disabled={isGenerating || Object.keys(passportData).length === 0}
            style={{
              backgroundColor: isGenerating ? "#10b981" : "#047857",
              color: "white",
              fontWeight: "600",
              paddingLeft: "1.5rem",
              paddingRight: "1.5rem",
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
              borderRadius: "9999px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transition: "background-color 0.2s ease-in-out",
              cursor: "pointer",
              border: "none",
              fontSize: "1rem",
              lineHeight: "1.5rem",
              margin: "0 auto",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = isGenerating
                ? "#10b981"
                : "#059669";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = isGenerating
                ? "#10b981"
                : "#047857";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isGenerating ? "Generating PDF..." : "Download Passport PDF"}
          </button>
        </div>

        <div
          ref={passportRef}
          id="nid-content"
          style={{
            color: "#000",
            backgroundColor: "#fff",
            width: "2480px",
            height: "3508px",
          }}
        >
          <div
            style={{
              transform: "scale(1)",
              transformOrigin: "top left",
              width: "fit-content",
            }}
          >
            <div
              style={{
                width: "2480px",
                height: "3508px",
                position: "relative",
              }}
            >
              <img
                src="/mrp-passport.jpg"
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: "0",
                  left: "0",
                  zIndex: "-3",
                  objectFit: "cover",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  right: "302px",
                  top: "1001px",
                  textTransform: "uppercase",
                  fontFamily: "'OCR-B', monospace",
                  fontSize: "40px",
                  letterSpacing: "8px",
                  transform: "rotate(-90deg)",
                }}
              >
                <span style={{ display: "inline-block", marginRight: "35px" }}>
                  {passportData.passportNumber?.substring(0, 2)}
                </span>
                {passportData.passportNumber?.substring(2)}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: "-100px",
                  lineHeight: "0",
                  textTransform: "uppercase",
                  top: "1086px",
                  letterSpacing: "-12px",
                  fontFamily: "'Led Panel Station On', monospace",
                  fontSize: "148px",
                  transform: "rotate(-90deg) scaleX(1.4)",
                  transformOrigin: "center",
                }}
              >
                <span
                  style={{ letterSpacing: "11px", display: "inline-block" }}
                >
                  {passportData.passportNumber?.substring(0, 2)}
                </span>
                {" " + passportData.passportNumber?.substring(2)}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: "470px",
                  top: "582px",
                  fontSize: "37.5px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "19px",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                    }}
                  >
                    Name:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      marginTop: "6px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                    }}
                  >
                    {passportData.name}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "19px",
                    alignItems: "center",
                    marginTop: "11px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                      width: "400px",
                    }}
                  >
                    Father&apos;s Name:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      marginTop: "6px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                    }}
                  >
                    {passportData.fathersName}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "19px",
                    alignItems: "center",
                    marginTop: "11px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                      width: "400px",
                    }}
                  >
                    Mother&apos;s Name:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      marginTop: "6px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                    }}
                  >
                    {passportData.mothersName}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "19px",
                    alignItems: "center",
                    marginTop: "11px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                      width: "400px",
                    }}
                  >
                    Spouse&apos;s Name:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      marginTop: "6px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                    }}
                  >
                    {passportData.spousesName}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "19px",
                    alignItems: "flex-start",
                    marginTop: "11px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                      width: "400px",
                    }}
                  >
                    Permanent Address:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                      width: "900px",
                      lineHeight: "1.57",
                      marginTop: "-3px",
                    }}
                  >
                    {passportData.permanentAddress}
                  </p>
                </div>

                <h2
                  style={{
                    fontFamily: "Arial",
                    fontWeight: "bold",
                    fontStyle: "italic",
                    fontSize: "37.5px",
                    marginTop: "8px",
                    marginBottom: "11px",
                    margin: "8px 0 11px 0",
                  }}
                >
                  Emergency Contact:
                </h2>

                <div
                  style={{
                    display: "flex",
                    gap: "55px",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                    }}
                  >
                    Name:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      marginTop: "6px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                    }}
                  >
                    {passportData.emergencyContactName}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "55px",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                    }}
                  >
                    Relationship:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      marginTop: "6px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                    }}
                  >
                    {passportData.emergencyContactRelationship}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "55px",
                    alignItems: "flex-start",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                    }}
                  >
                    Address:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                      width: "1200px",
                      lineHeight: "1.57",
                    }}
                  >
                    {passportData.emergencyContactAddress}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "55px",
                    alignItems: "center",
                    marginTop: "15px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Arial",
                      fontWeight: "700",
                      fontStyle: "italic",
                      margin: "0",
                    }}
                  >
                    Telephone No:{" "}
                  </p>
                  <p
                    style={{
                      fontFamily: "'TimesNewerRoman', Times New Roman, serif",
                      textTransform: "uppercase",
                      letterSpacing: "2.5px",
                      marginTop: "6px",
                      textShadow: "0 0 1.5px #000",
                      WebkitTextStroke: "0.6px #000",
                      margin: "0",
                    }}
                  >
                    {passportData.emergencyContactTelephone}
                  </p>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "300px",
                  left: "180px",
                  width: "2138px",
                  height: "1450px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "40px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "1px",
                    textShadow: "0 0 1.5px #000",
                    top: "140px",
                    left: "681px",
                  }}
                >
                  P
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "40px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "1px",
                    textShadow: "0 0 1.5px #000",
                    top: "140px",
                    left: "908px",
                  }}
                >
                  BGD
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "40px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "1px",
                    textShadow: "0 0 1.5px #000",
                    top: "140px",
                    right: "551px",
                  }}
                >
                  {passportData.passportNumber}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "1px",
                    textShadow: "0 0 1.5px #000",
                    top: "250px",
                    left: "666px",
                  }}
                >
                  {passportData.surname}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0px",
                    textShadow: "0 0 1.5px #000",
                    top: "357px",
                    left: "666px",
                  }}
                >
                  {passportData.givenName}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "1px",
                    textShadow: "0 0 1.5px #000",
                    top: "464px",
                    left: "666px",
                  }}
                >
                  {passportData.nationality}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "48px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "1px",
                    textShadow: "0 0 1.5px #000",
                    top: "464px",
                    right: "400px",
                  }}
                >
                  {passportData.personalNumber}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0",
                    textShadow: "0 0 1.5px #000",
                    top: "580px",
                    left: "666px",
                  }}
                >
                  {passportData.birthDate}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "48px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0",
                    textShadow: "0 0 1.5px #000",
                    top: "580px",
                    left: "1377px",
                  }}
                >
                  {passportData.previousPassportNo}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0",
                    textShadow: "0 0 1.5px #000",
                    top: "690px",
                    left: "666px",
                  }}
                >
                  {passportData.gender}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0",
                    textShadow: "0 0 1.5px #000",
                    top: "690px",
                    left: "906px",
                  }}
                >
                  {passportData.birthPlace}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0",
                    textShadow: "0 0 1.5px #000",
                    top: "795px",
                    left: "666px",
                  }}
                >
                  {passportData.issueDate}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0",
                    textShadow: "0 0 1.5px #000",
                    top: "795px",
                    left: "1377px",
                  }}
                >
                  {passportData.issuingAuthority}
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: "51px",
                    textTransform: "uppercase",
                    position: "absolute",
                    letterSpacing: "0",
                    textShadow: "0 0 1.5px #000",
                    top: "905px",
                    left: "662px",
                  }}
                >
                  {passportData.expiryDate}
                </div>

                <div
                  style={{
                    position: "absolute",
                    width: "458px",
                    height: "96px",
                    bottom: "400px",
                    right: "309px",
                  }}
                >
                  <img
                    src={passportData.signature}
                    alt="Signature"
                    style={{
                      width: "auto",
                      height: "100%",
                      objectFit: "cover",
                      margin: "0 auto",
                    }}
                  />
                </div>

                <img
                  src={passportData.photo}
                  alt="Passport Photo"
                  style={{
                    position: "absolute",
                    bottom: "360px",
                    left: "62px",
                    width: "523px",
                    height: "736px",
                    zIndex: "1",
                  }}
                />

                <img
                  src="/mrp-passport-pic-sill.png"
                  alt="Passport Sill"
                  style={{
                    position: "absolute",
                    bottom: "-62px",
                    left: "-10px",
                    scale: "1.15",
                    objectFit: "contain",
                    zIndex: "2",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    bottom: "118px",
                    left: "130px",
                    wordBreak: "break-all",
                    fontFamily: "Arial",
                    fontSize: "60px",
                    lineHeight: "80.2px",
                    WebkitTextStroke: "0.6px #000",
                  }}
                >
                  <p
                    style={{
                      letterSpacing: "8.3px",
                      fontSize: "40px",
                      fontWeight: "bold",
                      fontFamily: "'OCR-B', monospace",
                      margin: "0",
                    }}
                  >
                    {passportData.mrzLine1}
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "40px",
                      fontWeight: "bold",
                      fontFamily: "'OCR-B', monospace",
                      letterSpacing: "8.3px",
                    }}
                  >
                    {passportData.mrzLine2}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              position: "fixed",
              bottom: "1rem",
              right: "1rem",
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24",
              color: "#92400e",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
            }}
          >
            <p style={{ fontSize: "0.875rem" }}>{error}</p>
            <button
              onClick={retryFetch}
              style={{
                fontSize: "0.75rem",
                textDecoration: "underline",
                marginTop: "0.25rem",
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "0",
              }}
            >
              Retry API Call
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @font-face {
          font-family: "Led Panel Station On";
          src: url("/fonts/Led Panel Station On.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }

        @font-face {
          font-family: "TimesNewerRoman";
          src: url("/fonts/TimesNewerRoman-Regular.otf") format("opentype");
          font-weight: normal;
          font-style: normal;
        }

        @font-face {
          font-family: "OCR-B";
          src: url("/fonts/OCR-B.otf") format("opentype");
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
    </>
  );
};

export default PassportCard;
