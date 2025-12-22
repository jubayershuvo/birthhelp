"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  User,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Signature,
  Camera,
  Save,
  ArrowLeft,
  FileText,
  Home,
  Users,
  Book,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* 🔹 Types */
interface PassportFormData {
  passportNumber: string;
  name: string;
  fathersName: string;
  mothersName: string;
  spousesName: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactAddress: string;
  emergencyContactTelephone: string;
  surname: string;
  givenName: string;
  nationality: string;
  personalNumber: string;
  birthDate: string;
  gender: string;
  birthPlace: string;
  issueDate: string;
  issuingAuthority: string;
  expiryDate: string;
  photo?: string;
  signature?: string;
  previousPassportNo: string;
}

const emptyForm: PassportFormData = {
  passportNumber: "",
  name: "",
  fathersName: "",
  mothersName: "",
  spousesName: "",
  permanentAddress: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactAddress: "",
  emergencyContactTelephone: "",
  surname: "",
  givenName: "",
  nationality: "BANGLADESHI",
  personalNumber: "",
  birthDate: "",
  gender: "",
  birthPlace: "",
  issueDate: "",
  issuingAuthority: "",
  expiryDate: "",
  photo: "",
  signature: "",
  previousPassportNo: "",
};

// Define required fields for validation
const requiredFields = [
  "passportNumber",
  "name",
  "surname",
  "givenName",
  "birthDate",
  "gender",
  "birthPlace",
  "nationality",
  "personalNumber",
  "fathersName",
  "mothersName",
  "permanentAddress",
  "issueDate",
  "expiryDate",
  "issuingAuthority",
];

// Example placeholder data for each field
const exampleData: { [key: string]: string } = {
  passportNumber: "e.g. A12345678",
  name: "e.g. MD ABDUL KARIM",
  surname: "e.g. KARIM",
  givenName: "e.g. MD ABDUL",
  fathersName: "e.g. MD ABDUL RAHMAN",
  mothersName: "e.g. FATEMA BEGUM",
  spousesName: "e.g. AYESHA SULTANA (if married)",
  permanentAddress: "e.g. 123/456, Mirpur Road, Dhaka-1216",
  emergencyContactName: "e.g. MD KAMAL HOSSAIN",
  emergencyContactRelationship: "e.g. Brother",
  emergencyContactAddress: "e.g. 123/456, Mirpur Road, Dhaka-1216",
  emergencyContactTelephone: "e.g. +8801712345678",
  personalNumber: "e.g. 1234567890123",
  birthDate: "e.g. 01 MAY 1990",
  birthPlace: "e.g. DHAKA",
  issueDate: "e.g. 01 JAN 2023",
  expiryDate: "e.g. 01 JAN 2033",
  issuingAuthority: "e.g. DIP / DHAKA",

  previousPassportNo: "e.g. B98765432 (if any)",
};

const genderOptions = [
  { value: "M", label: "Male", icon: "👨" },
  { value: "F", label: "Female", icon: "👩" },
  { value: "X", label: "Other", icon: "👤" },
];

const nationalityOptions = [
  "BANGLADESHI",
  "USA",
  "UK",
  "CANADA",
  "AUSTRALIA",
  "INDIA",
  "GERMANY",
  "FRANCE",
  "JAPAN",
  "CHINA",
];

const formSections = [
  {
    id: "personal-info",
    title: "Personal Information",
    icon: <User className="w-5 h-5" />,
    description: "Enter your personal details as shown in your passport",
    fields: [
      {
        name: "givenName",
        label: "Given Name",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "surname",
        label: "Surname",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "name",
        label: "Full Name",
        required: true,
        type: "text",
        colSpan: 2,
      },
      {
        name: "gender",
        label: "Gender",
        required: true,
        type: "gender",
        colSpan: 1,
      },
      {
        name: "birthDate",
        label: "Date of Birth",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "birthPlace",
        label: "Place of Birth",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "nationality",
        label: "Nationality",
        required: true,
        type: "select",
        colSpan: 1,
      },
      {
        name: "personalNumber",
        label: "Personal Number",
        required: true,
        type: "text",
        colSpan: 1,
      },
    ],
  },
  {
    id: "passport-details",
    title: "Passport Details",
    icon: <Book className="w-5 h-5" />,
    description: "Enter your passport information",
    fields: [
      {
        name: "passportNumber",
        label: "Passport Number",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "previousPassportNo",
        label: "Previous Passport No",
        required: false,
        type: "text",
        colSpan: 1,
      },
      {
        name: "issueDate",
        label: "Issue Date",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "expiryDate",
        label: "Expiry Date",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "issuingAuthority",
        label: "Issuing Authority",
        required: true,
        type: "text",
        colSpan: 1,
      },
    ],
  },
  {
    id: "family-info",
    title: "Family Information",
    icon: <Users className="w-5 h-5" />,
    description: "Enter your family details",
    fields: [
      {
        name: "fathersName",
        label: "Father's Name",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "mothersName",
        label: "Mother's Name",
        required: true,
        type: "text",
        colSpan: 1,
      },
      {
        name: "spousesName",
        label: "Spouse's Name",
        required: false,
        type: "text",
        colSpan: 2,
      },
    ],
  },
  {
    id: "contact-info",
    title: "Contact Information",
    icon: <Home className="w-5 h-5" />,
    description: "Enter your contact details",
    fields: [
      {
        name: "permanentAddress",
        label: "Permanent Address",
        required: true,
        type: "textarea",
        colSpan: 2,
      },
    ],
  },
  {
    id: "emergency-contact",
    title: "Emergency Contact",
    icon: <Phone className="w-5 h-5" />,
    description: "Enter emergency contact information",
    fields: [
      {
        name: "emergencyContactName",
        label: "Emergency Contact Name",
        required: false,
        type: "text",
        colSpan: 1,
      },
      {
        name: "emergencyContactRelationship",
        label: "Relationship",
        required: false,
        type: "text",
        colSpan: 1,
      },
      {
        name: "emergencyContactAddress",
        label: "Emergency Contact Address",
        required: false,
        type: "textarea",
        colSpan: 2,
      },
      {
        name: "emergencyContactTelephone",
        label: "Emergency Contact Telephone",
        required: false,
        type: "text",
        colSpan: 1,
      },
    ],
  },
];

const getFieldIcon = (fieldName: string) => {
  switch (fieldName) {
    case "name":
    case "surname":
    case "givenName":
    case "fathersName":
    case "mothersName":
    case "spousesName":
    case "emergencyContactName":
      return <User className="w-4 h-4 text-gray-400" />;
    case "birthDate":
    case "issueDate":
    case "expiryDate":
      return <Calendar className="w-4 h-4 text-gray-400" />;
    case "birthPlace":
    case "permanentAddress":
    case "emergencyContactAddress":
      return <MapPin className="w-4 h-4 text-gray-400" />;
    case "emergencyContactTelephone":
      return <Phone className="w-4 h-4 text-gray-400" />;
    case "nationality":
      return <Globe className="w-4 h-4 text-gray-400" />;
    case "passportNumber":
    case "previousPassportNo":
    case "personalNumber":
      return <FileText className="w-4 h-4 text-gray-400" />;
    case "issuingAuthority":
      return <Home className="w-4 h-4 text-gray-400" />;
    default:
      return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

export default function PassportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [form, setForm] = useState<PassportFormData>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<
    Record<string, boolean>
  >({});

  /* 🔹 Fetch passport (EDIT MODE) */
  useEffect(() => {
    if (!id) return;

    const fetchPassport = async () => {
      try {
        const res = await fetch(`/api/passport?id=${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch passport");
        }
        const data = await res.json();

        if (data.photo) {
          setPhotoPreview(data.photo);
        }
        if (data.signature) {
          setSignaturePreview(data.signature);
        }

        const { photo, signature, ...formData } = data;
        setForm(formData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load passport data");
      }
    };

    fetchPassport();
  }, [id]);

  /* 🔹 Clean up object URLs */
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
      if (signaturePreview && signaturePreview.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreview);
      }
    };
  }, [photoPreview, signaturePreview]);

  /* 🔹 Update completion status */
  useEffect(() => {
    const status: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      status[field] = !!form[field as keyof PassportFormData]
        ?.toString()
        .trim();
    });
    status["photo"] = !!(photoPreview || form.photo);
    status["signature"] = !!(signaturePreview || form.signature);
    setCompletionStatus(status);
  }, [form, photoPreview, signaturePreview]);

  /* 🔹 Validate all fields */
  const validateAllFields = () => {
    const errors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      if (!form[field as keyof PassportFormData]?.toString().trim()) {
        errors[field] = `${field} is required`;
      }
    });

    if (!form.gender) {
      errors.gender = "Gender is required";
    }

    if (!photoPreview && !form.photo) {
      errors.photo = "Passport photo is required";
    }

    if (!signaturePreview && !form.signature) {
      errors.signature = "Signature is required";
    }

    // Date validations
    if (form.birthDate) {
      const birthDate = new Date(form.birthDate);
      if (isNaN(birthDate.getTime())) {
        errors.birthDate = "Please enter a valid birth date";
      } else if (birthDate > new Date()) {
        errors.birthDate = "Birth date cannot be in the future";
      }
    }

    if (form.issueDate) {
      const issueDate = new Date(form.issueDate);
      if (isNaN(issueDate.getTime())) {
        errors.issueDate = "Please enter a valid issue date";
      }
    }

    if (form.expiryDate) {
      const expiryDate = new Date(form.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        errors.expiryDate = "Please enter a valid expiry date";
      }
    }

    if (form.expiryDate && form.issueDate) {
      const issueDate = new Date(form.issueDate);
      const expiryDate = new Date(form.expiryDate);
      if (
        !isNaN(issueDate.getTime()) &&
        !isNaN(expiryDate.getTime()) &&
        expiryDate <= issueDate
      ) {
        errors.expiryDate = "Expiry date must be after issue date";
      }
    }

    // Format validations
    if (form.passportNumber && !/^[A-Z]{1,2}[0-9]{8,14}$/.test(form.passportNumber)) {
      errors.passportNumber = "Passport number should be like A12345678 or AH48545214";
  
    }

    if (form.personalNumber && !/^\d{10,15}$/.test(form.personalNumber)) {
      errors.personalNumber = "Personal number should be 10-15 digits";
    }

    setValidationErrors(errors);
    setShowAllErrors(true);
    return Object.keys(errors).length === 0;
  };

  /* 🔹 Text change */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /* 🔹 File change handlers */
  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Photo size should be less than 2MB");
      return;
    }

    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");

    if (validationErrors.photo) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });
    }
  };

  const handleSignature = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      setError("Signature size should be less than 1MB");
      return;
    }

    if (signaturePreview && signaturePreview.startsWith("blob:")) {
      URL.revokeObjectURL(signaturePreview);
    }

    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
    setError("");

    if (validationErrors.signature) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.signature;
        return newErrors;
      });
    }
  };

  /* 🔹 Submit */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowAllErrors(true);

    // Validate all fields
    if (!validateAllFields()) {
      setLoading(false);

      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        let element = document.querySelector(`[name="${firstErrorField}"]`);
        if (!element) {
          if (firstErrorField === "photo") {
            element = document.getElementById("photo-upload");
          } else if (firstErrorField === "signature") {
            element = document.getElementById("signature-upload");
          }
        }
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    try {
      const fd = new FormData();

      // Append all form fields except files
      Object.entries(form).forEach(([key, value]) => {
        if (
          key !== "photo" &&
          key !== "signature" &&
          value !== undefined &&
          value !== null
        ) {
          fd.append(key, String(value));
        }
      });

      // Append files if they exist
      if (photoFile) {
        fd.append("photo", photoFile);
      } else if (form.photo && !photoPreview.startsWith("blob:")) {
        fd.append("photo", form.photo);
      }

      if (signatureFile) {
        fd.append("signature", signatureFile);
      } else if (form.signature && !signaturePreview.startsWith("blob:")) {
        fd.append("signature", form.signature);
      }

      const url = id ? `/api/passport?id=${id}` : "/api/passport";
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save passport");
      }

      alert(
        id ? "Passport updated successfully" : "Passport created successfully"
      );
      router.push(`/passport/pdf/${data._id}`);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFillExample = () => {
    setForm({
      ...form,
      passportNumber: "A12345678",
      name: "MD ABDUL KARIM",
      surname: "KARIM",
      givenName: "MD ABDUL",
      fathersName: "MD ABDUL RAHMAN",
      mothersName: "FATEMA BEGUM",
      spousesName: "AYESHA SULTANA",
      permanentAddress: "123/456, Mirpur Road, Dhaka-1216",
      emergencyContactName: "MD KAMAL HOSSAIN",
      emergencyContactRelationship: "Brother",
      emergencyContactAddress: "123/456, Mirpur Road, Dhaka-1216",
      emergencyContactTelephone: "+8801712345678",
      personalNumber: "1234567890123",
      birthDate: "01 MAY 1990",
      birthPlace: "DHAKA",
      issueDate: "01 JAN 2023",
      expiryDate: "01 JAN 2033",
      issuingAuthority: "DIP / DHAKA",
      previousPassportNo: "B98765432",
      gender: "M",
    });
    setValidationErrors({});
  };

  const handleClearForm = () => {
    setForm(emptyForm);
    setValidationErrors({});
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    if (signaturePreview && signaturePreview.startsWith("blob:")) {
      URL.revokeObjectURL(signaturePreview);
    }
    setPhotoPreview("");
    setSignaturePreview("");
    setPhotoFile(null);
    setSignatureFile(null);
  };

  // Calculate completion percentage
  const completionPercentage = () => {
    const totalFields = requiredFields.length + 2; // +2 for photo and signature
    const completedFields =
      Object.values(completionStatus).filter(Boolean).length;
    return Math.round((completedFields / totalFields) * 100);
  };

  const renderField = (field: {
    name: string;
    label: string;
    required: boolean;
    type: string;
    colSpan: number;
  }) => {
    const { name, label, required, type, colSpan } = field;
    const hasError = validationErrors[name];
    const value = form[name as keyof PassportFormData] || "";
    const isComplete = completionStatus[name];

    return (
      <div
        key={name}
        className={`space-y-2 ${colSpan === 2 ? "md:col-span-2" : ""}`}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFieldIcon(name)}
              {label}
              {required && <span className="text-red-500">*</span>}
            </div>
            {isComplete && !hasError && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {hasError && <XCircle className="w-4 h-4 text-red-500" />}
          </div>
        </label>

        {type === "gender" ? (
          <div>
            <div className="grid grid-cols-3 gap-3">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, gender: option.value }));
                    if (validationErrors.gender) {
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.gender;
                        return newErrors;
                      });
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    form.gender === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  } ${hasError ? "border-red-500" : ""}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
        ) : type === "select" ? (
          <div>
            <div className="relative">
              <select
                name={name}
                value={value}
                onChange={handleChange}
                className={`w-full px-4 py-3 pl-10 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                  hasError
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Select {label}</option>
                {nationalityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
        ) : type === "textarea" ? (
          <div>
            <textarea
              name={name}
              value={value}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                hasError
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder={exampleData[name] || `Enter ${label.toLowerCase()}`}
            />
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
        ) : (
          <div>
            <div className="relative">
              <input
                type={type === "date" ? "date" : "text"}
                name={name}
                value={value}
                onChange={handleChange}
                className={`w-full px-4 py-3 pl-10 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  hasError
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  exampleData[name] || `Enter ${label.toLowerCase()}`
                }
              />
            </div>
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
        )}

        {!hasError && exampleData[name] && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            {exampleData[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {id ? "Edit Passport" : "Create New Passport"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Fill in all required fields. Fields marked with * are mandatory.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      completionPercentage() === 100
                        ? "bg-green-500"
                        : completionPercentage() >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${completionPercentage()}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {completionPercentage()}% Complete
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleFillExample}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                >
                  Fill Example
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {showAllErrors && Object.keys(validationErrors).length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded-r">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Please fix the following errors:
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(validationErrors).map(
                      ([field, message]) => (
                        <li key={field}>
                          <strong>{field}:</strong> {message}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo & Signature Preview Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-6 space-y-6">
                {/* Progress Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Required Fields Status
                  </h3>
                  <div className="space-y-3">
                    {requiredFields.map((field) => {
                      const isComplete = completionStatus[field];
                      const hasError = validationErrors[field];

                      return (
                        <div
                          key={field}
                          className="flex items-center justify-between"
                        >
                          <span
                            className={`text-sm ${
                              hasError
                                ? "text-red-600 dark:text-red-400"
                                : isComplete
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {field
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasError && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            {isComplete && !hasError && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {!isComplete && !hasError && (
                              <div className="w-3 h-3 rounded-full bg-gray-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Photo and Signature status */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            validationErrors.photo
                              ? "text-red-600 dark:text-red-400"
                              : completionStatus.photo
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          Passport Photo
                        </span>
                        <div className="flex items-center gap-2">
                          {validationErrors.photo && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          {completionStatus.photo &&
                            !validationErrors.photo && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          {!completionStatus.photo &&
                            !validationErrors.photo && (
                              <div className="w-3 h-3 rounded-full bg-gray-300" />
                            )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-sm ${
                            validationErrors.signature
                              ? "text-red-600 dark:text-red-400"
                              : completionStatus.signature
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          Signature
                        </span>
                        <div className="flex items-center gap-2">
                          {validationErrors.signature && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          {completionStatus.signature &&
                            !validationErrors.signature && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          {!completionStatus.signature &&
                            !validationErrors.signature && (
                              <div className="w-3 h-3 rounded-full bg-gray-300" />
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo Preview */}
                <div
                  className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 ${
                    validationErrors.photo ? "border-2 border-red-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        Passport Photo *
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        35×45mm, White Background
                      </p>
                    </div>
                    {validationErrors.photo && (
                      <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
                    )}
                  </div>
                  <div className="relative w-full h-48 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    {photoPreview || form.photo ? (
                      <Image
                        src={photoPreview || form.photo || "/placeholder.png"}
                        alt="Passport photo preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          No photo selected
                        </p>
                        {validationErrors.photo && (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors.photo}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature Preview */}
                <div
                  className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 ${
                    validationErrors.signature ? "border-2 border-red-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Signature className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        Signature *
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Black ink on white paper
                      </p>
                    </div>
                    {validationErrors.signature && (
                      <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
                    )}
                  </div>
                  <div className="relative w-full h-24 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    {signaturePreview || form.signature ? (
                      <Image
                        src={
                          signaturePreview ||
                          form.signature ||
                          "/placeholder.png"
                        }
                        alt="Signature preview"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Signature className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          No signature selected
                        </p>
                        {validationErrors.signature && (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors.signature}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form Content */}
            <div className="lg:col-span-2">
              {formSections.map((section) => (
                <div
                  key={section.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    {section.icon}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {section.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.fields.map(renderField)}
                  </div>
                </div>
              ))}

              {/* File Upload Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Required Documents *
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          Passport Photo
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Requirements: 35×45mm, White background
                        </p>
                      </div>
                      {validationErrors.photo && (
                        <AlertCircle className="w-5 h-5 text-red-500 ml-auto" />
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className={`block p-4 border-2 border-dashed rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer ${
                          validationErrors.photo
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload photo
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            PNG, JPG up to 2MB
                          </p>
                          {validationErrors.photo && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.photo}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Signature Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Signature className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          Signature
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Requirements: Black ink on white paper
                        </p>
                      </div>
                      {validationErrors.signature && (
                        <AlertCircle className="w-5 h-5 text-red-500 ml-auto" />
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignature}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="signature-upload"
                      />
                      <label
                        htmlFor="signature-upload"
                        className={`block p-4 border-2 border-dashed rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer ${
                          validationErrors.signature
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload signature
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            PNG, JPG up to 1MB
                          </p>
                          {validationErrors.signature && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors.signature}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Ready to {id ? "Update" : "Create"} Passport
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Review all information before submitting. Make sure all
                        required fields are filled.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              completionPercentage() === 100
                                ? "bg-green-500"
                                : completionPercentage() >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${completionPercentage()}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {completionPercentage()}% Complete
                        </span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 min-w-[200px]"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          {id ? "Update Passport" : "Create Passport"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
