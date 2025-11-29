"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Address {
  division: string;
  district: string;
  rmo: string;
  city_corporation_or_municipality: string;
  upozila: string;
  union_ward: string;
  mouza_moholla: string;
  additional_mouza_moholla: string;
  ward_for_union_porishod: string;
  village_road: string;
  additional_village_road: string;
  home_holding_no: string;
  post_office: string;
  postal_code: string;
  region: string;
  _id?: string;
}

interface NIDData {
  _id: string;
  user: string;
  citizen_status: string;
  nid: string;
  pincode: string;
  status: string;
  voter_no: string;
  name_bn: string;
  name_en: string;
  dob: string;
  birth_place: string;
  birth_reg_no: string;
  father_name: string;
  mother_name: string;
  gender: string;
  marital_status: string;
  occupation: string;
  present_address: Address;
  permanent_address: Address;
  education: string;
  blood_group: string;
  religion: string;
  present_address_full: string;
  permanent_address_full: string;
  addresses_same: boolean;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  error: string | null;
  data: NIDData | null;
}

export default function EditNIDPage() {
  const params = useParams();
  const router = useRouter();
  const nidId = params.id as string;

  const [formData, setFormData] = useState<NIDData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch NID data on component mount
  useEffect(() => {
    const fetchNIDData = async () => {
      try {
        const response = await fetch(`/api/nid/get/${nidId}`);
        const result: ApiResponse = await response.json();

        if (result.success && result.data) {
          setFormData(result.data);
        } else {
          setError("Failed to fetch NID data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (nidId) {
      fetchNIDData();
    }
  }, [nidId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      if (!prev) return null;

      // Handle nested present_address fields
      if (name.startsWith("present_address.")) {
        const field = name.replace("present_address.", "");
        return {
          ...prev,
          present_address: {
            ...prev.present_address,
            [field]: value,
          },
        };
      }

      // Handle nested permanent_address fields
      if (name.startsWith("permanent_address.")) {
        const field = name.replace("permanent_address.", "");
        return {
          ...prev,
          permanent_address: {
            ...prev.permanent_address,
            [field]: value,
          },
        };
      }

      // Handle checkbox for addresses_same
      if (name === "addresses_same") {
        return {
          ...prev,
          addresses_same: checked,
        };
      }

      // Handle other fields
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) {
      setError("No form data available");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/nid/edit/${nidId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        router.push(`/nid/pdf/${nidId}`);
      } else {
        setError(result.error || "Failed to update NID data");
      }
    } catch (err) {
      setError("An error occurred while saving data");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy present address to permanent address
  const copyPresentToPermanent = () => {
    if (formData) {
      setFormData({
        ...formData,
        permanent_address: { ...formData.present_address },
        addresses_same: true,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading NID data...
          </p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <svg
              className="w-12 h-12 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
              Error
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Edit NID Information
                </h1>
                <p className="text-blue-100 mt-1">
                  Update all National ID details
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-green-700 dark:text-green-400">
                    NID data updated successfully! Redirecting...
                  </p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Basic Information
                </h3>
              </div>

              <FormField
                label="Citizen Status"
                name="citizen_status"
                value={formData?.citizen_status || ""}
                onChange={handleInputChange}
              />

              <FormField
                label="NID Number"
                name="nid"
                value={formData?.nid || ""}
                onChange={handleInputChange}
                required
              />

              <FormField
                label="PIN Code"
                name="pincode"
                value={formData?.pincode || ""}
                onChange={handleInputChange}
              />

              <FormField
                label="Status"
                name="status"
                value={formData?.status || ""}
                onChange={handleInputChange}
              />

              <FormField
                label="Voter Number"
                name="voter_no"
                value={formData?.voter_no || ""}
                onChange={handleInputChange}
              />
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Personal Information
                </h3>
              </div>

              <FormField
                label="Name (English)"
                name="name_en"
                value={formData?.name_en || ""}
                onChange={handleInputChange}
                required
              />

              <FormField
                label="Name (Bangla)"
                name="name_bn"
                value={formData?.name_bn || ""}
                onChange={handleInputChange}
                required
              />

              <FormField
                label="Date of Birth"
                name="dob"
                type="text"
                value={formData?.dob || ""}
                onChange={handleInputChange}
                required
              />

              <FormField
                label="Birth Place"
                name="birth_place"
                value={formData?.birth_place || ""}
                onChange={handleInputChange}
              />

              <FormField
                label="Birth Registration No"
                name="birth_reg_no"
                value={formData?.birth_reg_no || ""}
                onChange={handleInputChange}
              />

              <SelectField
                label="Gender"
                name="gender"
                value={formData?.gender || ""}
                onChange={handleInputChange}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />

              <SelectField
                label="Marital Status"
                name="marital_status"
                value={formData?.marital_status || ""}
                onChange={handleInputChange}
                options={[
                  { value: "married", label: "Married" },
                  { value: "unmarried", label: "Unmarried" },
                  { value: "divorced", label: "Divorced" },
                  { value: "widowed", label: "Widowed" },
                ]}
              />

              <FormField
                label="Occupation"
                name="occupation"
                value={formData?.occupation || ""}
                onChange={handleInputChange}
              />

              <SelectField
                label="Blood Group"
                name="blood_group"
                value={formData?.blood_group || ""}
                onChange={handleInputChange}
                options={[
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                ]}
              />

              <SelectField
                label="Religion"
                name="religion"
                value={formData?.religion || ""}
                onChange={handleInputChange}
                options={[
                  { value: "Islam", label: "Islam" },
                  { value: "Hinduism", label: "Hinduism" },
                  { value: "Buddhism", label: "Buddhism" },
                  { value: "Christianity", label: "Christianity" },
                  { value: "Other", label: "Other" },
                ]}
              />

              <FormField
                label="Education"
                name="education"
                value={formData?.education || ""}
                onChange={handleInputChange}
              />
            </div>

            {/* Family Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Family Information
                </h3>
              </div>

              <FormField
                label="Father's Name"
                name="father_name"
                value={formData?.father_name || ""}
                onChange={handleInputChange}
                required
              />

              <FormField
                label="Mother's Name"
                name="mother_name"
                value={formData?.mother_name || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Present Address - Detailed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">
                  Present Address (Detailed)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  label="Division"
                  name="present_address.division"
                  value={formData?.present_address.division || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="District"
                  name="present_address.district"
                  value={formData?.present_address.district || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="RMO"
                  name="present_address.rmo"
                  value={formData?.present_address.rmo || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="City Corporation/Municipality"
                  name="present_address.city_corporation_or_municipality"
                  value={
                    formData?.present_address
                      .city_corporation_or_municipality || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Upozila"
                  name="present_address.upozila"
                  value={formData?.present_address.upozila || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Union/Ward"
                  name="present_address.union_ward"
                  value={formData?.present_address.union_ward || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Mouza/Moholla"
                  name="present_address.mouza_moholla"
                  value={formData?.present_address.mouza_moholla || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Additional Mouza/Moholla"
                  name="present_address.additional_mouza_moholla"
                  value={
                    formData?.present_address.additional_mouza_moholla || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Ward for Union Porishod"
                  name="present_address.ward_for_union_porishod"
                  value={
                    formData?.present_address.ward_for_union_porishod || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Village/Road"
                  name="present_address.village_road"
                  value={formData?.present_address.village_road || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Additional Village/Road"
                  name="present_address.additional_village_road"
                  value={
                    formData?.present_address.additional_village_road || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Home/Holding No"
                  name="present_address.home_holding_no"
                  value={formData?.present_address.home_holding_no || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Post Office"
                  name="present_address.post_office"
                  value={formData?.present_address.post_office || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Postal Code"
                  name="present_address.postal_code"
                  value={formData?.present_address.postal_code || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Region"
                  name="present_address.region"
                  value={formData?.present_address.region || ""}
                  onChange={handleInputChange}
                />
              </div>

              {/* Present Address Full */}
              <div className="mt-4">
                <TextAreaField
                  label="Present Address (Full Text)"
                  name="present_address_full"
                  value={formData?.present_address_full || ""}
                  onChange={handleInputChange}
                  placeholder="Full address in text format"
                  rows={3}
                />
              </div>
            </div>

            {/* Permanent Address - Detailed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">
                  Permanent Address (Detailed)
                </h3>
                <button
                  type="button"
                  onClick={copyPresentToPermanent}
                  className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md transition-colors dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300"
                >
                  Copy from Present Address
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  label="Division"
                  name="permanent_address.division"
                  value={formData?.permanent_address.division || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="District"
                  name="permanent_address.district"
                  value={formData?.permanent_address.district || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="RMO"
                  name="permanent_address.rmo"
                  value={formData?.permanent_address.rmo || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="City Corporation/Municipality"
                  name="permanent_address.city_corporation_or_municipality"
                  value={
                    formData?.permanent_address
                      .city_corporation_or_municipality || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Upozila"
                  name="permanent_address.upozila"
                  value={formData?.permanent_address.upozila || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Union/Ward"
                  name="permanent_address.union_ward"
                  value={formData?.permanent_address.union_ward || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Mouza/Moholla"
                  name="permanent_address.mouza_moholla"
                  value={formData?.permanent_address.mouza_moholla || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Additional Mouza/Moholla"
                  name="permanent_address.additional_mouza_moholla"
                  value={
                    formData?.permanent_address.additional_mouza_moholla || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Ward for Union Porishod"
                  name="permanent_address.ward_for_union_porishod"
                  value={
                    formData?.permanent_address.ward_for_union_porishod || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Village/Road"
                  name="permanent_address.village_road"
                  value={formData?.permanent_address.village_road || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Additional Village/Road"
                  name="permanent_address.additional_village_road"
                  value={
                    formData?.permanent_address.additional_village_road || ""
                  }
                  onChange={handleInputChange}
                />

                <FormField
                  label="Home/Holding No"
                  name="permanent_address.home_holding_no"
                  value={formData?.permanent_address.home_holding_no || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Post Office"
                  name="permanent_address.post_office"
                  value={formData?.permanent_address.post_office || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Postal Code"
                  name="permanent_address.postal_code"
                  value={formData?.permanent_address.postal_code || ""}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Region"
                  name="permanent_address.region"
                  value={formData?.permanent_address.region || ""}
                  onChange={handleInputChange}
                />
              </div>

              {/* Permanent Address Full */}
              <div className="mt-4">
                <TextAreaField
                  label="Permanent Address (Full Text)"
                  name="permanent_address_full"
                  value={formData?.permanent_address_full || ""}
                  onChange={handleInputChange}
                  placeholder="Full address in text format"
                  rows={3}
                />
              </div>

              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="addresses_same"
                    checked={formData?.addresses_same || false}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Permanent address is same as present address
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save All Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Reusable Form Field Component
interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  disabled = false,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  );
}

// Reusable Select Field Component
interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Reusable TextArea Field Component
interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
}: TextAreaFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-vertical"
      />
    </div>
  );
}
