"use client";

import { useState, useCallback, useMemo } from "react";
import axios from "axios";

export interface IData {
  registrationDate: string;
  registrationOffice: string;
  issuanceDate: string;
  dateOfBirth: string;
  birthRegNumber: string;
  sex: string;
  personNameBn: string;
  personNameEn: string;
  birthPlaceBn: string;
  birthPlaceEn: string;
  motherNameBn: string;
  motherNameEn: string;
  motherNationalityBn: string;
  motherNationalityEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  fatherNationalityBn: string;
  fatherNationalityEn: string;
  officeLocation: string;
  permanentAddressBn?: string;
  permanentAddressEn?: string;
  randomCode: string;
  verificationKey: string;
  qrCodeData: string;
  barcodeData: string;
  dateInWords: string;
  certificateNumber: string;
  charged: boolean;
  amount_charged: number;
}

interface FormField {
  label: string;
  key: keyof IData;
}

export default function ShortData({ data }: { data: IData }) {
  const [showFull, setShowFull] = useState(false);
  const [formData, setFormData] = useState<IData>({ ...data });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Memoized constants for better performance
  const readOnlyFields = useMemo<Array<keyof IData>>(
    () => [
      "birthRegNumber",
      "registrationDate",
      "issuanceDate",
      "certificateNumber",
      "sex",
    ],
    []
  );

  const hiddenFields = useMemo<Array<keyof IData>>(
    () => [
      "charged",
      "amount_charged",
      "verificationKey",
      "randomCode",
      "qrCodeData",
      "barcodeData",
    ],
    []
  );

  const shortInfoFields = useMemo<FormField[]>(
    () => [
      { label: "Birth Reg. Number", key: "birthRegNumber" },
      { label: "Sex", key: "sex" },
      { label: "Name (Bangla)", key: "personNameBn" },
      { label: "Name (English)", key: "personNameEn" },
    ],
    []
  );

  // Optimized handlers with useCallback
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      await axios.put("/api/birth-registration/update", formData);
      setMessage("✅ Data sent successfully!");
    } catch (err) {
      console.error("Submission error:", err);
      setMessage("❌ Failed to send data");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const toggleShowFull = useCallback(() => {
    async function fetchData() {
      try {
        await axios.post("/api/birth-registration/new", data);
        setShowFull(true);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, []);

  // Memoized filtered fields for the full data section
  const visibleFullFields = useMemo(() => {
    return (Object.keys(formData) as Array<keyof IData>).filter(
      (key) =>
        ![
          ...shortInfoFields.map((field) => field.key),
          ...hiddenFields,
        ].includes(key)
    );
  }, [formData, shortInfoFields, hiddenFields]);

  // Utility function to get field value safely
  const getFieldValue = useCallback(
    (key: keyof IData): string => {
      const value = formData[key];
      return typeof value === "string" ? value : String(value || "");
    },
    [formData]
  );

  // Utility function to check if field is read-only
  const isFieldReadOnly = useCallback(
    (key: keyof IData): boolean => {
      return readOnlyFields.includes(key);
    },
    [readOnlyFields]
  );

  return (
    <div className="max-w-3xl mx-auto mt-12 p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl transition-all duration-500">
      {/* Title */}
      <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800 dark:text-gray-100">
        Birth Registration Info
      </h2>

      {/* Short Info Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {shortInfoFields.map((item) => {
          const isReadOnly = isFieldReadOnly(item.key);

          return (
            <div key={item.key}>
              <label
                htmlFor={item.key}
                className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300"
              >
                {item.label}
              </label>
              <input
                id={item.key}
                type="text"
                name={item.key}
                value={getFieldValue(item.key)}
                onChange={handleChange}
                disabled={!showFull || isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all 
                  ${
                    showFull && !isReadOnly
                      ? "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                      : "border-gray-300 dark:border-gray-700 opacity-75 cursor-not-allowed"
                  }`}
              />
            </div>
          );
        })}
      </div>

      {/* Toggle Button */}
      <div className="text-center">
        {!showFull && (
          <button
            onClick={toggleShowFull}
            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Show Full Data
          </button>
        )}
      </div>

      {/* Full Data Section */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showFull ? "max-h-[5000px] mt-8 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visibleFullFields.map((key) => {
            const isReadOnly = isFieldReadOnly(key);

            return (
              <div key={key}>
                <label
                  htmlFor={`full-${key}`}
                  className="block text-sm font-medium mb-1 capitalize text-gray-600 dark:text-gray-300"
                >
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  id={`full-${key}`}
                  type="text"
                  name={key}
                  value={getFieldValue(key)}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all 
                    ${
                      !isReadOnly
                        ? "border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500"
                        : "border-gray-300 dark:border-gray-700 opacity-75 cursor-not-allowed"
                    }`}
                />
              </div>
            );
          })}
        </div>

        {/* Process Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
              ${
                !loading
                  ? "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white focus:ring-green-500"
                  : "bg-gray-500 dark:bg-gray-700 text-gray-300 cursor-not-allowed"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Process"
            )}
          </button>

          {message && (
            <p
              className={`mt-4 text-sm font-medium ${
                message.includes("✅")
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
