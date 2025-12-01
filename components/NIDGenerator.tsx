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

  const getIssueDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    const englishDate = `${day}/${month}/${year}`;
    return englishDate.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
  };

  const fetchNidData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nid/get/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch NID data: ${response.status}`);
      }
      const resData = await response.json();
      const data: NIDData = {
        nameBn: resData.data.name_bn,
        nameEn: resData.data.name_en,
        fatherNameBn: resData.data.father_name,
        motherNameBn: resData.data.mother_name,
        dateOfBirth: resData.data.dob,
        nidNumber: resData.data.nid,
        bloodGroup: resData.data.blood_group,
        birthPlaceBn: resData.data.birth_place,
        addressBn: resData.data.permanent_address_full,
        photo: resData.data.photo,
        signature: resData.data.signature,
        adminSignature: "/images/sign-administrator.jpg",
        issueDate: getIssueDate(),
        barcode: resData.data.barcode,
      };

      if (!data || Object.keys(data).length === 0) {
        throw new Error("No NID data found");
      }

      console.log(JSON.stringify(data));

      setNidData(data);
      toast.success("NID data loaded successfully");
    } catch (err) {
      console.error("Error fetching NID data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load NID data";
      setError(errorMessage);
      toast.error("Using static data instead");
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
            fontFamily: "Kalpurush",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              textAlign: "center",
            }}
          >
            <img
              style={{
                width: "91%",
                margin: "20px auto",
              }}
              src="/images/nid-formate.jpg"
              alt="nid"
            />
          </div>
          <div
            style={{
              position: "absolute",
              top: "46px",
              left: "100px",
              height: "65px",
              width: "297px",
              textAlign: "center",
              fontFamily: "Kalpurush",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "400",
                marginBottom: "-3px",
              }}
            >
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
            </h2>
            <h2
              style={{
                fontFamily: "Arial",
                fontSize: "11px",
                color: "#007700",
                fontWeight: "550",
              }}
            >
              Government of the People&apos;s Republic of Bangladesh
            </h2>
            <h3
              style={{
                fontSize: "11px",
                color: "#ff0000",
                fontWeight: "400",
                fontFamily: "Arial",
               marginTop:'-5px'
              }}
            >
              National ID Card{" "}
              <span
                style={{
                  color: "black",
                  fontFamily: "SolaimanLipi",
                  fontSize: "16px",
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
                width: "65px",
                top: "17px",
                left: "38px",
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
                  left: "110px",
                  top: "4px",
                  width: "277px",
                  height: "100%",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    paddingBottom: "0px",
                  }}
                >
                  <p>
                    <span>নাম:</span>
                    <span
                      style={{
                        fontWeight: "bold",
                        paddingLeft: "16px",
                      }}
                    >
                      {nidData.nameBn}
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                  }}
                >
                  <p>
                    <span style={{ fontSize: "11px" }}>Name:</span>
                    <span
                      style={{
                        fontWeight: "bold",
                        paddingLeft: "6px",
                        fontSize: "11px",
                      }}
                    >
                      {nidData.nameEn}
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    paddingBottom: "0px",
                    marginTop: "-2px",
                  }}
                >
                  <p>
                    <span>পিতা:</span>
                    <span style={{ paddingLeft: "10px" }}>
                      {nidData.fatherNameBn}
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    paddingBottom: "0px",
                  }}
                >
                  <p style={{ marginTop: "-3px" }}>
                    <span>মাতা:</span>
                    <span style={{ paddingLeft: "10px" }}>
                      {nidData.motherNameBn}
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    fontFamily: "Arial",
                    fontWeight: "400",
                  }}
                >
                  <p style={{marginTop:'-3px'}}>
                    <span style={{ fontSize: "12px",  }}>Date of Birth:</span>
                    <span
                      style={{
                        color: "#ff0000",
                        fontSize: "12px",
                        paddingLeft: "3px",
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
                  <p style={{marginTop:'-3px'}}>
                    <span style={{ fontSize: "12px" }}>ID NO:</span>
                    <span
                      style={{
                        color: "#ff0000",
                        fontFamily: "Arial",
                        fontWeight: "990",
                        fontSize: "12px",
                        paddingLeft: "6px",
                      }}
                    >
                      {nidData.nidNumber?.toString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: "50px",
              left: "402px",
              height: "45px",
              width: "340px",
              fontWeight: "500",
            }}
          >
            {" "}
            <p
              style={{
                fontFamily: "Nikosh",
                fontSize: "8.5px",
                width: "93%",
                margin: "auto",
                paddingTop: "2px",
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
              top: "86px",
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
                  width: "90%",
                  margin: "auto",
                  fontSize: "10px",
                  display: "flex",
                }}
              >
                <p style={{ marginLeft: "15px" }}>ঠিকানা: </p>
                <p> </p>
                <p style={{paddingLeft:'2px'}}>{nidData.addressBn}</p>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "45px",
                  height: "30px",
                  width: "91%",
                  margin: "auto",
                  fontFamily: "SolaimanLipi",
                  fontSize: "12px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "75%",
                    display: "flex",
                    paddingLeft: "15px",
                     fontSize: "12px",
                  }}
                >
                  <p>
                    রক্তের গ্রুপ <span style={{fontSize:'10px'}}>/ Blood Group:</span>
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
                      top: "3px",
                      right: "04px",
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
              top: "140px",
              left: "403px",
              height: "115px",
              width: "325px",
              overflow: "hidden",
              fontSize: "9px",
              fontFamily: "SolaimanLipi",
              // border: "1px solid red",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "52%",
                position: "relative",
              }}
            >
              <img
                style={{
                  width: "80px",
                  position: "absolute",
                  bottom: "10px",
                  left: "23px",
                }}
                src={nidData.adminSignature}
                alt="adminSignature"
              />
              <p
                style={{
                  position: "absolute",
                  bottom: "0px",
                  left: "15px",
                  fontSize: "14px",
                }}
              >
                প্রদানকারী কর্তৃপক্ষের স্বাক্ষর
              </p>

              <div
                style={{
                  position: "absolute",
                  bottom: "1px",
                  left: "190px",
                  display: "flex",
                  fontSize: "12px",
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
                <img
                  style={{ width: "100%" }}
                  src={nidData.barcode}
                  alt="barcode"
                />
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
