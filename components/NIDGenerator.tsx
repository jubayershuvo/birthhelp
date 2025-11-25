"use client";
import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

interface NIDData {
  nameBn?: string;
  nameEn?: string;
  fatherNameBn?: string;
  motherNameBn?: string;
  dateOfBirth?: string;
  nidNumber?: string;
  bloodGroup?: string;
  birthPlaceBn?: string;
  addressBn?: string;
  photo?: string;
  signature?: string;
  adminSignature?: string;
  issueDate?: string;
  barcode?: string;
}

const NIDCard: React.FC = () => {
  const params = useParams();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nidData, setNidData] = useState<NIDData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = params.id as string;

  // Static fallback data with Bangladeshi information
  const staticNidData: NIDData = {
    nameBn: "শারমিন জান্নাত",
    nameEn: "Sharmin Zannat",
    fatherNameBn: "মোঃ সামছুল হক",
    motherNameBn: "হোসনে আরা বেগম",
    dateOfBirth: "20 Jun 1992",
    nidNumber: "6452534669",
    bloodGroup: "A+",
    birthPlaceBn: "চট্টগ্রাম",
    addressBn:
      "বাসা/হোল্ডিং: ৩৯৮নং সোনাশাহ মাজার রোড, গ্রাম/রাস্তা: ৩৯৮নং, সোনাশাহ মাজার রোড, রামপুর, ডাকঘর: রামপুর - ৪২২৪, হালিশহর, চট্টগ্রাম সিটি কর্পোরেশন, চট্টগ্রাম",
    photo: "/images/profile-img.jpg",
    signature: "/images/signature.jpg",
    adminSignature: "/images/sign-administrator.jpg",
    issueDate: "১৯/০৩/২০২৫",
    barcode: "/images/barcode.jpg",
  };

  const fetchNidData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nid/get/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch NID data: ${response.status}`);
      }

      const data: NIDData = await response.json();

      if (!data || Object.keys(data).length === 0) {
        throw new Error("No NID data found");
      }

      setNidData(data);
      toast.success("NID data loaded successfully");
    } catch (err) {
      console.error("Error fetching NID data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load NID data";
      setError(errorMessage);
      toast.error("Using static data instead");

      setNidData(staticNidData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchNidData();
    } else {
      setError("No NID ID provided");
      toast.error("Using static data instead");
      setNidData(staticNidData);
    }
  }, [id]);

  const downloadPDF = async () => {
    if (!certificateRef.current) {
      toast.error("NID card content not found");
      return;
    }

    if (Object.keys(nidData).length === 0) {
      toast.error("No NID data available to download");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      const element = certificateRef.current;

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 2,
        backgroundColor: "#ffffff",
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
      pdf.save(`nid-card-${nidData.nidNumber || "download"}.pdf`);

      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const retryFetch = () => {
    fetchNidData();
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Loading NID data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem 1rem",
      }}
    >
      <div className="max-w-6xl mx-auto mb-6">
        {/* Download Button */}
        <div className="mb-6 text-center">
          <button
            onClick={downloadPDF}
            disabled={isGenerating || Object.keys(nidData).length === 0}
            className={`bg-${
              isGenerating ? "green-500" : "green-700"
            } hover:bg-green-600 dark:bg-white dark:hover:bg-green-600 dark:text-black text-white font-semibold px-6 py-3 rounded-full shadow-md transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGenerating ? "Generating PDF..." : "Download NID Card PDF"}
          </button>
        </div>

        {/* NID Card Design */}
        <div
          ref={certificateRef}
          id="nid-content"
          style={{
            backgroundColor: "white",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            margin: "0 auto",
            width: "210mm",
            minHeight: "297mm",
            padding: "20px",
            position: "relative",
            color: "#000000",
            fontFamily: "'Kalpurush', 'Arial', sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              textAlign: "center",
            }}
          >
            <img src="/images/nid-formate.jpg" alt="nid" />
          </div>
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "75px",
              height: "75px",
              width: "320px",
              textAlign: "center",
              fontFamily: "SolaimanLipi",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                letterSpacing: "0.2px",
                fontWeight: "400",
              }}
            >
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
            </h2>
            <h2
              style={{
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#007700",
                letterSpacing: "0.2px",
                fontWeight: "400",
              }}
            >
              Government of the People&apos;s Republic of Bangladesh
            </h2>
            <h3
              style={{
                fontSize: "12px",
                color: "#ff0000",
                letterSpacing: "0.2px",
                fontWeight: "400",
                marginTop: "2px",
              }}
            >
              National ID Card{" "}
              <span
                style={{
                  color: "black",
                }}
              >
                {" "}
                / জাতীয় পরিচয় পত্র
              </span>
            </h3>
          </div>
          <div
            style={{
              position: "absolute",
              top: "104px",
              left: "36px",
              height: "161px",
              width: "359px",
              textAlign: "center",
              fontFamily: "SolaimanLipi",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "80px",
                textAlign: "center",
              }}
            >
              <img
                style={{ width: "100%" }}
                src={nidData.photo}
                alt="profile"
              />
              <img
                style={{ width: "100%", marginTop: "5px" }}
                src={nidData.signature}
                alt="signature"
              />
            </div>
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "85px",
                  width: "277px",
                  height: "100%",
                  textAlign: "left",
                  fontFamily: "Nikosh",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    paddingBottom: "5.5px",
                  }}
                >
                  <p>
                    নাম:{" "}
                    <span
                      style={{
                        fontWeight: "bold",
                      }}
                    >
                      {nidData.nameBn}
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    paddingBottom: "5.5px",
                  }}
                >
                  <p>
                    Name:{" "}
                    <span
                      style={{
                        fontWeight: "bold",
                      }}
                    >
                      {nidData.nameEn}
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    paddingBottom: "5.5px",
                  }}
                >
                  <p>
                    পিতা: <span>{nidData.fatherNameBn}</span>
                  </p>
                </div>

                <div
                  style={{
                    paddingBottom: "5.5px",
                  }}
                >
                  <p>
                    মাতা: <span>{nidData.motherNameBn}</span>
                  </p>
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    paddingBottom: "5.5px",
                    fontWeight: "400",
                  }}
                >
                  <p>
                    Date of Birth:{" "}
                    <span
                      style={{
                        color: "#ff0000",
                      }}
                    >
                      {nidData.dateOfBirth}
                    </span>
                  </p>
                </div>
                <div
                  style={{
                    fontFamily: "Arial",
                    fontWeight: "400",
                  }}
                >
                  <p>
                    ID NO:{" "}
                    <span
                      style={{
                        color: "#ff0000",
                        fontWeight: "bold",
                      }}
                    >
                      {nidData.nidNumber}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "401px",
              height: "45px",
              width: "359px",
            }}
          >
            {" "}
            <p
              style={{
                fontFamily: "SolaimanLipi",
                fontSize: "9px",
                width: "92%",
                margin: "auto",
                paddingTop: "5px",
              }}
            >
              এই কার্ডটি গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের সম্পত্তি। কার্ডটি
              ব্যবহারকারী ব্যতীত অন্য কোথাও পাওয়া গেলে নিকটস্থ পোস্ট অফিসে জমা
              দেবার জন্য অনুরোধ করা হলো।
            </p>
          </div>
          <div
            style={{
              position: "absolute",
              top: "70px",
              left: "401px",
              height: "80px",
              width: "359px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  height: "50px",
                  width: "100%",
                  margin: "auto",
                  fontFamily: "SolaimanLipi",
                  fontSize: "9px",
                  display: "flex",
                }}
              >
                <p style={{ marginLeft: "15px" }}>ঠিকানা: </p>
                <p> </p>
                <p>{nidData.addressBn}</p>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "56px",
                  height: "30px",
                  width: "100%",
                  margin: "auto",
                  fontFamily: "SolaimanLipi",
                  fontSize: "9px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "75%",
                    display: "flex",
                    paddingLeft: "15px",
                  }}
                >
                  <p>
                    রক্তের গ্রুপ <span>/ Blood Group:</span>
                    <span
                      style={{
                        color: "#ff0000",
                        fontFamily: "Arial",
                        paddingLeft: "5px",
                      }}
                    >
                      {nidData.bloodGroup}
                    </span>
                  </p>
                  <p
                    style={{
                      paddingLeft: "10px",
                    }}
                  >
                    জন্মস্থান: <span>{nidData.birthPlaceBn}</span>
                  </p>
                </div>
                <div
                  style={{
                    width: "25%",
                    position: "relative",
                    fontSize: "8px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "0px",
                      right: "02px",
                      color: "#fff",
                      paddingTop: "4px",
                    }}
                  >
                    মূদ্রণ: <span>০১</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: "145px",
              left: "403px",
              height: "115px",
              width: "359px",
              overflow: "hidden",
              fontSize: "9px",
              fontFamily: "SolaimanLipi",
              // border: "1px solid red",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "50%",
                position: "relative",
              }}
            >
              <img
                style={{
                  width: "80px",
                  position: "absolute",
                  bottom: "15px",
                  left: "28px",
                }}
                src={nidData.adminSignature}
                alt="adminSignature"
              />
              <p
                style={{
                  position: "absolute",
                  bottom: "0px",
                  left: "15px",
                }}
              >
                প্রদানকারী কর্তৃপক্ষের স্বাক্ষর{" "}
              </p>

              <div
                style={{
                  position: "absolute",
                  bottom: "0px",
                  left: "220px",
                  display: "flex",
                }}
              >
                <span>প্রদানের তারিখ:</span>
                <p
                  style={{
                    paddingLeft: "5px",
                  }}
                >
                  {nidData.issueDate}
                </p>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: "50%",
              }}
            >
              <div
                style={{
                  width: "98%",
                  margin: "auto",
                  marginTop: "5px",
                }}
              >
                <img src={nidData.barcode} alt="barcode" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded">
            <p className="text-sm">{error}</p>
            <button onClick={retryFetch} className="text-xs underline mt-1">
              Retry API Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NIDCard;
