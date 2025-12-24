"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

export interface IFullData {
  _id: string;
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
  pdfType?: string; // Added pdfType field
}

interface FormField {
  label: string;
  key: keyof IFullData;
  type?: "text" | "date" | "checkbox" | "number" | "select" | "radio";
  options?: string[];
  validation?: {
    pattern?: RegExp;
    message?: string;
    required?: boolean;
  };
}

interface ValidationErrors {
  [key: string]: string;
}

// Updated validation patterns to allow numbers and special characters including commas, periods, and spaces
const validationPatterns = {
  bangla: /^[\u0980-\u09FF\s\.\-_,\(\)\[\]!@#$%^&*()+=?/:;"'{}|~`0-9,]+$/, // Bengali Unicode range with numbers and special chars including comma
  english: /^[A-Za-z\s\.\-_,\(\)\[\]!@#$%^&*()+=?/:;"'{}|~`0-9,]+$/, // English letters with numbers and special chars including comma
  numbers: /^[0-9]+$/, // Numbers only
  alphanumeric: /^[A-Za-z0-9\s\-_!@#$%^&*()+=?/:;"'{}|~`,]+$/, // Alphanumeric with spaces, hyphens, underscores and special chars including comma
  date: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, // DD/MM/YYYY
  amount: /^\d+(\.\d{1,2})?$/, // Decimal numbers for amount
};

// PDF Type options
const pdfTypeOptions = ["Corrected", "Duplicate", "New"];

export default function EditBirthCertificate() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<IFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const id = params.id as string;

  // Format date to DD/MM/YYYY from ISO or other formats
  const formatDateToDDMMYYYY = useCallback((dateString: string): string => {
    if (!dateString) return "";

    // If already in DD/MM/YYYY format, return as is
    if (validationPatterns.date.test(dateString)) {
      return dateString;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  }, []);

  // Keep dates in DD/MM/YYYY format for API - NO CONVERSION TO ISO
  const prepareDataForAPI = useCallback((data: IFullData): IFullData => {
    return {
      ...data,
      // Dates are already in DD/MM/YYYY format, keep them as is
      registrationDate: data.registrationDate,
      issuanceDate: data.issuanceDate,
      dateOfBirth: data.dateOfBirth,
    };
  }, []);

  // Memoized constants for better performance
  const readOnlyFields = useMemo<Array<keyof IFullData>>(
    () => [
      "birthRegNumber",
      "certificateNumber",
      "randomCode",
      "verificationKey",
      "qrCodeData",
      "barcodeData",
      "_id",
      "issuanceDate",
      "registrationDate",
    ],
    []
  );

  const hiddenFields = useMemo<Array<keyof IFullData>>(
    () => [
      "verificationKey",
      "randomCode",
      "qrCodeData",
      "barcodeData",
      "_id",
      "amount_charged",
      "charged",
    ],
    []
  );

  // Utility function to check if field is read-only
  const isFieldReadOnly = useCallback(
    (key: keyof IFullData): boolean => {
      return readOnlyFields.includes(key);
    },
    [readOnlyFields]
  );

  // Utility function to check if field should be hidden
  const isFieldHidden = useCallback(
    (key: keyof IFullData): boolean => {
      return hiddenFields.includes(key);
    },
    [hiddenFields]
  );

  // Form fields configuration with validation
  const formFields = useMemo<FormField[]>(
    () => [
      // PDF Type Selection - REQUIRED and NOT pre-selected
      {
        label: "PDF Type *",
        key: "pdfType",
        type: "radio",
        options: pdfTypeOptions,
        validation: {
          required: true,
          message: "Please select a PDF type",
        },
      },

      // Personal Information
      {
        label: "Birth Registration Number",
        key: "birthRegNumber",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.alphanumeric,
          message:
            "Alphanumeric characters, spaces, and common special characters allowed",
        },
      },
      {
        label: "Date in Words",
        key: "dateInWords",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },

      {
        label: "Sex",
        key: "sex",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Date of Birth",
        key: "dateOfBirth",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.date,
          message: "Date must be in DD/MM/YYYY format",
        },
      },
      {
        label: "Name (Bangla)",
        key: "personNameBn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.bangla,
          message:
            "Bengali characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Name (English)",
        key: "personNameEn",
        type: "text",
        validation: {
          required: false,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Birth Place (Bangla)",
        key: "birthPlaceBn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.bangla,
          message:
            "Bengali characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Birth Place (English)",
        key: "birthPlaceEn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },

      // Registration Details
      {
        label: "Registration Date",
        key: "registrationDate",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.date,
          message: "Date must be in DD/MM/YYYY format",
        },
      },
      {
        label: "Issuance Date",
        key: "issuanceDate",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.date,
          message: "Date must be in DD/MM/YYYY format",
        },
      },
      {
        label: "Registration Office",
        key: "registrationOffice",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Office Location",
        key: "officeLocation",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },

      // Mother's Information
      {
        label: "Mother Name (Bangla)",
        key: "motherNameBn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.bangla,
          message:
            "Bengali characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Mother Name (English)",
        key: "motherNameEn",
        type: "text",
        validation: {
          required: false,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Mother Nationality (Bangla)",
        key: "motherNationalityBn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.bangla,
          message:
            "Bengali characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Mother Nationality (English)",
        key: "motherNationalityEn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },

      // Father's Information
      {
        label: "Father Name (Bangla)",
        key: "fatherNameBn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.bangla,
          message:
            "Bengali characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Father Name (English)",
        key: "fatherNameEn",
        type: "text",
        validation: {
          required: false,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Father Nationality (Bangla)",
        key: "fatherNationalityBn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.bangla,
          message:
            "Bengali characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Father Nationality (English)",
        key: "fatherNationalityEn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },

      // Address Information
      {
        label: "Permanent Address (Bangla)",
        key: "permanentAddressBn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.bangla,
          message:
            "Bengali characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Permanent Address (English)",
        key: "permanentAddressEn",
        type: "text",
        validation: {
          required: true,
          pattern: validationPatterns.english,
          message:
            "English characters, numbers, and special characters allowed",
        },
      },
      {
        label: "Certificate Number",
        key: "certificateNumber",
        type: "text",
        validation: {
          pattern: validationPatterns.alphanumeric,
          message:
            "Alphanumeric characters, spaces, and common special characters allowed",
        },
      },

      // Financial Information
      {
        label: "Charged",
        key: "charged",
        type: "checkbox",
      },
      {
        label: "Amount Charged",
        key: "amount_charged",
        type: "number",
        validation: {
          pattern: validationPatterns.amount,
          message: "Only numbers with up to 2 decimal places allowed",
        },
      },
    ],
    []
  );

  // Fetch full data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/birth/certificate/get/${id}`);
        const data = response.data;

        // Format dates to DD/MM/YYYY
        const formattedData = {
          ...data,
          registrationDate: formatDateToDDMMYYYY(data.registrationDate),
          issuanceDate: formatDateToDDMMYYYY(data.issuanceDate),
          dateOfBirth: formatDateToDDMMYYYY(data.dateOfBirth),
          // REMOVED default pdfType - user must select explicitly
          pdfType: data.pdfType || "", // Empty string instead of default value
        };

        setFormData(formattedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load certificate data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, formatDateToDDMMYYYY]);

  // Validate field
  const validateField = useCallback(
    (key: keyof IFullData, value: string | boolean | number): string => {
      const fieldConfig = formFields.find((field) => field.key === key);

      if (!fieldConfig?.validation) return "";

      const { validation } = fieldConfig;
      const stringValue = String(value).trim();

      if (validation.required && !stringValue) {
        return "This field is required";
      }

      if (
        validation.pattern &&
        stringValue &&
        !validation.pattern.test(stringValue)
      ) {
        return validation.message || "Invalid format";
      }

      return "";
    },
    [formFields]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    if (!formData) return false;

    const errors: ValidationErrors = {};
    let isValid = true;

    formFields.forEach((field) => {
      if (isFieldHidden(field.key)) return;

      const error = validateField(
        field.key,
        formData[field.key] as string | boolean | number
      );
      if (error) {
        errors[field.key] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  }, [formData, formFields, validateField, isFieldHidden]);

  // Optimized handlers with useCallback
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => {
        if (!prev) return prev;

        const newValue = type === "checkbox" ? checked : value;

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
          setValidationErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
          });
        }

        return {
          ...prev,
          [name]: newValue,
        };
      });
    },
    [validationErrors]
  );

  // Handle radio button change separately
  const handleRadioChange = useCallback((name: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;

      // Clear validation error when user selects an option
      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });

      return {
        ...prev,
        [name]: value,
      };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData) return;

      if (!validateForm()) {
        setError("Please fix validation errors before submitting");
        return;
      }

      setSaving(true);
      setMessage("");
      setError("");

      try {
        // Prepare data for API - dates remain in DD/MM/YYYY format
        const submissionData = prepareDataForAPI(formData);

        console.log("Submitting data:", submissionData); // For debugging

        const { data } = await axios.put(
          `/api/birth/certificate/edit/${id}`,
          submissionData
        );
        setMessage("✅ Certificate updated successfully!");

        // Optional: Redirect after success
        router.push(`/birth/certificate/pdf/${data.data._id}`);
      } catch (err) {
        console.error("Update error:", err);
        setError("❌ Failed to update certificate");
      } finally {
        setSaving(false);
      }
    },
    [formData, id, router, validateForm, prepareDataForAPI]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Utility function to get field value safely
  const getFieldValue = useCallback(
    (key: keyof IFullData): string | boolean | number => {
      if (!formData) return "";
      const value = formData[key];
      return value !== undefined && value !== null ? value : "";
    },
    [formData]
  );

  // Filter visible fields
  const visibleFields = useMemo(() => {
    return formFields.filter((field) => !isFieldHidden(field.key));
  }, [formFields, isFieldHidden]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-12 w-12 text-blue-600"
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
        </div>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
          Loading certificate data...
        </p>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Error Loading Certificate
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleCancel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Certificate not found
          </h3>
          <button
            onClick={handleCancel}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
          Edit Birth Certificate
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Certificate ID: {formData.birthRegNumber}
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {visibleFields.map((field) => {
            const isReadOnly = isFieldReadOnly(field.key);
            const value = getFieldValue(field.key);
            const fieldError = validationErrors[field.key];
            const isRadioField = field.type === "radio";
            const isCheckboxField = field.type === "checkbox";

            return (
              <div
                key={field.key}
                className={
                  isRadioField
                    ? "col-span-full" // Make PDF Type radio buttons span full width
                    : isCheckboxField
                    ? "flex items-center space-x-3"
                    : ""
                }
              >
                <label
                  htmlFor={field.key}
                  className={`block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300 ${
                    isCheckboxField ? "mb-0" : ""
                  } ${isRadioField ? "text-base font-semibold" : ""}`}
                >
                  {field.label}
                  {field.validation?.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {isCheckboxField ? (
                  <div className="flex items-center">
                    <input
                      id={field.key}
                      name={field.key}
                      type="checkbox"
                      checked={!!value}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className={`w-5 h-5 rounded focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly
                          ? "opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      }`}
                    />
                  </div>
                ) : isRadioField ? (
                  <div className="flex flex-wrap gap-6 mt-2">
                    {field.options?.map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <input
                          type="radio"
                          name={field.key}
                          value={option}
                          checked={value === option}
                          onChange={(e) =>
                            handleRadioChange(field.key, e.target.value)
                          }
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                          required={field.validation?.required}
                        />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : field.type === "select" ? (
                  <select
                    id={field.key}
                    name={field.key}
                    value={value as string}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      isReadOnly
                        ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : fieldError
                        ? "bg-white dark:bg-gray-800 border-red-300 dark:border-red-700 text-gray-800 dark:text-gray-100 focus:ring-red-500 focus:border-red-500"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.type || "text"}
                    value={value as string | number}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    placeholder={
                      field.type === "text" && field.key.includes("Date")
                        ? "DD/MM/YYYY"
                        : ""
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      isReadOnly
                        ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : fieldError
                        ? "bg-white dark:bg-gray-800 border-red-300 dark:border-red-700 text-gray-800 dark:text-gray-100 focus:ring-red-500 focus:border-red-500"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                )}

                {fieldError && (
                  <p className="text-red-500 text-xs mt-1">{fieldError}</p>
                )}

                {field.validation?.pattern && !fieldError && (
                  <p className="text-gray-500 text-xs mt-1">
                    {field.key.includes("Bn")
                      ? "বাংলা ভাষায় লিখুন (সংখ্যা, কমা, ও বিশেষ অক্ষর অনুমোদিত)"
                      : field.key.includes("Date")
                      ? "ফরম্যাট: DD/MM/YYYY"
                      : field.validation.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-8 py-3 bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              saving
                ? "bg-gray-500 dark:bg-gray-700 text-gray-300 cursor-not-allowed"
                : "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white focus:ring-green-500"
            }`}
          >
            {saving ? (
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
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
