"use client";

import {
  countriesList,
  dutaBasCountries,
  nationalityOptions,
} from "@/json/countries";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

// Mock data for countries and nationalities

// Types
interface GeoLocation {
  id: string;
  nameBn: string;
  nameEn: string;
  geoLevelId?: number;
  targetGeoOrder?: number;
  geoId?: string;
  officeNameBn?: string;
  officeNameEn?: string;
}

interface Address {
  country: string;
  geoId: string;
  division: string;
  divisionName: string;
  district: string;
  districtName: string;
  cityCorpCantOrUpazila: string;
  upazilaName: string;
  paurasavaOrUnion: string;
  unionName: string;
  postOfc: string;
  postOfcEn: string;
  vilAreaTownBn: string;
  vilAreaTownEn: string;
  houseRoadBn: string;
  houseRoadEn: string;
  ward: string;
  wardName: string;
}

interface GeoSelectorProps {
  onApply: (address: Address) => void;
  initial?: Partial<Address>;
  label?: string;
  required?: boolean;
  validateOnNext?: boolean;
  buttonText?: string;
  isBdMission: boolean;
}

interface LoadingState {
  division: boolean;
  district: boolean;
  upazila: boolean;
  union: boolean;
  ward: boolean;
}

interface OptionsState {
  division: GeoLocation[];
  district: GeoLocation[];
  upazila: GeoLocation[];
  union: GeoLocation[];
  ward: GeoLocation[];
}

interface GeoResponse {
  geoObject: GeoLocation[];
}

interface OfficeGeoResponse {
  geoGroup: string;
  geoOrder: number;
  geoType: number;
  targetGeoOrder: number;
  geoObject: GeoLocation | GeoLocation[];
}

const countriesListb = [
  {
    id: "1",
    nameBn: "বাংলাদেশ",
    nameEn: "BANGLADESH",
    geoId: "0",
    geoParentId: "5556",
  },
];

// Utility functions for date validation
const isValidDate = (day: number, month: number, year: number): boolean => {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Check for months with 30 days
  if ([4, 6, 9, 11].includes(month) && day > 30) return false;

  // Check for February
  if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (isLeapYear && day > 29) return false;
    if (!isLeapYear && day > 28) return false;
  }

  return true;
};

const parseDateString = (
  dateStr: string
): { day: number; month: number; year: number; valid: boolean } => {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return { day: 0, month: 0, year: 0, valid: false };

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return { day: 0, month: 0, year: 0, valid: false };
  }

  const valid = isValidDate(day, month, year);
  return { day, month, year, valid };
};

const formatDateForInput = (dateStr: string): string => {
  const { day, month, year, valid } = parseDateString(dateStr);
  if (!valid) return "";

  // Convert to YYYY-MM-DD for input[type="date"]
  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};

const formatDateForDisplay = (dateStr: string): string => {
  const { day, month, year, valid } = parseDateString(dateStr);
  if (!valid) return dateStr;

  return `${day.toString().padStart(2, "0")}/${month
    .toString()
    .padStart(2, "0")}/${year}`;
};

const isFutureDate = (day: number, month: number, year: number): boolean => {
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
};

const calculateAgeFromDDMMYYYY = (
  dateStr: string
): { years: number; months: number; days: number } => {
  const { day, month, year, valid } = parseDateString(dateStr);
  if (!valid) return { years: 0, months: 0, days: 0 };

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const previousMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    ).getDate();
    days += previousMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
};

// Date input component with DD/MM/YYYY format
const DateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  maxDate?: string; // in DD/MM/YYYY format
}> = ({ value, onChange, label, required = false, maxDate }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [error, setError] = useState("");

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr.trim()) {
      setError(required ? "তারিখ প্রয়োজন" : "");
      return !required;
    }

    const { day, month, year, valid } = parseDateString(dateStr);

    if (!valid) {
      setError("অবৈধ তারিখ ফরম্যাট। DD/MM/YYYY ব্যবহার করুন");
      return false;
    }

    if (year < 1900) {
      setError("বছর ১৯০০ এর কম হতে পারবে না");
      return false;
    }

    if (isFutureDate(day, month, year)) {
      setError("ভবিষ্যতের তারিখ গ্রহণযোগ্য নয়");
      return false;
    }

    if (maxDate) {
      const maxDateParsed = parseDateString(maxDate);
      if (maxDateParsed.valid) {
        const inputDate = new Date(year, month - 1, day);
        const maxDateObj = new Date(
          maxDateParsed.year,
          maxDateParsed.month - 1,
          maxDateParsed.day
        );
        if (inputDate > maxDateObj) {
          setError(`তারিখ ${maxDate} এর আগে হতে হবে`);
          return false;
        }
      }
    }

    setError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Auto-format as user types
    input = input.replace(/\D/g, ""); // Remove non-digits

    if (input.length > 2 && input.length <= 4) {
      input = input.slice(0, 2) + "/" + input.slice(2);
    } else if (input.length > 4) {
      input =
        input.slice(0, 2) + "/" + input.slice(2, 4) + "/" + input.slice(4, 8);
    }

    setDisplayValue(input);

    if (input.length === 10) {
      if (validateDate(input)) {
        onChange(input);
      }
    } else {
      setError("");
    }
  };

  const handleBlur = () => {
    if (displayValue) {
      validateDate(displayValue);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="DD/MM/YYYY"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        }`}
        maxLength={10}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {value && !error && (
        <p className="text-green-600 dark:text-green-400 text-sm">
          বৈধ তারিখ: {formatDateForDisplay(value)}
        </p>
      )}
    </div>
  );
};

// Address Selector Modal Component
const AddressSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApply: (address: Address) => void;
  initial?: Partial<Address>;
  title: string;
  isBdMission: boolean;
}> = ({ isOpen, onClose, onApply, initial, title, isBdMission }) => {
  const [selected, setSelected] = useState({
    country: initial?.country || "-1",
    division: initial?.division || "-1",
    district: initial?.district || "-1",
    upazila: initial?.cityCorpCantOrUpazila || "-1",
    union: initial?.paurasavaOrUnion || "-1",
    ward: initial?.ward || "-1",
  });

  const [addressInputs, setAddressInputs] = useState({
    postOfc: initial?.postOfc || "",
    postOfcEn: initial?.postOfcEn || "",
    vilAreaTownBn: initial?.vilAreaTownBn || "",
    vilAreaTownEn: initial?.vilAreaTownEn || "",
    houseRoadBn: initial?.houseRoadBn || "",
    houseRoadEn: initial?.houseRoadEn || "",
  });

  const [loading, setLoading] = useState<LoadingState>({
    division: false,
    district: false,
    upazila: false,
    union: false,
    ward: false,
  });

  const [options, setOptions] = useState<OptionsState>({
    division: [],
    district: [],
    upazila: [],
    union: [],
    ward: [],
  });

  const [wardLabel, setWardLabel] = useState("ওয়ার্ড");
  const [showWardSection, setShowWardSection] = useState(false);

  const api = "/api/address?ajax=1";

  const refs = {
    country: useRef<HTMLSelectElement>(null),
    division: useRef<HTMLSelectElement>(null),
    district: useRef<HTMLSelectElement>(null),
    upazila: useRef<HTMLSelectElement>(null),
    union: useRef<HTMLSelectElement>(null),
    ward: useRef<HTMLSelectElement>(null),
  };

  const showLoading = (field: keyof LoadingState, visible: boolean) => {
    setLoading((prev) => ({ ...prev, [field]: visible }));
  };

  const clearSelects = (fields: (keyof OptionsState)[]) => {
    setOptions((prev) => {
      const newOptions = { ...prev };
      fields.forEach((field) => {
        newOptions[field] = [];
      });
      return newOptions;
    });
  };

  const buildUrl = (
    parentId: string,
    order: string,
    type: string,
    ward = false
  ) => {
    const wardParam = ward ? "&ward=true" : "";
    return `${api}&parent=${encodeURIComponent(
      parentId
    )}&geoGroup=birthPlace&geoOrder=${order}&geoType=${encodeURIComponent(
      type
    )}${wardParam}`;
  };

  const loadGeo = async (
    target: keyof OptionsState,
    parentId: string,
    order: string,
    type: string,
    ward = false
  ): Promise<GeoLocation[]> => {
    if (!parentId || parentId === "-1") return [];

    showLoading(target, true);
    const url = buildUrl(parentId, order, type, ward);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: GeoResponse = await response.json();
      const list = Array.isArray(data.geoObject) ? data.geoObject : [];

      const safeList = list.map((item) => ({
        ...item,
        id: item.id.toString(),
        nameBn: (item.nameBn || "").replace(/</g, "&lt;"),
        nameEn: (item.nameEn || "").replace(/</g, "&lt;"),
      }));

      setOptions((prev) => ({ ...prev, [target]: safeList }));

      if (target === "ward") {
        setShowWardSection(safeList.length > 0);
      }

      return safeList;
    } catch (error) {
      console.error("Error loading geo data:", error);
      toast.error("লোড করতে সমস্যা হয়েছে");

      if (target === "ward") {
        setShowWardSection(false);
      }

      return [];
    } finally {
      showLoading(target, false);
    }
  };

  const getParams = (ref: React.RefObject<HTMLSelectElement>) => {
    const selectElement = ref.current;
    if (!selectElement?.selectedOptions?.[0]) return null;

    const option = selectElement.selectedOptions[0];
    return {
      parentId: option.value,
      nextOrder: option.dataset.nextOrder ?? "",
      nextType: option.dataset.nextType ?? "",
      currentType: option.dataset.currentType ?? "",
    };
  };

  const handleAddressInputChange = (
    field: keyof typeof addressInputs,
    value: string
  ) => {
    setAddressInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected((prev) => ({
      ...prev,
      country: value,
      division: "-1",
      district: "-1",
      upazila: "-1",
      union: "-1",
      ward: "-1",
    }));

    clearSelects(["division", "district", "upazila", "union", "ward"]);
    setShowWardSection(false);

    if (value === "1") {
      loadGeo("division", "1", "0", "0");
    }
  };

  const handleDivision = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected((prev) => ({
      ...prev,
      division: value,
      district: "-1",
      upazila: "-1",
      union: "-1",
      ward: "-1",
    }));

    clearSelects(["district", "upazila", "union", "ward"]);
    setShowWardSection(false);

    if (!value || value === "-1") return;

    const params = getParams(
      refs.division as React.RefObject<HTMLSelectElement>
    );
    if (!params) return;

    loadGeo(
      "district",
      params.parentId,
      params.nextOrder || "1",
      params.nextType || "1"
    );
  };

  const handleDistrict = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected((prev) => ({
      ...prev,
      district: value,
      upazila: "-1",
      union: "-1",
      ward: "-1",
    }));

    clearSelects(["upazila", "union", "ward"]);
    setShowWardSection(false);

    if (!value || value === "-1") return;

    const params = getParams(
      refs.district as React.RefObject<HTMLSelectElement>
    );
    if (!params) return;

    loadGeo(
      "upazila",
      params.parentId,
      params.nextOrder || "2",
      params.nextType || "2"
    );
  };

  const handleUpazila = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected((prev) => ({
      ...prev,
      upazila: value,
      union: "-1",
      ward: "-1",
    }));

    clearSelects(["union", "ward"]);
    setShowWardSection(false);

    if (!value || value === "-1") return;

    const params = getParams(
      refs.upazila as React.RefObject<HTMLSelectElement>
    );
    if (!params) return;

    const upazilaId = params.parentId;
    showLoading("union", true);

    Promise.all([
      fetch(buildUrl(upazilaId, "3", "8"))
        .then((r) => r.json())
        .catch(() => ({ geoObject: [] })),
      fetch(buildUrl(upazilaId, "3", "7", true))
        .then((r) => r.json())
        .catch(() => ({ geoObject: [] })),
      fetch(buildUrl(upazilaId, "3", "3"))
        .then((r) => r.json())
        .catch(() => ({ geoObject: [] })),
    ])
      .then(([city, canton, union]) => {
        const allGeoLocations: GeoLocation[] = [];

        [city, canton, union].forEach((data) => {
          const list = (data as GeoResponse).geoObject || [];
          list.forEach((item) =>
            allGeoLocations.push({
              ...item,
              id: item.id.toString(),
              nameBn: (item.nameBn || "").replace(/</g, "&lt;"),
              nameEn: (item.nameEn || "").replace(/</g, "&lt;"),
            })
          );
        });

        setOptions((prev) => ({ ...prev, union: allGeoLocations }));
      })
      .catch((error) => {
        console.error("Error loading union data:", error);
        toast.error("ইউনিয়ন লোড করতে সমস্যা হয়েছে");
      })
      .finally(() => {
        showLoading("union", false);
      });
  };

  const handleUnion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected((prev) => ({
      ...prev,
      union: value,
      ward: "-1",
    }));

    clearSelects(["ward"]);
    setShowWardSection(false);

    if (!value || value === "-1") return;

    const params = getParams(refs.union as React.RefObject<HTMLSelectElement>);
    if (!params) return;

    const unionType = params.currentType;

    if (unionType === "7") {
      setWardLabel("ওয়ার্ড (ক্যান্টনমেন্ট)");
    } else if (unionType === "8") {
      setWardLabel("ওয়ার্ড (সিটি)");
    } else {
      setWardLabel("ওয়ার্ড");
    }

    let wardType = "5";
    if (unionType === "8") wardType = "9";
    else if (unionType === "7") wardType = "6";

    loadGeo("ward", params.parentId, "4", wardType, true);
  };

  const handleWard = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected((prev) => ({ ...prev, ward: e.target.value }));
  };

  const buildAddress = (): Address | null => {
    const getCountry = () => {
      return (
        countriesList.find((country) => country.id === selected.country) || null
      );
    };

    const getGeoLocation = (field: keyof typeof selected) => {
      const id = selected[field];
      if (!id || id === "-1") return null;

      const list = options[field as keyof OptionsState] as GeoLocation[];
      return list.find((item) => item.id.toString() === id.toString()) ?? null;
    };

    const country = getCountry();
    if (!country || country.id === "-1") {
      toast.error("দয়া করে একটি দেশ নির্বাচন করুন");
      return null;
    }

    const division = getGeoLocation("division");
    const district = getGeoLocation("district");
    const upazila = getGeoLocation("upazila");
    const union = getGeoLocation("union");
    const ward = getGeoLocation("ward");

    if (country.id === "1") {
      if (!division || !district || !upazila || !union) {
        toast.error("দয়া করে সকল প্রয়োজনীয় ঠিকানা তথ্য নির্বাচন করুন");
        return null;
      }

      if (showWardSection && selected.ward && selected.ward !== "-1" && !ward) {
        toast.error("দয়া করে ওয়ার্ড নির্বাচন করুন");
        return null;
      }
    }

    if (country.id !== "1") {
      if (
        !addressInputs.vilAreaTownBn.trim() &&
        !addressInputs.vilAreaTownEn.trim()
      ) {
        toast.error("দয়া করে ঠিকানা লিখুন (বাংলা বা ইংরেজিতে)");
        return null;
      }
    }

    return {
      country: country.id,
      geoId: country.geoId || "0",
      division: division?.id || "-1",
      divisionName: division?.nameBn || "",
      district: district?.id || "-1",
      districtName: district?.nameBn || "",
      cityCorpCantOrUpazila: upazila?.id || "-1",
      upazilaName: upazila?.nameBn || "",
      paurasavaOrUnion: union?.id || "-1",
      unionName: union?.nameBn || "",
      postOfc: addressInputs.postOfc || "",
      postOfcEn: addressInputs.postOfcEn || "",
      vilAreaTownBn: addressInputs.vilAreaTownBn || "",
      vilAreaTownEn: addressInputs.vilAreaTownEn || "",
      houseRoadBn: addressInputs.houseRoadBn || "",
      houseRoadEn: addressInputs.houseRoadEn || "",
      ward: ward?.id ?? "-1",
      wardName: ward?.nameBn ?? "",
    };
  };

  const handleApply = () => {
    const address = buildAddress();
    if (address) {
      onApply(address);
      onClose();
    }
  };

  // Reset form when modal opens with initial values
  useEffect(() => {
    if (isOpen && initial) {
      setSelected({
        country: initial?.country || "-1",
        division: initial?.division || "-1",
        district: initial?.district || "-1",
        upazila: initial?.cityCorpCantOrUpazila || "-1",
        union: initial?.paurasavaOrUnion || "-1",
        ward: initial?.ward || "-1",
      });

      setAddressInputs({
        postOfc: initial?.postOfc || "",
        postOfcEn: initial?.postOfcEn || "",
        vilAreaTownBn: initial?.vilAreaTownBn || "",
        vilAreaTownEn: initial?.vilAreaTownEn || "",
        houseRoadBn: initial?.houseRoadBn || "",
        houseRoadEn: initial?.houseRoadEn || "",
      });

      // Load initial data if country is Bangladesh
      if (initial.country === "1") {
        loadGeo("division", "1", "0", "0");
      }
    }
  }, [isOpen, initial]);

  const renderSelect = (
    id: string,
    label: string,
    value: string,
    list: GeoLocation[],
    isLoading: boolean,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    ref?: React.RefObject<HTMLSelectElement>,
    includeMeta = true
  ) => (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block font-medium text-gray-700 dark:text-gray-300"
      >
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        id={id}
        ref={ref}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        disabled={isLoading}
      >
        <option value="-1">-- নির্বাচন করুন --</option>
        {list.map((item, index) => {
          if (!includeMeta) {
            return (
              <option key={`${id}-${item.id}-${index}`} value={item.id}>
                {item.nameBn}
              </option>
            );
          }

          const nextOrder = item.targetGeoOrder?.toString() ?? "";
          const nextType = item.geoLevelId?.toString() ?? "";
          const currentType = item.geoLevelId?.toString() ?? "";

          return (
            <option
              key={`${id}-${item.id}-${index}`}
              value={item.id}
              data-next-order={nextOrder}
              data-next-type={nextType}
              data-current-type={currentType}
            >
              {item.nameBn}
            </option>
          );
        })}
      </select>
      {isLoading && (
        <p className="text-sm text-blue-600 dark:text-blue-400">লোড হচ্ছে...</p>
      )}
    </div>
  );

  const renderAddressInputs = () => (
    <div className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
        অতিরিক্ত ঠিকানা তথ্য
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            ডাকঘর (বাংলায়)
          </label>
          <input
            type="text"
            value={addressInputs.postOfc}
            onChange={(e) =>
              handleAddressInputChange("postOfc", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="ডাকঘরের নাম বাংলায়"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            ডাকঘর (ইংরেজিতে)
          </label>
          <input
            type="text"
            value={addressInputs.postOfcEn}
            onChange={(e) =>
              handleAddressInputChange("postOfcEn", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Post Office Name in English"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            গ্রাম / পাড়া / মহল্লা{" "}
            {selected.country !== "1" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <textarea
            value={addressInputs.vilAreaTownBn}
            onChange={(e) =>
              handleAddressInputChange("vilAreaTownBn", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="গ্রাম/পাড়া/মহল্লার নাম বাংলায়"
            rows={3}
            required={selected.country !== "1"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            গ্রাম / পাড়া / মহল্লা (ইংরেজি){" "}
            {selected.country !== "1" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <textarea
            value={addressInputs.vilAreaTownEn}
            onChange={(e) =>
              handleAddressInputChange("vilAreaTownEn", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Village/Area/Town in English"
            rows={3}
            required={selected.country !== "1"}
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            বাসা ও সড়ক (নাম, নম্বর)
          </label>
          <textarea
            value={addressInputs.houseRoadBn}
            onChange={(e) =>
              handleAddressInputChange("houseRoadBn", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="বাসা ও সড়কের বিবরণ বাংলায়"
            rows={3}
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            বাসা ও সড়ক (নাম, নম্বর) (ইংরেজি)
          </label>
          <textarea
            value={addressInputs.houseRoadEn}
            onChange={(e) =>
              handleAddressInputChange("houseRoadEn", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="House and Road details in English"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  const countries = isBdMission ? countriesList : countriesListb;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {renderSelect(
            "country",
            "দেশ",
            selected.country,
            countries,
            false,
            handleCountry,
            refs.country as React.RefObject<HTMLSelectElement>,
            false
          )}

          {selected.country === "1" && (
            <>
              {renderSelect(
                "division",
                "বিভাগ",
                selected.division,
                options.division,
                loading.division,
                handleDivision,
                refs.division as React.RefObject<HTMLSelectElement>
              )}

              {selected.division &&
                selected.division !== "-1" &&
                renderSelect(
                  "district",
                  "জেলা",
                  selected.district,
                  options.district,
                  loading.district,
                  handleDistrict,
                  refs.district as React.RefObject<HTMLSelectElement>
                )}

              {selected.district &&
                selected.district !== "-1" &&
                renderSelect(
                  "upazila",
                  "উপজেলা/সিটি কর্পোরেশন",
                  selected.upazila,
                  options.upazila,
                  loading.upazila,
                  handleUpazila,
                  refs.upazila as React.RefObject<HTMLSelectElement>
                )}

              {selected.upazila && selected.upazila !== "-1" && (
                <>
                  <label className="block font-medium text-gray-700 dark:text-gray-300">
                    ইউনিয়ন / পৌরসভা / ক্যান্টনমেন্ট{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="union"
                    ref={refs.union}
                    value={selected.union}
                    onChange={handleUnion}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading.union}
                  >
                    <option value="-1">-- নির্বাচন করুন --</option>
                    {options.union.map((location, index) => {
                      const nextOrder = "4";
                      let nextType = "5";
                      let currentType = "3";

                      if (location.geoLevelId === 8) {
                        nextType = "9";
                        currentType = "8";
                      } else if (location.geoLevelId === 7) {
                        nextType = "6";
                        currentType = "7";
                      }

                      return (
                        <option
                          key={`union-${location.id}-${index}`}
                          value={location.id}
                          data-next-order={nextOrder}
                          data-next-type={nextType}
                          data-current-type={currentType}
                        >
                          {location.nameBn}
                        </option>
                      );
                    })}
                  </select>
                  {loading.union && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      লোড হচ্ছে...
                    </p>
                  )}
                </>
              )}

              {showWardSection &&
                selected.union &&
                selected.union !== "-1" &&
                renderSelect(
                  "ward",
                  wardLabel,
                  selected.ward,
                  options.ward,
                  loading.ward,
                  handleWard,
                  refs.ward as React.RefObject<HTMLSelectElement>,
                  false
                )}
            </>
          )}

          {(selected.country === "1" ||
            (selected.country &&
              selected.country !== "1" &&
              selected.country !== "-1")) &&
            renderAddressInputs()}
        </div>

        <div className="p-6 border-t dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            প্রয়োগ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

// Updated BDRISGeoSelector with Modal
const BDRISGeoSelector: React.FC<GeoSelectorProps> = ({
  onApply,
  initial,
  label = "ঠিকানা",
  required = true,
  validateOnNext = false,
  buttonText = "ঠিকানা নির্বাচন করুন",
  isBdMission,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [hasValidAddress, setHasValidAddress] = useState(false);

  const handleApply = (address: Address) => {
    setSelectedAddress(address);
    onApply(address);
    setHasValidAddress(true);
  };

  const getAddressSummary = () => {
    if (!selectedAddress) return null;

    if (selectedAddress.country === "1") {
      // Bangladesh address
      const parts = [
        selectedAddress.vilAreaTownBn,
        selectedAddress.unionName,
        selectedAddress.upazilaName,
        selectedAddress.districtName,
        selectedAddress.divisionName,
      ].filter(Boolean);

      return parts.join(", ");
    } else {
      // Foreign address
      const country = countriesList.find(
        (c) => c.id === selectedAddress.country
      );
      return `${selectedAddress.vilAreaTownBn}, ${country?.nameBn || "বিদেশ"}`;
    }
  };

  // Only validate and apply when validateOnNext is true and we need to validate
  useEffect(() => {
    if (validateOnNext && !hasValidAddress) {
      toast.error("দয়া করে ঠিকানা নির্বাচন করুন");
    }
  }, [validateOnNext, hasValidAddress]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-gray-800 dark:text-gray-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hasValidAddress && (
          <span className="text-green-600 dark:text-green-400 text-sm">
            ✓ ঠিকানা নির্বাচন করা হয়েছে
          </span>
        )}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col items-center justify-center"
        >
          <svg
            className="w-6 h-6 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span className="font-medium">{buttonText}</span>
        </button>

        {selectedAddress && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
              নির্বাচিত ঠিকানা:
            </h4>
            <p className="text-green-700 dark:text-green-300 text-sm">
              {getAddressSummary()}
            </p>
            {selectedAddress.houseRoadBn && (
              <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                বাসা/সড়ক: {selectedAddress.houseRoadBn}
              </p>
            )}
            {selectedAddress.postOfc && (
              <p className="text-green-600 dark:text-green-400 text-sm">
                ডাকঘর: {selectedAddress.postOfc}
              </p>
            )}
          </div>
        )}
      </div>

      <AddressSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApply}
        initial={selectedAddress || initial}
        title={label}
        isBdMission={isBdMission}
      />
    </div>
  );
};

// Main Form Data Interface
interface PersonInfo {
  personFirstNameBn: string;
  personLastNameBn: string;
  personNameBn: string;
  personFirstNameEn: string;
  personLastNameEn: string;
  personNameEn: string;
  personBirthDate: string; // DD/MM/YYYY format
  thChild: string;
  gender: string;
  religion: string;
  religionOther: string;
  personNid: string;
}

interface ParentInfo {
  id: string;
  ubrn: string;
  personBirthDate: string; // DD/MM/YYYY format
  personNameBn: string;
  personNameEn: string;
  personNid: string;
  passportNumber: string;
  personNationality: string;
}

interface ApplicantInfo {
  name: string;
  nid: string;
  phone: string;
  email: string;
  relation: string;
  otp: string;
}

interface FormData {
  officeAddressType: "BIRTHPLACE" | "PERMANENT" | "MISSION" | "";
  officeAddrCountry: string;
  officeAddrCity: string;
  officeAddrDivision: string;
  officeAddrDistrict: string;
  officeAddrUpazila: string;
  officeAddrUnion: string;
  officeAddrWard: string;
  officeAddrOffice: string;
  officeId: string;

  personInfoForBirth: PersonInfo;

  birthPlaceAddress: Address | null;

  father: ParentInfo;

  mother: ParentInfo;

  copyBirthPlaceToPermAddr: boolean;
  permAddrAddress: Address | null;

  copyPermAddrToPrsntAddr: boolean; // NEW: স্থায়ী ঠিকানা ও বর্তমান ঠিকানা একই
  prsntAddrAddress: Address | null; // NEW: বর্তমান ঠিকানা

  applicant: ApplicantInfo;
}

interface BirthRegistrationFormProps {
  csrf: string;
  cookieString: string;
}

// File upload state for drag and drop
interface UploadingFile {
  file: File;
  fileTypeId: string;
  progress: number;
  isUploading: boolean;
}

// File type interface
interface FileType {
  id: string;
  name: string;
}

// Uploaded file interface
interface UploadedFile {
  id: string;
  name: string;
  url: string;
  attachmentTypeId: string;
  fileType?: string;
  size: number;
  uploadedId?: string;
  isUploading?: boolean;
  progress?: number;
  deleteUrl?: string;
  fileTypeId?: string;
  fileCategory?: string;
}

// Type-safe nested object update helpers
type NestedFormSection = PersonInfo | ParentInfo | ApplicantInfo;

const isPersonInfo = (obj: NestedFormSection): obj is PersonInfo => {
  return "personFirstNameBn" in obj && "personLastNameBn" in obj;
};

const isParentInfo = (obj: NestedFormSection): obj is ParentInfo => {
  return "personNameBn" in obj && "personNationality" in obj && "ubrn" in obj;
};

const isApplicantInfo = (obj: NestedFormSection): obj is ApplicantInfo => {
  return "name" in obj && "phone" in obj && "relation" in obj;
};

// Helper function to safely set nested object properties
const setNestedValue = <T extends NestedFormSection>(
  obj: T,
  field: keyof T,
  value: string
): T => {
  return {
    ...obj,
    [field]: value,
  };
};

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(?:\+88|01)?\d{9,11}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

const validateNID = (nid: string): boolean => {
  const nidRegex = /^\d{10,17}$/;
  return nidRegex.test(nid.replace(/\s/g, ""));
};

const validatePassport = (passport: string): boolean => {
  const passportRegex = /^[A-Z0-9]{6,9}$/;
  return passportRegex.test(passport);
};

// Main Birth Registration Form Component
export default function BirthRegistrationForm() {
  const [sessionData, setSessionData] = useState({
    cookies: [],
    csrf: "",
    serviceCost: 0,
  });
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    officeAddressType: "",
    officeAddrCountry: "",
    officeAddrCity: "",
    officeAddrDivision: "",
    officeAddrDistrict: "",
    officeAddrUpazila: "",
    officeAddrUnion: "",
    officeAddrWard: "",
    officeAddrOffice: "",
    officeId: "",
    personInfoForBirth: {
      personFirstNameBn: "",
      personLastNameBn: "",
      personNameBn: "",
      personFirstNameEn: "",
      personLastNameEn: "",
      personNameEn: "",
      personBirthDate: "",
      thChild: "",
      gender: "",
      religion: "NOT_APPLICABLE",
      religionOther: "",
      personNid: "",
    },
    birthPlaceAddress: null,
    father: {
      id: "",
      ubrn: "",
      personBirthDate: "",
      personNameBn: "",
      personNameEn: "",
      personNid: "",
      passportNumber: "",
      personNationality: "",
    },
    mother: {
      id: "",
      ubrn: "",
      personBirthDate: "",
      personNameBn: "",
      personNameEn: "",
      personNid: "",
      passportNumber: "",
      personNationality: "",
    },
    copyBirthPlaceToPermAddr: false,
    permAddrAddress: null,
    copyPermAddrToPrsntAddr: false, // NEW
    prsntAddrAddress: null, // NEW
    applicant: {
      name: "",
      nid: "",
      phone: "",
      email: "",
      relation: "",
      otp: "",
    },
  });

  const [bdMissionChecked, setBdMissionChecked] = useState(false);
  const [age, setAge] = useState<{
    years: number;
    months: number;
    days: number;
  }>({ years: 0, months: 0, days: 0 });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation triggers for geo selectors
  const [validateBirthPlace, setValidateBirthPlace] = useState(false);
  const [validatePermAddress, setValidatePermAddress] = useState(false);
  const [validatePrsntAddress, setValidatePrsntAddress] = useState(false); // NEW

  // BD Mission Office Selection States
  const [officeCities, setOfficeCities] = useState<GeoLocation[]>([]);
  const [officeOptions, setOfficeOptions] = useState<GeoLocation[]>([]);
  const [loadingOfficeCities, setLoadingOfficeCities] = useState(false);
  const [loadingOfficeOptions, setLoadingOfficeOptions] = useState(false);
  const [countryTargetGeoOrder, setCountryTargetGeoOrder] = useState<number>(9); // Default to 9

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // OTP State
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Parent validation cache
  const [parentValidationCache, setParentValidationCache] = useState<Record<string, boolean>>({});

  // File Types - only 40 and 41 are required
  const fileTypes: FileType[] = [
    {
      id: "40",
      name: "চিকিৎসক কর্তৃক প্রত্যায়ন পত্র (বাংলাদেশ মেডিক্যাল এন্ড ডেন্টাল কাউন্সিল কর্তৃক স্বীকৃত এমবিবিএস বা তদূর্ধ্ব ডিগ্রিধারী) বা সরকার কর্তৃক পরিচালিত প্রথমিক শিক্ষা সমাপনী, জুনিয়র স্কুল সার্টিফিকেট এবং শিক্ষা বোর্ড কর্তৃক পরিচালিত মাধ্যমিক স্কুল সার্টিফিকেট ",
    },
    {
      id: "41",
      name: "পিতা / মাতা/ পিতামহ / পিতামহীর দ্বারা স্বনামে স্থায়ী ঠিকানা হিসেবে ঘোষিত আবাস স্থলের বিপরীতে হালনাগাদ কর পরিশোধের প্রমানপত্র বা পিতা / মাতা/ পিতামহ / পিতামহীর জাতীয় পরিচয়পত্র বা পাসপোর্ট ঘোষিত স্থায়ী ঠিকানা বা জমি অথবা বাড়ি ক্রয়ের দলিল , খাজনা ও কর পরিশোধ রশিদ। (নদীভাঙ্গন অন্য কোন কারনে স্থায়ী ঠিকানা বিলুপ্ত হলে)",
    },
  ];

  // Countdown timer effect - FIXED
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (otpCountdown > 0) {
      intervalId = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            if (intervalId) clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [otpCountdown]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | Address | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedInputChange = (
    section: keyof Pick<
      FormData,
      "personInfoForBirth" | "father" | "mother" | "applicant"
    >,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const currentSection = prev[section];

      // Type-safe update based on section type
      if (section === "personInfoForBirth" && isPersonInfo(currentSection)) {
        return {
          ...prev,
          [section]: setNestedValue(
            currentSection,
            field as keyof PersonInfo,
            value
          ),
        };
      } else if (
        (section === "father" || section === "mother") &&
        isParentInfo(currentSection)
      ) {
        return {
          ...prev,
          [section]: setNestedValue(
            currentSection,
            field as keyof ParentInfo,
            value
          ),
        };
      } else if (section === "applicant" && isApplicantInfo(currentSection)) {
        return {
          ...prev,
          [section]: setNestedValue(
            currentSection,
            field as keyof ApplicantInfo,
            value
          ),
        };
      }

      return prev;
    });

    // Clear error when field is updated
    const errorKey = `${section}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleBirthPlaceAddress = (address: Address) => {
    setFormData((prev) => ({
      ...prev,
      birthPlaceAddress: address,
    }));
    setValidateBirthPlace(false);
  };

  const handlePermAddrAddress = (address: Address) => {
    setFormData((prev) => ({
      ...prev,
      permAddrAddress: address,
    }));
    setValidatePermAddress(false);
  };

  const handlePrsntAddrAddress = (address: Address) => {
    setFormData((prev) => ({
      ...prev,
      prsntAddrAddress: address,
    }));
    setValidatePrsntAddress(false);
  };

  const handleBirthDateChange = (birthDate: string) => {
    handleNestedInputChange("personInfoForBirth", "personBirthDate", birthDate);
    const newAge = calculateAgeFromDDMMYYYY(birthDate);
    setAge(newAge);
  };

  const fetchSession = async () => {
    toast.loading("Loading session data...", { id: "sessionReload" });
    try {
      const response = await fetch("/api/birth/application/registration");
      const data = await response.json();
      setSessionData(data);
      toast.success("Session data loaded successfully", {
        id: "sessionReload",
      });
    } catch (error) {
      console.error("Error fetching session data:", error);
      toast.error("Failed to load session data", { id: "sessionReload" });
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Auto-populate applicant when moving to step 5
  useEffect(() => {
    if (currentStep === 5) {
      if (age.years < 18) {
        // For babies under 18: use father as applicant
        setFormData((prev) => ({
          ...prev,
          applicant: {
            ...prev.applicant,
            name: prev.father.personNameBn,
            relation: "FATHER",
            nid: prev.father.personNid || "",
            phone: prev.applicant.phone || "",
            email: prev.applicant.email || "",
            otp: prev.applicant.otp || "",
          },
        }));
      } else {
        // For adults 18+: use self as applicant
        const fullNameBn =
          `${formData.personInfoForBirth.personFirstNameBn} ${formData.personInfoForBirth.personLastNameBn}`.trim();

        setFormData((prev) => ({
          ...prev,
          applicant: {
            ...prev.applicant,
            name: fullNameBn,
            relation: "SELF",
            nid: prev.personInfoForBirth.personNid || "",
            phone: prev.applicant.phone || "",
            email: prev.applicant.email || "",
            otp: prev.applicant.otp || "",
          },
        }));
      }
    }
  }, [currentStep, age.years]);

  // BD Mission Office Selection Handlers - UPDATED with dynamic targetGeoOrder
  const handleOfficeCountryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const countryId = e.target.value;
    handleInputChange("officeAddrCountry", countryId);

    // Reset city and office when country changes
    handleInputChange("officeAddrCity", "");
    handleInputChange("officeAddrOffice", "");
    setOfficeCities([]);
    setOfficeOptions([]);

    if (!countryId) return;

    // Load cities for selected country
    setLoadingOfficeCities(true);
    try {
      const response = await fetch("/api/officeAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: countryId,
          geoOrder: "0",
          geoType: "10",
          csrf: sessionData.csrf,
          cookie: sessionData.cookies,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OfficeGeoResponse = await response.json();
      console.log("Country API Response:", data);

      // Store the targetGeoOrder from country response for later use
      if (data.targetGeoOrder) {
        setCountryTargetGeoOrder(data.targetGeoOrder);
      }

      let cities: GeoLocation[] = [];

      if (data.geoObject) {
        if (Array.isArray(data.geoObject)) {
          cities = data.geoObject;
        } else {
          // If it's a single object, convert to array
          cities = [data.geoObject];
        }
      }

      const formattedCities = cities.map((city) => ({
        ...city,
        id: city.id.toString(),
        nameBn: (city.nameBn || "").replace(/</g, "&lt;"),
        nameEn: (city.nameEn || "").replace(/</g, "&lt;"),
      }));

      console.log("Formatted Cities:", formattedCities);
      setOfficeCities(formattedCities);

      if (formattedCities.length === 0) {
        toast.error("এই দেশের জন্য কোন শহর পাওয়া যায়নি");
      }
    } catch (error) {
      console.error("Error loading office cities:", error);
      toast.error("শহর লোড করতে সমস্যা হয়েছে");
      setOfficeCities([]);
    } finally {
      setLoadingOfficeCities(false);
    }
  };

  const handleOfficeCityChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const cityId = e.target.value;
    handleInputChange("officeAddrCity", cityId);

    // Reset office when city changes
    handleInputChange("officeAddrOffice", "");
    setOfficeOptions([]);

    if (!cityId) return;

    // Find selected city to get geoLevelId
    const selectedCity = officeCities.find((city) => city.id === cityId);
    if (!selectedCity) {
      console.error("Selected city not found:", cityId);
      return;
    }

    console.log("Selected City:", selectedCity);

    // Load offices for selected city using dynamic targetGeoOrder from country response
    setLoadingOfficeOptions(true);
    try {
      const response = await fetch("/api/officeAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: cityId,
          geoOrder: countryTargetGeoOrder.toString(), // Use dynamic targetGeoOrder from country response
          geoType: selectedCity.geoLevelId?.toString() || "11", // Use city's geoLevelId
          csrf: sessionData.csrf,
          cookie: sessionData.cookies,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OfficeGeoResponse = await response.json();
      console.log("City API Response:", data);

      let offices: GeoLocation[] = [];

      if (data.geoObject) {
        if (Array.isArray(data.geoObject)) {
          offices = data.geoObject;
        } else {
          // If it's a single object, convert to array
          offices = [data.geoObject];
        }
      }

      const formattedOffices = offices.map((office) => ({
        ...office,
        id: office.id.toString(),
        nameBn: office.officeNameBn || office.nameBn || "",
        nameEn: office.officeNameEn || office.nameEn || "",
      }));

      console.log("Formatted Offices:", formattedOffices);
      setOfficeOptions(formattedOffices);

      // Auto-select the office if there's only one option
      if (formattedOffices.length === 1) {
        handleInputChange("officeAddrOffice", formattedOffices[0].id);
        toast.success("অফিস স্বয়ংক্রিয়ভাবে নির্বাচিত হয়েছে");
      }

      if (formattedOffices.length === 0) {
        toast.error("এই শহরের জন্য কোন অফিস পাওয়া যায়নি");
      }
    } catch (error) {
      console.error("Error loading office options:", error);
      toast.error("অফিস লোড করতে সমস্যা হয়েছে");
      setOfficeOptions([]);
    } finally {
      setLoadingOfficeOptions(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFilesSelection(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelection(files);
  };

  const handleFilesSelection = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isValidType = ["image/jpeg", "image/jpg", "image/png"].includes(
        file.type
      );
      const isValidSize = file.size <= 2 * 1024 * 1024; // 2MB

      if (!isValidType) {
        toast.error(`${file.name}: শুধুমাত্র JPG, PNG ফাইল গ্রহণযোগ্য`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name}: ফাইলের আকার 2MB এর কম হতে হবে`);
        return false;
      }
      return true;
    });

    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      file,
      fileTypeId: "-1",
      progress: 0,
      isUploading: false,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
  };

  const updateUploadingFileType = (index: number, fileTypeId: string) => {
    setUploadingFiles((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, fileTypeId } : item))
    );
  };

  // Fixed file upload function matching the provided example
  const uploadFile = async (file: File, typeId: string) => {
    const formData = new FormData();
    formData.append("attachmentType", typeId);
    formData.append("attachmentSubType", "-1");
    formData.append("files", file, file.name);
    formData.append("csrf", sessionData.csrf);
    formData.append("cookies", JSON.stringify(sessionData.cookies));

    const loadingToast = toast.loading(`ফাইল আপলোড হচ্ছে: ${file.name}`);

    try {
      const res = await fetch(
        "/api/birth/application/registration/upload_doc",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const responseData = await res.json();

      toast.dismiss(loadingToast);
      toast.success(`ফাইল আপলোড সফল: ${file.name}`);

      return {
        id: responseData.data[0]?.id || `file-${Date.now()}`,
        name: file.name,
        url: responseData.data[0]?.url || URL.createObjectURL(file),
        deleteUrl: responseData.data[0]?.deleteUrl || "",
        attachmentTypeId: typeId,
        fileType: fileTypes.find((t) => t.id === typeId)?.name,
        size: file.size,
        uploadedId: responseData.data[0]?.id || `uploaded-${Date.now()}`,
      };
    } catch (error) {
      toast.dismiss(loadingToast);
      const errMsg =
        error instanceof Error ? error.message : "অনুসন্ধান ব্যর্থ";
      toast.error(`ফাইল আপলোড ব্যর্থ: ${errMsg}`);
      throw error;
    }
  };

  const handleFileUpload = async (index: number) => {
    const uploadingFile = uploadingFiles[index];
    if (!uploadingFile || uploadingFile.fileTypeId === "-1") {
      toast.error("দয়া করে ফাইল টাইপ নির্বাচন করুন");
      return;
    }

    // Check if this file type is already uploaded
    const alreadyUploadedFileType = uploadedFiles.find(
      (file) => file.attachmentTypeId === uploadingFile.fileTypeId
    );

    if (alreadyUploadedFileType) {
      toast.error(
        `এই ফাইল টাইপ (${
          fileTypes.find((t) => t.id === uploadingFile.fileTypeId)?.name
        }) ইতিমধ্যে আপলোড করা হয়েছে`
      );
      return;
    }

    // Check if we have both required file types (40 and 41)
    const uploadedFileTypeIds = uploadedFiles.map((f) => f.attachmentTypeId);

    if (uploadedFileTypeIds.length >= 2) {
      toast.error(
        "আপনি সর্বোচ্চ ২টি ফাইল আপলোড করতে পারেন (ফাইল টাইপ ৪০ এবং ৪১)"
      );
      return;
    }

    // Update uploading state
    setUploadingFiles((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, isUploading: true, progress: 0 } : item
      )
    );

    try {
      // Update progress (simulated)
      setUploadingFiles((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, progress: 30 } : item
        )
      );

      // Upload file using the fixed uploadFile function
      const uploadedFile = await uploadFile(
        uploadingFile.file,
        uploadingFile.fileTypeId
      );

      // Update progress to complete
      setUploadingFiles((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, progress: 100 } : item
        )
      );

      // Add to uploaded files
      setUploadedFiles((prev) => [...prev, uploadedFile]);

      // Remove from uploading files after a short delay to show completion
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((_, idx) => idx !== index));
      }, 500);

      // Check if both required files are uploaded
      const newUploadedFileTypeIds = [
        ...uploadedFileTypeIds,
        uploadingFile.fileTypeId,
      ];
      const allRequiredTypesUploaded = ["40", "41"].every((id) =>
        newUploadedFileTypeIds.includes(id)
      );

      if (allRequiredTypesUploaded) {
        toast.success("সকল প্রয়োজনীয় ফাইল সফলভাবে আপলোড হয়েছে!");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("ফাইল আপলোড ব্যর্থ হয়েছে");
      setUploadingFiles((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, isUploading: false, progress: 0 } : item
        )
      );
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeUploadedFile = async (id: string) => {
    const fileToRemove = uploadedFiles.find((file) => file.id === id);

    if (fileToRemove?.deleteUrl) {
      try {
        // Send delete request if deleteUrl exists
        await fetch(fileToRemove.deleteUrl, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error deleting file from server:", error);
      }
    }

    // Remove from local state
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  // OTP Functions - FIXED with proper countdown
  const sendOTP = async () => {
    try {
      // Check if required personal information is available
      if (
        !formData.personInfoForBirth.personFirstNameBn ||
        !formData.personInfoForBirth.personLastNameBn
      ) {
        toast.error("প্রথমে ব্যক্তির তথ্য পূরণ করুন");
        return;
      }

      // Validate mobile number format
      const validateMobile = (mobile: string) => {
        const regex = /^01[0-9]{9}$/; // total 11 digits starting with 01
        return regex.test(mobile);
      };

      if (!formData.applicant.phone) {
        toast.error("মোবাইল নম্বর পূরণ করুন");
        return;
      }

      if (!validateMobile(formData.applicant.phone)) {
        toast.error(
          "মোবাইল নম্বর সঠিকভাবে পূরণ করুন (01 দিয়ে শুরু করে 11 সংখ্যা)"
        );
        return;
      }

      // Check if OTP was already sent and countdown is active
      if (isOtpSent && otpCountdown > 0) {
        toast.error(
          `আপনি ${formatTime(otpCountdown)} পরে আবার OTP পাঠাতে পারবেন`
        );
        return;
      }
      toast.loading("OTP পাঠানো হচ্ছে...", { id: "otp" });
      // Send OTP request
      const response = await fetch("/api/birth/application/registration/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: `+88${formData.applicant.phone}`,
          personName: `${formData.personInfoForBirth.personFirstNameBn} ${formData.personInfoForBirth.personLastNameBn}`,
          relation: formData.applicant.relation,
          email: formData.applicant.email || "",
          csrf: sessionData.csrf,
          cookies: sessionData.cookies,
          officeAddressType: formData.officeAddressType,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        // Start 10-minute countdown (600 seconds) - FIXED: This now triggers the useEffect
        setOtpCountdown(600);
        setIsOtpSent(true);

        toast.success("OTP সফলভাবে পাঠানো হয়েছে", { id: "otp" });
      } else {
        toast.error(resData.error?.message || "OTP পাঠাতে সমস্যা হয়েছে", {
          id: "otp",
        });
      }
    } catch (error) {
      console.error("OTP sending error:", error);
      toast.error("OTP পাঠাতে সমস্যা হয়েছে");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Parent check async function
  const ParentCheck = async ({
    ubrn,
    dob,
    nameEn,
    childBirthDate,
    gender,
  }: {
    ubrn: string;
    dob: string;
    nameEn: string;
    childBirthDate: string;
    gender: string;
  }): Promise<boolean> => {
    if (!ubrn.trim()) return false;

    // Create cache key
    const cacheKey = `${ubrn}-${dob}-${nameEn}-${childBirthDate}-${gender}`;
    
    // Check cache first
    if (parentValidationCache[cacheKey] !== undefined) {
      return parentValidationCache[cacheKey];
    }

    try {
      const data = {
        ubrn,
        dob,
        nameEn,
        childBirthDate,
        gender,
        csrf: sessionData.csrf,
        cookies: sessionData.cookies,
      };
      
      const response = await fetch(
        "/api/birth/application/registration/parent-info",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();

      if (!result.success) {
        return false;
      }
      const isValid = result.success || false;
      
      // Update cache
      setParentValidationCache(prev => ({
        ...prev,
        [cacheKey]: isValid
      }));
      
      return isValid;
    } catch (error) {
      console.error("Parent check error:", error);
      setParentValidationCache(prev => ({
        ...prev,
        [cacheKey]: false
      }));
      return false;
    }
  };

  // Comprehensive validation function for each step - FIXED
  const validateStep = async (step: number): Promise<boolean> => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.officeAddressType) {
          errors.officeAddressType = "অফিসের ধরন নির্বাচন করুন";
        }

        if (formData.officeAddressType === "MISSION") {
          if (!formData.officeAddrCountry) {
            errors.officeAddrCountry = "দেশ নির্বাচন করুন";
          }
          if (!formData.officeAddrCity) {
            errors.officeAddrCity = "শহর নির্বাচন করুন";
          }
          if (!formData.officeAddrOffice) {
            errors.officeAddrOffice = "অফিস নির্বাচন করুন";
          }
        }
        break;

      case 2:
        // Personal information validation
        if (!formData.personInfoForBirth.personFirstNameBn.trim()) {
          errors["personInfoForBirth.personFirstNameBn"] =
            "নামের প্রথম অংশ বাংলায় প্রয়োজন";
        }
        if (!formData.personInfoForBirth.personLastNameBn.trim()) {
          errors["personInfoForBirth.personLastNameBn"] =
            "নামের শেষ অংশ বাংলায় প্রয়োজন";
        }
        if (!formData.personInfoForBirth.personFirstNameEn.trim()) {
          errors["personInfoForBirth.personFirstNameEn"] =
            "নামের প্রথম অংশ ইংরেজিতে প্রয়োজন";
        }
        if (!formData.personInfoForBirth.personLastNameEn.trim()) {
          errors["personInfoForBirth.personLastNameEn"] =
            "নামের শেষ অংশ ইংরেজিতে প্রয়োজন";
        }
        if (!formData.personInfoForBirth.personBirthDate) {
          errors["personInfoForBirth.personBirthDate"] = "জন্ম তারিখ প্রয়োজন";
        } else {
          const { valid } = parseDateString(
            formData.personInfoForBirth.personBirthDate
          );
          if (!valid) {
            errors["personInfoForBirth.personBirthDate"] =
              "বৈধ তারিখ দিন (DD/MM/YYYY)";
          }
        }
        if (!formData.personInfoForBirth.thChild) {
          errors["personInfoForBirth.thChild"] =
            "পিতা-মাতার কততম সন্তান নির্বাচন করুন";
        }
        if (!formData.personInfoForBirth.gender) {
          errors["personInfoForBirth.gender"] = "লিঙ্গ নির্বাচন করুন";
        }

        // Optional NID validation only if provided and age is 18+
        if (
          age.years >= 18 &&
          formData.personInfoForBirth.personNid &&
          !validateNID(formData.personInfoForBirth.personNid)
        ) {
          errors["personInfoForBirth.personNid"] =
            "বৈধ জাতীয় পরিচয়পত্র নম্বর দিন";
        }

        // Birth place address validation
        if (!formData.birthPlaceAddress) {
          errors.birthPlaceAddress = "জন্মস্থানের ঠিকানা নির্বাচন করুন";
        }
        break;

      case 3:
        // Father information validation
        if (!formData.father.personNameBn.trim()) {
          errors["father.personNameBn"] = "পিতার নাম বাংলায় প্রয়োজন";
        }
        if (!formData.father.personNameEn.trim()) {
          errors["father.personNameEn"] = "পিতার নাম ইংরেজিতে প্রয়োজন";
        }
        if (!formData.father.personNationality) {
          errors["father.personNationality"] = "পিতার জাতীয়তা নির্বাচন করুন";
        }

        // Mother information validation
        if (!formData.mother.personNameBn.trim()) {
          errors["mother.personNameBn"] = "মাতার নাম বাংলায় প্রয়োজন";
        }
        if (!formData.mother.personNameEn.trim()) {
          errors["mother.personNameEn"] = "মাতার নাম ইংরেজিতে প্রয়োজন";
        }
        if (!formData.mother.personNationality) {
          errors["mother.personNationality"] = "মাতার জাতীয়তা নির্বাচন করুন";
        }

        // Only validate parent birth registration and dates if person's birth year is 2012 or later
        const birthYear = parseDateString(
          formData.personInfoForBirth.personBirthDate
        ).year;

        if (birthYear >= 2012) {
          // Father birth registration validation for 2012 and later
          if (!formData.father.ubrn.trim()) {
            errors["father.ubrn"] = "পিতার জন্ম নিবন্ধন নম্বর প্রয়োজন";
          } else {
            // Validate father's UBRN asynchronously
            try {
              toast.loading('পিতার জন্ম নিবন্ধন নম্বর যাচাই ...',{id:'father'})
              const isValid = await ParentCheck({
                ubrn: formData.father.ubrn,
                dob: formData.father.personBirthDate,
                nameEn: formData.father.personNameEn,
                childBirthDate: formData.personInfoForBirth.personBirthDate,
                gender: "MALE",
              });
              
              if (!isValid) {
                toast.error('পিতার জন্ম নিবন্ধন নম্বর যাচাইয়ে সমস্যা হয়েছে', {id:'father'})
                errors["father.ubrn"] = "পিতার জন্ম নিলন্ধন নম্বর বৈধ নয়";
              }
              toast.success('পিতার জন্ম নিবন্ধন নম্বর যাচাইয়ে সফল হয়েছে', {id:'father'})
            } catch (error) {
              console.error("Father validation error:", error);
              errors["father.ubrn"] = "পিতার জন্ম নিবন্ধন নম্বর যাচাইয়ে সমস্যা হয়েছে";
            }
          }
          
          if (!formData.father.personBirthDate) {
            errors["father.personBirthDate"] = "পিতার জন্ম তারিখ প্রয়োজন";
          } else {
            const { valid } = parseDateString(formData.father.personBirthDate);
            if (!valid) {
              errors["father.personBirthDate"] = "বৈধ তারিখ দিন (DD/MM/YYYY)";
            }
          }

          // Mother birth registration validation for 2012 and later
          if (!formData.mother.ubrn.trim()) {
            errors["mother.ubrn"] = "মাতার জন্ম নিবন্ধন নম্বর প্রয়োজন";
          } else {
            // Validate mother's UBRN asynchronously
            try {
              toast.loading('মাতার জন্ম নিবন্ধন নম্বর যাচাই ...',{id:'mother'})
              const isValid = await ParentCheck({
                ubrn: formData.mother.ubrn,
                dob: formData.mother.personBirthDate,
                nameEn: formData.mother.personNameEn,
                childBirthDate: formData.personInfoForBirth.personBirthDate,
                gender: "FEMALE",
              });
              
              if (!isValid) {
                toast.error('মাতার জন্ম নিবন্ধন নম্বর যাচাইয়ে সমস্যা হয়েছে', {id:'mother'})
                errors["mother.ubrn"] = "মাতার জন্ম নিলন্ধন নম্বর বৈধ নয়";
              }
              toast.success('মাতার জন্ম নিবন্ধন নম্বর যাচাইয়ে সফল হয়েছে', {id:'mother'})
            } catch (error) {
              console.error("Mother validation error:", error);
              errors["mother.ubrn"] = "মাতার জন্ম নিলন্ধন নম্বর যাচাইয়ে সমস্যা হয়েছে";
            }
          }
          
          if (!formData.mother.personBirthDate) {
            errors["mother.personBirthDate"] = "মাতার জন্ম তারিখ প্রয়োজন";
          } else {
            const { valid } = parseDateString(formData.mother.personBirthDate);
            if (!valid) {
              errors["mother.personBirthDate"] = "বৈধ তারিখ দিন (DD/MM/YYYY)";
            }
          }
        }

        // Father NID validation (optional for all)
        if (
          formData.father.personNid &&
          !validateNID(formData.father.personNid)
        ) {
          errors["father.personNid"] = "বৈধ জাতীয় পরিচয়পত্র নম্বর দিন";
        }

        // Father passport validation (optional for all)
        if (
          formData.father.passportNumber &&
          !validatePassport(formData.father.passportNumber)
        ) {
          errors["father.passportNumber"] = "বৈধ পাসপোর্ট নম্বর দিন";
        }

        // Mother NID validation (optional for all)
        if (
          formData.mother.personNid &&
          !validateNID(formData.mother.personNid)
        ) {
          errors["mother.personNid"] = "বৈধ জাতীয় পরিচয়পত্র নম্বর দিন";
        }

        // Mother passport validation (optional for all)
        if (
          formData.mother.passportNumber &&
          !validatePassport(formData.mother.passportNumber)
        ) {
          errors["mother.passportNumber"] = "বৈধ পাসপোর্ট নম্বর দিন";
        }
        break;

      case 4:
        // Permanent address validation
        if (!formData.copyBirthPlaceToPermAddr && !formData.permAddrAddress) {
          errors.permAddrAddress = "স্থায়ী ঠিকানা নির্বাচন করুন";
        }

        // Present address validation
        if (!formData.copyPermAddrToPrsntAddr && !formData.prsntAddrAddress) {
          errors.prsntAddrAddress = "বর্তমান ঠিকানা নির্বাচন করুন";
        }

        // File upload validation - require exactly 2 files with IDs 40 and 41
        const uploadedFileTypeIds = uploadedFiles.map(
          (f) => f.attachmentTypeId
        );
        const hasFile40 = uploadedFileTypeIds.includes("40");
        const hasFile41 = uploadedFileTypeIds.includes("41");

        if (uploadedFiles.length !== 2) {
          errors.attachments = "ঠিক ২টি ফাইল আপলোড করুন (ফাইল টাইপ ৪০ এবং ৪১)";
        } else if (!hasFile40 || !hasFile41) {
          errors.attachments = "ফাইল টাইপ ৪০ এবং ৪১ উভয়ই আপলোড করতে হবে";
        }
        break;

      case 5:
        // First ensure applicant is auto-populated
        if (age.years < 18) {
          // For babies under 18: validate father's information is available
          if (!formData.father.personNameBn.trim()) {
            errors["applicant.name"] =
              "পিতার নাম প্রয়োজন (বাচ্চার বয়স ১৮ বছরের কম)";
          }
          // Set relation to FATHER
          setFormData((prev) => ({
            ...prev,
            applicant: {
              ...prev.applicant,
              relation: "FATHER",
            },
          }));
        } else {
          // For adults 18+: validate self information
          const fullNameBn =
            `${formData.personInfoForBirth.personFirstNameBn} ${formData.personInfoForBirth.personLastNameBn}`.trim();
          if (!fullNameBn) {
            errors["applicant.name"] =
              "আপনার নাম প্রয়োজন (আপনার বয়স ১৮ বা তার বেশি)";
          }
          // Set relation to SELF
          setFormData((prev) => ({
            ...prev,
            applicant: {
              ...prev.applicant,
              relation: "SELF",
            },
          }));
        }

        // Applicant information validation
        if (!formData.applicant.name.trim()) {
          errors["applicant.name"] = "আবেদনকারীর নাম প্রয়োজন";
        }
        if (!formData.applicant.phone.trim()) {
          errors["applicant.phone"] = "মোবাইল নম্বর প্রয়োজন";
        } else if (!validatePhone(formData.applicant.phone)) {
          errors["applicant.phone"] = "বৈধ মোবাইল নম্বর দিন";
        }
        if (!formData.applicant.relation) {
          errors["applicant.relation"] = "সম্পর্ক নির্বাচন করুন";
        }

        // Email validation if provided
        if (
          formData.applicant.email &&
          !validateEmail(formData.applicant.email)
        ) {
          errors["applicant.email"] = "বৈধ ইমেইল ঠিকানা দিন";
        }

        // Applicant NID validation if provided
        if (formData.applicant.nid && !validateNID(formData.applicant.nid)) {
          errors["applicant.nid"] = "বৈধ জাতীয় পরিচয়পত্র নম্বর দিন";
        }

        // OTP validation
        if (!formData.applicant.otp) {
          errors.otp = "OTP প্রয়োজন";
        }
        break;
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `[data-field="${firstErrorKey}"]`
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      // Reset validation triggers
      setValidateBirthPlace(false);
      setValidatePermAddress(false);
      setValidatePrsntAddress(false);

      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    // Reset validation triggers
    setValidateBirthPlace(false);
    setValidatePermAddress(false);
    setValidatePrsntAddress(false);

    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateStep(currentStep);
    if (!isValid) {
      return;
    }

    try {
      // Prepare final data according to your API structure
      const submissionData = {
        csrf: sessionData.csrf,
        otp: formData.applicant.otp,
        cookies: sessionData.cookies,
        officeAddressType: formData.officeAddressType,
        officeAddrCountry: formData.officeAddrCountry,
        officeAddrCity: formData.officeAddrCity,
        officeAddrDivision: formData.birthPlaceAddress?.division || "-1",
        officeAddrDistrict: formData.birthPlaceAddress?.district || "-1",
        officeAddrCityCorpCantOrUpazila:
          formData.birthPlaceAddress?.cityCorpCantOrUpazila || "-1",
        officeAddrPaurasavaOrUnion:
          formData.birthPlaceAddress?.paurasavaOrUnion || "-1",
        officeAddrWard: formData.birthPlaceAddress?.ward || "-1",
        officeAddrOffice: formData.officeAddrOffice,

        // Personal Information
        personInfoForBirth: {
          personFirstNameBn: formData.personInfoForBirth.personFirstNameBn,
          personLastNameBn: formData.personInfoForBirth.personLastNameBn,
          personNameBn:
            `${formData.personInfoForBirth.personFirstNameBn} ${formData.personInfoForBirth.personLastNameBn}`.trim(),
          personFirstNameEn: formData.personInfoForBirth.personFirstNameEn,
          personLastNameEn: formData.personInfoForBirth.personLastNameEn,
          personNameEn:
            `${formData.personInfoForBirth.personFirstNameEn} ${formData.personInfoForBirth.personLastNameEn}`.trim(),
          personBirthDate: formData.personInfoForBirth.personBirthDate,
          thChild: formData.personInfoForBirth.thChild,
          gender: formData.personInfoForBirth.gender,
          religion: formData.personInfoForBirth.religion,
          religionOther: formData.personInfoForBirth.religionOther,
          personNid: formData.personInfoForBirth.personNid,
        },

        // Father's information (separate from personInfoForBirth)
        father: {
          personNameBn: formData.father.personNameBn,
          personNameEn: formData.father.personNameEn,
          personNationality: formData.father.personNationality,
          personNid: formData.father.personNid,
          passportNumber: formData.father.passportNumber,
          ubrn: formData.father.ubrn,
          personBirthDate: formData.father.personBirthDate,
        },

        // Mother's information (separate from personInfoForBirth)
        mother: {
          personNameBn: formData.mother.personNameBn,
          personNameEn: formData.mother.personNameEn,
          personNationality: formData.mother.personNationality,
          personNid: formData.mother.personNid,
          passportNumber: formData.mother.passportNumber,
          ubrn: formData.mother.ubrn,
          personBirthDate: formData.mother.personBirthDate,
        },

        // Birth Place Address
        birthPlaceCountry: formData.birthPlaceAddress?.country || "1",
        birthPlaceDiv: formData.birthPlaceAddress?.division || "-1",
        birthPlaceDist: formData.birthPlaceAddress?.district || "-1",
        birthPlaceCityCorpCantOrUpazila:
          formData.birthPlaceAddress?.cityCorpCantOrUpazila || "-1",
        birthPlacePaurasavaOrUnion:
          formData.birthPlaceAddress?.paurasavaOrUnion || "-1",
        birthPlaceWardInPaurasavaOrUnion:
          formData.birthPlaceAddress?.ward || "-1",
        birthPlaceVilAreaTownBn:
          formData.birthPlaceAddress?.vilAreaTownBn || "",
        birthPlaceVilAreaTownEn:
          formData.birthPlaceAddress?.vilAreaTownEn || "",
        birthPlacePostOfc: formData.birthPlaceAddress?.postOfc || "",
        birthPlacePostOfcEn: formData.birthPlaceAddress?.postOfcEn || "",
        birthPlaceHouseRoadBn: formData.birthPlaceAddress?.houseRoadBn || "",
        birthPlaceHouseRoadEn: formData.birthPlaceAddress?.houseRoadEn || "",

        // Permanent Address
        copyBirthPlaceToPermAddr: formData.copyBirthPlaceToPermAddr
          ? "yes"
          : "no",
        permAddrCountry: formData.copyBirthPlaceToPermAddr
          ? formData.birthPlaceAddress?.country
          : formData.permAddrAddress?.country || "1",
        permAddrDiv: formData.copyBirthPlaceToPermAddr
          ? formData.birthPlaceAddress?.division
          : formData.permAddrAddress?.division || "-1",
        permAddrDist: formData.copyBirthPlaceToPermAddr
          ? formData.birthPlaceAddress?.district
          : formData.permAddrAddress?.district || "-1",
        permAddrCityCorpCantOrUpazila: formData.copyBirthPlaceToPermAddr
          ? formData.birthPlaceAddress?.cityCorpCantOrUpazila
          : formData.permAddrAddress?.cityCorpCantOrUpazila || "-1",
        permAddrPaurasavaOrUnion: formData.copyBirthPlaceToPermAddr
          ? formData.birthPlaceAddress?.paurasavaOrUnion
          : formData.permAddrAddress?.paurasavaOrUnion || "-1",
        permAddrWardInPaurasavaOrUnion: formData.copyBirthPlaceToPermAddr
          ? formData.birthPlaceAddress?.ward
          : formData.permAddrAddress?.ward || "-1",

        // Present Address
        copyPermAddrToPrsntAddr: formData.copyPermAddrToPrsntAddr
          ? "yes"
          : "no",
        prsntAddrCountry: formData.copyPermAddrToPrsntAddr
          ? (formData.copyBirthPlaceToPermAddr
              ? formData.birthPlaceAddress?.country
              : formData.permAddrAddress?.country) || "1"
          : formData.prsntAddrAddress?.country || "1",
        prsntAddrDiv: formData.copyPermAddrToPrsntAddr
          ? (formData.copyBirthPlaceToPermAddr
              ? formData.birthPlaceAddress?.division
              : formData.permAddrAddress?.division) || "-1"
          : formData.prsntAddrAddress?.division || "-1",
        prsntAddrDist: formData.copyPermAddrToPrsntAddr
          ? (formData.copyBirthPlaceToPermAddr
              ? formData.birthPlaceAddress?.district
              : formData.permAddrAddress?.district) || "-1"
          : formData.prsntAddrAddress?.district || "-1",
        prsntAddrCityCorpCantOrUpazila: formData.copyPermAddrToPrsntAddr
          ? (formData.copyBirthPlaceToPermAddr
              ? formData.birthPlaceAddress?.cityCorpCantOrUpazila
              : formData.permAddrAddress?.cityCorpCantOrUpazila) || "-1"
          : formData.prsntAddrAddress?.cityCorpCantOrUpazila || "-1",
        prsntAddrPaurasavaOrUnion: formData.copyPermAddrToPrsntAddr
          ? (formData.copyBirthPlaceToPermAddr
              ? formData.birthPlaceAddress?.paurasavaOrUnion
              : formData.permAddrAddress?.paurasavaOrUnion) || "-1"
          : formData.prsntAddrAddress?.paurasavaOrUnion || "-1",
        prsntAddrWardInPaurasavaOrUnion: formData.copyPermAddrToPrsntAddr
          ? (formData.copyBirthPlaceToPermAddr
              ? formData.birthPlaceAddress?.ward
              : formData.permAddrAddress?.ward) || "-1"
          : formData.prsntAddrAddress?.ward || "-1",

        // Applicant Information
        applicantName: formData.applicant.name,
        phone: `+88${formData.applicant.phone}`,
        email: formData.applicant.email,
        relationWithApplicant: formData.applicant.relation,

        // File attachments
        attachments: uploadedFiles.map((file) => ({
          id: file.uploadedId,
          name: file.name,
          type: file.fileType,
          category: file.fileCategory,
          size: file.size,
        })),

        // Other required fields
        declaration: "on",
        personImage: "",
      };

      console.log("Form submission data:", JSON.stringify(submissionData));
      const response = await fetch(
        "/api/birth/application/registration/otp-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personUbrn: submissionData.father.ubrn,
            cookies: sessionData.cookies,
            csrf: sessionData.csrf,
            otp: submissionData.otp,
            email: submissionData.email,
            phone: submissionData.phone,
          }),
        }
      );
      const respData = await response.json();
      if (respData.data.isVerified !== true) {
        toast.error("OTP যাচাই ব্যর্থ হয়েছে", { id: "submission" });
        return;
      }

      // Send data to API
      try {
        toast.loading("আবেদন জমা দেওয়া হচ্ছে...", { id: "submission" });
        const response = await fetch("/api/birth/application/registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });
        const resData = await response.json();

        if (resData.success) {
          router.push(`/birth/application/registration/view/${resData.id}`);
          toast.success("আবেদন সফলভাবে জমা দেওয়া হয়েছে!", {
            id: "submission",
          });
        } else {
          toast.error(resData.error, { id: "submission" });
        }
      } catch (error) {
        console.error("Submission error:", error);
        toast.error("আবেদন জমা দিতে সমস্যা হয়েছে");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("আবেদন জমা দিতে সমস্যা হয়েছে");
    }
  };

  // Step titles - always 5 steps now
  const stepTitles = [
    "অফিস নির্বাচন",
    "ব্যক্তির তথ্য",
    "পিতা-মাতার তথ্য",
    "ঠিকানা ও ফাইল",
    "পর্যালোচনা ও OTP",
  ];

  // Format address for display
  const getAddressDisplay = (address: Address | null) => {
    if (!address) return "নির্বাচিত হয়নি";

    if (address.country === "1") {
      return `${address.vilAreaTownBn},${address.postOfc}, ${address.unionName}, ${address.upazilaName}, ${address.districtName}, ${address.divisionName}`;
    } else {
      const country = countriesList.find((c) => c.id === address.country);
      return `${address.vilAreaTownBn}, ${country?.nameBn || "বিদেশ"}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">
            জন্ম নিবন্ধনের জন্য আবেদন
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base">
            Birth Registration Application Form
          </p>
          <p className="text-red-600 text-center text-sm mt-2">
            প্রতি আবেদনে {sessionData.serviceCost} টাকা করে কাটা হবে
          </p>
        </div>

        {/* Progress Steps - Always 5 steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Step Circles with Perfect Alignment */}
          <div className="flex justify-center w-full">
            <div className="relative w-full max-w-2xl">
              {/* Progress Line Background */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600 transform -translate-y-1/2 -z-10" />

              {/* Progress Line Fill */}
              <div
                className="absolute top-1/2 left-0 h-1 bg-blue-600 transform -translate-y-1/2 -z-10 transition-all duration-300"
                style={{
                  width: `${((currentStep - 1) / 4) * 100}%`,
                  maxWidth: "100%",
                }}
              />

              {/* Steps Container */}
              <div className="flex justify-between items-center relative">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className="flex flex-col items-center relative"
                  >
                    {/* Step Circle */}
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-300
                ${
                  currentStep >= step
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg transform scale-110"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                }`}
                    >
                      {step}
                    </div>

                    {/* Step Title - Always visible but responsive */}
                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs font-medium px-1 transition-colors duration-300 ${
                          currentStep >= step
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {stepTitles[step - 1]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Step Indicator */}
          <div className="md:hidden mt-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                ধাপ {currentStep}: {stepTitles[currentStep - 1]}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                মোট ৫টি ধাপের {currentStep} নং ধাপ
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6"
        >
          {/* Step 1: Office Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  আপনি নিম্নলিখিত কোন ঠিকানায় জন্ম নিবন্ধনের আবেদন করতে চান?
                </h3>

                {!bdMissionChecked && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <label className="flex items-center space-x-3 p-4 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="officeAddressType"
                        value="BIRTHPLACE"
                        checked={formData.officeAddressType === "BIRTHPLACE"}
                        onChange={(e) =>
                          handleInputChange("officeAddressType", e.target.value)
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        জন্মস্থান
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="officeAddressType"
                        value="PERMANENT"
                        checked={formData.officeAddressType === "PERMANENT"}
                        onChange={(e) =>
                          handleInputChange("officeAddressType", e.target.value)
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        স্থায়ী ঠিকানা
                      </span>
                    </label>
                  </div>
                )}

                <label className="flex items-center space-x-3 mt-4">
                  <input
                    type="checkbox"
                    checked={bdMissionChecked}
                    onChange={(e) => {
                      setBdMissionChecked(e.target.checked);
                      if (e.target.checked) {
                        handleInputChange("officeAddressType", "MISSION");
                        // Reset office address fields when checking BD Mission
                        handleInputChange("officeAddrCountry", "");
                        handleInputChange("officeAddrCity", "");
                        handleInputChange("officeAddrOffice", "");
                        setOfficeCities([]);
                        setOfficeOptions([]);
                        setCountryTargetGeoOrder(9); // Reset to default
                      } else {
                        handleInputChange("officeAddressType", "");
                      }
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    আপনি যদি বাংলাদেশ দূতাবাসে জন্ম নিবন্ধন আবেদন করতে চান, তবে
                    এটি নির্বাচন করুন
                  </span>
                </label>
              </div>

              {bdMissionChecked && (
                <div className="border-t dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    নিবন্ধন কার্যালয়ের ঠিকানা
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Country Selection */}
                    <div data-field="officeAddrCountry">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        দেশ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.officeAddrCountry}
                        onChange={handleOfficeCountryChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          formErrors.officeAddrCountry
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        required={bdMissionChecked}
                      >
                        <option value="">দেশ নির্বাচন করুন</option>
                        {dutaBasCountries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.nameBn}
                          </option>
                        ))}
                      </select>
                      {formErrors.officeAddrCountry && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.officeAddrCountry}
                        </p>
                      )}
                    </div>

                    {/* City Selection */}
                    {officeCities.length > 0 && (
                      <div data-field="officeAddrCity">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          শহর <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.officeAddrCity}
                          onChange={handleOfficeCityChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                            formErrors.officeAddrCity
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          required={bdMissionChecked}
                          disabled={
                            !formData.officeAddrCountry ||
                            officeCities.length === 0
                          }
                        >
                          <option value="">শহর নির্বাচন করুন</option>
                          {officeCities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.nameBn}
                            </option>
                          ))}
                        </select>
                        {formErrors.officeAddrCity && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.officeAddrCity}
                          </p>
                        )}
                        {loadingOfficeCities && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            শহর লোড হচ্ছে...
                          </p>
                        )}
                        {!loadingOfficeCities &&
                          formData.officeAddrCountry &&
                          officeCities.length === 0 && (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                              কোন শহর পাওয়া যায়নি
                            </p>
                          )}
                      </div>
                    )}

                    {/* Office Selection */}
                    {officeOptions.length > 0 && (
                      <div data-field="officeAddrOffice">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          অফিস <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.officeAddrOffice}
                          onChange={(e) =>
                            handleInputChange(
                              "officeAddrOffice",
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                            formErrors.officeAddrOffice
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          required={bdMissionChecked}
                          disabled={
                            !formData.officeAddrCity ||
                            officeOptions.length === 0
                          }
                        >
                          <option value="">অফিস নির্বাচন করুন</option>
                          {officeOptions.map((office) => (
                            <option key={office.id} value={office.id}>
                              {office.nameBn}
                            </option>
                          ))}
                        </select>
                        {formErrors.officeAddrOffice && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.officeAddrOffice}
                          </p>
                        )}
                        {loadingOfficeOptions && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            অফিস লোড হচ্ছে...
                          </p>
                        )}
                        {!loadingOfficeOptions &&
                          formData.officeAddrCity &&
                          officeOptions.length === 0 && (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                              কোন অফিস পাওয়া যায়নি
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  নিবন্ধনাধীন ব্যক্তির পরিচিতি
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div data-field="personInfoForBirth.personFirstNameBn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      নামের প্রথম অংশ বাংলায়{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.personInfoForBirth.personFirstNameBn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "personInfoForBirth",
                          "personFirstNameBn",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["personInfoForBirth.personFirstNameBn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="নামের প্রথম অংশ বাংলায়"
                      required
                    />
                    {formErrors["personInfoForBirth.personFirstNameBn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["personInfoForBirth.personFirstNameBn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="personInfoForBirth.personLastNameBn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      নামের শেষ অংশ বাংলায়{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.personInfoForBirth.personLastNameBn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "personInfoForBirth",
                          "personLastNameBn",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["personInfoForBirth.personLastNameBn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="নামের শেষ অংশ বাংলায়"
                      required
                    />
                    {formErrors["personInfoForBirth.personLastNameBn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["personInfoForBirth.personLastNameBn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="personInfoForBirth.personFirstNameEn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      নামের প্রথম অংশ ইংরেজিতে{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.personInfoForBirth.personFirstNameEn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "personInfoForBirth",
                          "personFirstNameEn",
                          e.target.value.toUpperCase()
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["personInfoForBirth.personFirstNameEn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="First Name in English"
                      required
                    />
                    {formErrors["personInfoForBirth.personFirstNameEn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["personInfoForBirth.personFirstNameEn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="personInfoForBirth.personLastNameEn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      নামের শেষ অংশ ইংরেজিতে{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.personInfoForBirth.personLastNameEn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "personInfoForBirth",
                          "personLastNameEn",
                          e.target.value.toUpperCase()
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["personInfoForBirth.personLastNameEn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Last Name in English"
                      required
                    />
                    {formErrors["personInfoForBirth.personLastNameEn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["personInfoForBirth.personLastNameEn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="personInfoForBirth.personBirthDate">
                    <DateInput
                      value={formData.personInfoForBirth.personBirthDate}
                      onChange={handleBirthDateChange}
                      label="জন্ম তারিখ (খ্রিঃ)"
                      required={true}
                    />
                    {age &&
                      (age.years > 0 || age.months > 0 || age.days > 0) && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          বয়স: {age.years} বছর, {age.months} মাস, {age.days}{" "}
                          দিন
                          {age.years >= 18 && " (১৮ বা তার বেশি বয়স)"}
                        </p>
                      )}
                  </div>

                  <div data-field="personInfoForBirth.thChild">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      পিতা ও মাতার কততম সন্তান{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.personInfoForBirth.thChild}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "personInfoForBirth",
                          "thChild",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["personInfoForBirth.thChild"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      required
                    >
                      <option value="">---নির্বাচন করুন---</option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        )
                      )}
                    </select>
                    {formErrors["personInfoForBirth.thChild"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["personInfoForBirth.thChild"]}
                      </p>
                    )}
                  </div>

                  <div data-field="personInfoForBirth.gender">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      লিঙ্গ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.personInfoForBirth.gender}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "personInfoForBirth",
                          "gender",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["personInfoForBirth.gender"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      required
                    >
                      <option value="">---নির্বাচন করুন---</option>
                      <option value="MALE">পুরুষ</option>
                      <option value="FEMALE">মহিলা</option>
                      <option value="THIRD_GENDER">তৃতীয় লিঙ্গ</option>
                    </select>
                    {formErrors["personInfoForBirth.gender"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["personInfoForBirth.gender"]}
                      </p>
                    )}
                  </div>

                  {/* NID Field for 18+ years old (optional) */}
                  {age.years >= 18 && (
                    <div data-field="personInfoForBirth.personNid">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        জাতীয় পরিচয়পত্র নম্বর (যদি থাকে)
                      </label>
                      <input
                        type="text"
                        value={formData.personInfoForBirth.personNid}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "personInfoForBirth",
                            "personNid",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          formErrors["personInfoForBirth.personNid"]
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="জাতীয় পরিচয়পত্র নম্বর"
                      />
                      {formErrors["personInfoForBirth.personNid"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors["personInfoForBirth.personNid"]}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        আপনার বয়স ১৮ বা তার বেশি, আপনি জাতীয় পরিচয়পত্র নম্বর
                        দিতে পারেন (ঐচ্ছিক)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Birth Place Address - Now using modal */}
              <div
                className="border-t dark:border-gray-700 pt-6"
                data-field="birthPlaceAddress"
              >
                <BDRISGeoSelector
                  onApply={handleBirthPlaceAddress}
                  initial={formData.birthPlaceAddress || undefined}
                  label="জন্মস্থানের ঠিকানা"
                  validateOnNext={validateBirthPlace}
                  buttonText="জন্মস্থানের ঠিকানা নির্বাচন করুন"
                  isBdMission={bdMissionChecked}
                />
                {formErrors.birthPlaceAddress && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.birthPlaceAddress}
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Parents Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                পিতা-মাতার তথ্য
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Father's Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                    পিতার তথ্য
                  </h4>

                  {/* Only show these fields if birth year is 2012 or later */}

                  <div data-field="father.ubrn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      পিতার জন্ম নিবন্ধন নম্বর{" "}
                      {parseDateString(
                        formData.personInfoForBirth.personBirthDate
                      ).year >= 2012 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.father.ubrn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "father",
                          "ubrn",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["father.ubrn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="জন্ম নিবন্ধন নম্বর"
                      required={
                        parseDateString(
                          formData.personInfoForBirth.personBirthDate
                        ).year >= 2012
                      }
                    />
                    {formErrors["father.ubrn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["father.ubrn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="father.personBirthDate">
                    <DateInput
                      value={formData.father.personBirthDate}
                      onChange={(value) =>
                        handleNestedInputChange(
                          "father",
                          "personBirthDate",
                          value
                        )
                      }
                      label="জন্ম তারিখ (খ্রিঃ)"
                      required={
                        parseDateString(
                          formData.personInfoForBirth.personBirthDate
                        ).year >= 2012
                      }
                      maxDate={formData.personInfoForBirth.personBirthDate}
                    />
                    {formErrors["father.personBirthDate"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["father.personBirthDate"]}
                      </p>
                    )}
                  </div>

                  <div data-field="father.personNameBn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      পিতার নাম বাংলায় <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.father.personNameBn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "father",
                          "personNameBn",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["father.personNameBn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="পিতার নাম বাংলায়"
                      required
                    />
                    {formErrors["father.personNameBn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["father.personNameBn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="father.personNameEn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      পিতার নাম ইংরেজিতে <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.father.personNameEn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "father",
                          "personNameEn",
                          e.target.value.toUpperCase()
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["father.personNameEn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Father's Name in English"
                      required
                    />
                    {formErrors["father.personNameEn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["father.personNameEn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="father.personNationality">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      পিতার জাতীয়তা <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.father.personNationality}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "father",
                          "personNationality",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["father.personNationality"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      required
                    >
                      <option value="">---নির্বাচন করুন---</option>
                      {nationalityOptions.map((nationality) => (
                        <option key={nationality.id} value={nationality.id}>
                          {nationality.value}
                        </option>
                      ))}
                    </select>
                    {formErrors["father.personNationality"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["father.personNationality"]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mother's Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                    মাতার তথ্য
                  </h4>

                  <div data-field="mother.ubrn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      মাতার জন্ম নিবন্ধন নম্বর{" "}
                      {parseDateString(
                        formData.personInfoForBirth.personBirthDate
                      ).year >= 2012 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.mother.ubrn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "mother",
                          "ubrn",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["mother.ubrn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="জন্ম নিবন্ধন নম্বর"
                      required={
                        parseDateString(
                          formData.personInfoForBirth.personBirthDate
                        ).year >= 2012
                      }
                    />
                    {formErrors["mother.ubrn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["mother.ubrn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="mother.personBirthDate">
                    <DateInput
                      value={formData.mother.personBirthDate}
                      onChange={(value) =>
                        handleNestedInputChange(
                          "mother",
                          "personBirthDate",
                          value
                        )
                      }
                      label="জন্ম তারিখ (খ্রিঃ)"
                      required={
                        parseDateString(
                          formData.personInfoForBirth.personBirthDate
                        ).year >= 2012
                      }
                      maxDate={formData.personInfoForBirth.personBirthDate}
                    />
                    {formErrors["mother.personBirthDate"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["mother.personBirthDate"]}
                      </p>
                    )}
                  </div>

                  <div data-field="mother.personNameBn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      মাতার নাম বাংলায় <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mother.personNameBn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "mother",
                          "personNameBn",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["mother.personNameBn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="মাতার নাম বাংলায়"
                      required
                    />
                    {formErrors["mother.personNameBn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["mother.personNameBn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="mother.personNameEn">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      মাতার নাম ইংরেজিতে <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mother.personNameEn}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "mother",
                          "personNameEn",
                          e.target.value.toUpperCase()
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["mother.personNameEn"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Mother's Name in English"
                      required
                    />
                    {formErrors["mother.personNameEn"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["mother.personNameEn"]}
                      </p>
                    )}
                  </div>

                  <div data-field="mother.personNationality">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      মাতার জাতীয়তা <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.mother.personNationality}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "mother",
                          "personNationality",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        formErrors["mother.personNationality"]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      required
                    >
                      <option value="">---নির্বাচন করুন---</option>
                      {nationalityOptions.map((nationality) => (
                        <option key={nationality.id} value={nationality.id}>
                          {nationality.value}
                        </option>
                      ))}
                    </select>
                    {formErrors["mother.personNationality"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["mother.personNationality"]}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Information notice based on birth year */}
              <div
                className={`p-4 rounded-lg ${
                  parseDateString(formData.personInfoForBirth.personBirthDate)
                    .year >= 2012
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    parseDateString(formData.personInfoForBirth.personBirthDate)
                      .year >= 2012
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-yellow-700 dark:text-yellow-300"
                  }`}
                >
                  {parseDateString(formData.personInfoForBirth.personBirthDate)
                    .year >= 2012
                    ? "২০১২ সাল বা তার পরে জন্মগ্রহণকারী শিশুর জন্য পিতা-মাতার জন্ম নিবন্ধন নম্বর এবং জন্ম তারিখ বাধ্যতামূলক।"
                    : "২০১২ সালের আগে জন্মগ্রহণকারী শিশুর জন্য পিতা-মাতার জন্ম নিবন্ধন নম্বর এবং জন্ম তারিখ বাধ্যতামূলক নয়।"}
                </p>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Address Information & File Upload */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                ঠিকানা ও ফাইল আপলোড
              </h3>

              <div className="space-y-6">
                {/* Permanent Address */}
                <div
                  className="border-b dark:border-gray-700 pb-6"
                  data-field="permAddrAddress"
                >
                  <label className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      checked={formData.copyBirthPlaceToPermAddr}
                      onChange={(e) =>
                        handleInputChange(
                          "copyBirthPlaceToPermAddr",
                          e.target.checked
                        )
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      জন্মস্থানের ঠিকানা ও স্থায়ী ঠিকানা একই
                    </span>
                  </label>

                  {!formData.copyBirthPlaceToPermAddr && (
                    <BDRISGeoSelector
                      onApply={handlePermAddrAddress}
                      initial={formData.permAddrAddress || undefined}
                      label="স্থায়ী ঠিকানা"
                      validateOnNext={validatePermAddress}
                      buttonText="স্থায়ী ঠিকানা নির্বাচন করুন"
                      isBdMission={bdMissionChecked}
                    />
                  )}
                  {formErrors.permAddrAddress && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.permAddrAddress}
                    </p>
                  )}
                </div>

                {/* Present Address */}
                <div
                  className="border-b dark:border-gray-700 pb-6"
                  data-field="prsntAddrAddress"
                >
                  <label className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      checked={formData.copyPermAddrToPrsntAddr}
                      onChange={(e) =>
                        handleInputChange(
                          "copyPermAddrToPrsntAddr",
                          e.target.checked
                        )
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      স্থায়ী ঠিকানা ও বর্তমান ঠিকানা একই
                    </span>
                  </label>

                  {!formData.copyPermAddrToPrsntAddr && (
                    <BDRISGeoSelector
                      onApply={handlePrsntAddrAddress}
                      initial={formData.prsntAddrAddress || undefined}
                      label="বর্তমান ঠিকানা"
                      validateOnNext={validatePrsntAddress}
                      buttonText="বর্তমান ঠিকানা নির্বাচন করুন"
                      isBdMission={bdMissionChecked}
                    />
                  )}
                  {formErrors.prsntAddrAddress && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.prsntAddrAddress}
                    </p>
                  )}
                </div>

                {/* File Upload Section */}
                <div data-field="attachments">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    ফাইল আপলোড
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    <span className="text-red-500 font-bold">
                      * প্রয়োজনীয়:
                    </span>{" "}
                    নিম্নলিখিত ২টি ফাইল আপলোড করুন:
                  </p>

                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      প্রয়োজনীয় ফাইল তালিকা:
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                      {fileTypes.map((fileType) => (
                        <li key={fileType.id} className="ml-2">
                          <span className="font-medium">
                            ফাইল টাইপ {fileType.id}:
                          </span>{" "}
                          {fileType.name}
                          {uploadedFiles.some(
                            (f) => f.attachmentTypeId === fileType.id
                          ) && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                              ✓ আপলোড করা হয়েছে
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
                      শুধুমাত্র ইমেজ ফাইল (.jpg, .jpeg, .png) আপলোড করা যাবে।
                      (প্রতিটি ফাইলের জন্য সর্বোচ্চ ফাইল সাইজ 2 মেগা বাইট)
                    </p>
                  </div>

                  {/* Drag & Drop Area */}
                  <div
                    className={`mt-2 border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <svg
                        className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 48 48"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0l-3-3m3 3l3-3"
                        />
                      </svg>
                      <div>
                        <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ফাইল এখানে ড্রপ করুন
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          অথবা ফাইল নির্বাচন করতে ক্লিক করুন
                        </p>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                      >
                        ফাইল নির্বাচন করুন
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG ফাইল সমর্থিত • সর্বোচ্চ 2MB প্রতি ফাইল
                      </p>
                    </div>
                  </div>

                  {/* Uploading list */}
                  {uploadingFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                        নির্বাচিত ফাইল ({uploadingFiles.length})
                      </h4>
                      <div className="space-y-3">
                        {uploadingFiles.map((item, idx) => (
                          <div
                            key={`uploading-${idx}`}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {item.file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <select
                              value={item.fileTypeId}
                              onChange={(e) =>
                                updateUploadingFileType(idx, e.target.value)
                              }
                              className="px-3 md:w-1/2 py-2 border dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-white w-full sm:w-auto"
                              disabled={uploadedFiles.some(
                                (f) => f.attachmentTypeId === item.fileTypeId
                              )}
                            >
                              <option value="-1">---টাইপ নির্বাচন---</option>
                              {fileTypes.map((t) => (
                                <option
                                  key={`filetype-${t.id}`}
                                  value={t.id}
                                  disabled={uploadedFiles.some(
                                    (f) => f.attachmentTypeId === t.id
                                  )}
                                >
                                  {t.name}{" "}
                                  {uploadedFiles.some(
                                    (f) => f.attachmentTypeId === t.id
                                  )
                                    ? "(ইতিমধ্যে আপলোড হয়েছে)"
                                    : ""}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => handleFileUpload(idx)}
                                disabled={
                                  item.fileTypeId === "-1" ||
                                  item.isUploading ||
                                  uploadedFiles.some(
                                    (f) =>
                                      f.attachmentTypeId === item.fileTypeId
                                  )
                                }
                                className={`px-4 py-2 rounded text-sm flex-1 sm:flex-none transition-colors ${
                                  item.fileTypeId === "-1" ||
                                  item.isUploading ||
                                  uploadedFiles.some(
                                    (f) =>
                                      f.attachmentTypeId === item.fileTypeId
                                  )
                                    ? "bg-gray-400 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                              >
                                {item.isUploading
                                  ? `আপলোডিং... ${item.progress}%`
                                  : "আপলোড"}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeUploadingFile(idx)}
                                className="p-2 text-red-600 hover:text-red-800 dark:hover:text-red-400 transition-colors"
                                title="Remove file"
                                disabled={item.isUploading}
                              >
                                <svg
                                  className="w-5 h-5"
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded list */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                        আপলোডকৃত ফাইল ({uploadedFiles.length}/2)
                      </h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((f) => (
                          <div
                            key={`uploaded-${f.id}`}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-700 dark:text-green-400 hover:underline font-medium text-sm truncate block"
                              >
                                {f.name}
                              </a>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                ফাইল টাইপ {f.attachmentTypeId}: {f.fileType}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeUploadedFile(f.id)}
                              className="p-1 text-red-600 hover:text-red-800 dark:hover:text-red-400 transition-colors self-end sm:self-auto"
                              title="Delete file"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      {uploadedFiles.length === 2 && (
                        <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                            ✓ সকল প্রয়োজনীয় ফাইল সফলভাবে আপলোড হয়েছে
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {formErrors.attachments && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.attachments}
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      required
                      className="text-blue-600 focus:ring-blue-500 mt-1"
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      আমি ঘোষণা করছি যে, উপরে বর্ণিত সকল তথ্য সঠিক ও বস্তুনিষ্ঠ।
                      ভুল তথ্য প্রদানের জন্য আমি আইনত দায়ী থাকব।
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Review and OTP Verification (Combined step) */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                তথ্য পর্যালোচনা ও OTP যাচাই
              </h3>

              {/* Auto-populate applicant information based on age */}
              {age.years < 18 ? (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    <span className="font-semibold">নোট:</span> নিবন্ধনাধীন
                    ব্যক্তির বয়স ১৮ বছরের কম হওয়ায় পিতার তথ্য আবেদনকারী
                    হিসেবে ব্যবহৃত হচ্ছে।
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    <span className="font-semibold">নোট:</span> নিবন্ধনাধীন
                    ব্যক্তির বয়স ১৮ বা তার বেশি হওয়ায় নিজের তথ্য আবেদনকারী
                    হিসেবে ব্যবহৃত হচ্ছে।
                  </p>
                </div>
              )}

              {/* Review Section */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  প্রদত্ত তথ্য পর্যালোচনা
                </h4>

                <div className="space-y-4">
                  {/* Personal Information */}
                  <div>
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      ব্যক্তিগত তথ্য
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          নাম (বাংলা):
                        </span>
                        <p className="font-medium">
                          {formData.personInfoForBirth.personFirstNameBn}{" "}
                          {formData.personInfoForBirth.personLastNameBn}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          নাম (ইংরেজি):
                        </span>
                        <p className="font-medium">
                          {formData.personInfoForBirth.personFirstNameEn}{" "}
                          {formData.personInfoForBirth.personLastNameEn}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          জন্ম তারিখ:
                        </span>
                        <p className="font-medium">
                          {formData.personInfoForBirth.personBirthDate}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          বয়স:
                        </span>
                        <p className="font-medium">
                          {age.years} বছর, {age.months} মাস, {age.days} দিন
                          {age.years < 18 && " (১৮ বছরের কম)"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          লিঙ্গ:
                        </span>
                        <p className="font-medium">
                          {formData.personInfoForBirth.gender === "MALE"
                            ? "পুরুষ"
                            : formData.personInfoForBirth.gender === "FEMALE"
                            ? "মহিলা"
                            : "তৃতীয় লিঙ্গ"}
                        </p>
                      </div>
                      {/* Show NID in review if age is 18+ and NID is provided */}
                      {age.years >= 18 &&
                        formData.personInfoForBirth.personNid && (
                          <div className="md:col-span-2">
                            <span className="text-gray-600 dark:text-gray-400">
                              জাতীয় পরিচয়পত্র নম্বর:
                            </span>
                            <p className="font-medium">
                              {formData.personInfoForBirth.personNid}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Parents Information */}
                  <div>
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      পিতা-মাতার তথ্য
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          পিতার জন্ম নিবন্ধন নম্বর:
                        </span>
                        <p className="font-medium">{formData.father.ubrn}</p>
                        <span className="text-gray-600 dark:text-gray-400">
                          জন্ম তারিখ:
                        </span>
                        <p className="font-medium">
                          {formData.father.personBirthDate}
                        </p>
                        <span className="text-gray-600 dark:text-gray-400">
                          পিতার নাম (বাংলা):
                        </span>
                        <p className="font-medium">
                          {formData.father.personNameBn}
                        </p>
                        <span className="text-gray-600 dark:text-gray-400">
                          পিতার নাম (ইংরেজি):
                        </span>
                        <p className="font-medium">
                          {formData.father.personNameEn}
                        </p>
                        <span className="text-gray-600 dark:text-gray-400">
                          পিতার জাতীয়তা:
                        </span>
                        <p className="font-medium">
                          {nationalityOptions.find(
                            (n) => n.id === formData.father.personNationality
                          )?.value}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          মাতার জন্ম নিবন্ধন নম্বর:
                        </span>
                        <p className="font-medium">{formData.mother.ubrn}</p>
                        <span className="text-gray-600 dark:text-gray-400">
                          জন্ম তারিখ:
                        </span>
                        <p className="font-medium">
                          {formData.mother.personBirthDate}
                        </p>
                        <span className="text-gray-600 dark:text-gray-400">
                          মাতার নাম (বাংলা):
                        </span>
                        <p className="font-medium">
                          {formData.mother.personNameBn}
                        </p>
                        <span className="text-gray-600 dark:text-gray-400">
                          মাতার নাম (ইংরেজি):
                        </span>
                        <p className="font-medium">
                          {formData.mother.personNameEn}
                        </p>
                        <span className="text-gray-600 dark:text-gray-400">
                          মাতার জাতীয়তা:
                        </span>
                        <p className="font-medium">
                          {nationalityOptions.find(
                            (n) => n.id === formData.mother.personNationality
                          )?.value}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      ঠিকানা
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          জন্মস্থান:
                        </span>
                        <p className="font-medium">
                          {getAddressDisplay(formData.birthPlaceAddress)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          স্থায়ী ঠিকানা:
                        </span>
                        <p className="font-medium">
                          {formData.copyBirthPlaceToPermAddr
                            ? "জন্মস্থানের মতো একই"
                            : getAddressDisplay(formData.permAddrAddress)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          বর্তমান ঠিকানা:
                        </span>
                        <p className="font-medium">
                          {formData.copyPermAddrToPrsntAddr
                            ? "স্থায়ী ঠিকানার মতো একই"
                            : getAddressDisplay(formData.prsntAddrAddress)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Applicant Information */}
                  <div>
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      আবেদনকারীর তথ্য
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          নাম:
                        </span>
                        <p className="font-medium">{formData.applicant.name}</p>
                      </div>

                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          সম্পর্ক:
                        </span>
                        <p className="font-medium">
                          {age.years < 18 ? "পিতা" : "নিজে"}
                        </p>
                      </div>
                      {formData.applicant.nid && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            জাতীয় পরিচয়পত্র নম্বর:
                          </span>
                          <p className="font-medium">
                            {formData.applicant.nid}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Uploads */}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        আপলোডকৃত ফাইল
                      </h5>
                      <div className="text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          মোট ফাইল: {uploadedFiles.length}টি (২টি প্রয়োজনীয়)
                        </p>
                        <ul className="list-disc list-inside mt-1 text-gray-700 dark:text-gray-300">
                          {uploadedFiles.map((file, index) => (
                            <li key={file.id}>
                              {file.name} - ফাইল টাইপ {file.attachmentTypeId}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OTP Verification Section - FIXED with proper countdown */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  OTP যাচাই *
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      আবেদনকারীর নাম *
                    </label>
                    <input
                      type="text"
                      value={formData.applicant.name}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ইমেইল
                    </label>
                    <input
                      type="email"
                      value={formData.applicant.email}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "applicant",
                          "email",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="example@email.com"
                    />
                  </div>

                  {/* Phone input with Send button */}
                  <div className="mb-4 w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ফোন নম্বর *
                    </label>
                    <div className="flex flex-col sm:flex-row w-full gap-2">
                      <input
                        type="tel"
                        value={formData.applicant.phone}
                        onChange={(e) => {
                          // Reset OTP state when phone changes
                          setOtpCountdown(0);
                          setIsOtpSent(false);
                          setOtpVerified(false);
                          handleNestedInputChange(
                            "applicant",
                            "phone",
                            e.target.value
                          );
                        }}
                        className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="01XXXXXXXXX"
                        required
                      />
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={isOtpSent && otpCountdown > 0}
                        className={`font-bold px-4 py-2 rounded-md w-full sm:w-auto transition-colors ${
                          isOtpSent && otpCountdown > 0
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                            : "bg-green-500 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
                        }`}
                      >
                        {isOtpSent && otpCountdown > 0 ? (
                          <span className="flex items-center justify-center">
                            <span className="mr-1">⌛</span>
                            {formatTime(otpCountdown)}
                          </span>
                        ) : (
                          "OTP পাঠান"
                        )}
                      </button>
                    </div>
                    {isOtpSent && otpCountdown > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        OTP পাঠানো হয়েছে। {formatTime(otpCountdown)} পরে আবার একই নম্বরে পাঠাতে পারবেন
                      </p>
                    )}
                    {formErrors["applicant.phone"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors["applicant.phone"]}
                      </p>
                    )}
                  </div>

                  {/* OTP input with Verify button */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OTP *
                    </label>
                    <div className="flex flex-col sm:flex-row w-full gap-2">
                      <input
                        type="text"
                        value={formData.applicant.otp || ""}
                        onChange={(e) => {
                          setOtpVerified(false); // Reset verification when OTP changes
                          handleNestedInputChange(
                            "applicant",
                            "otp",
                            e.target.value
                          );
                        }}
                        className={`flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          formErrors.otp ? "border-red-500" : ""
                        }`}
                        placeholder="Enter OTP"
                        required
                      />
                    </div>
                    {otpVerified && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        ✓ OTP সফলভাবে যাচাই হয়েছে
                      </p>
                    )}
                    {formErrors.otp && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.otp}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`}
                >
                  আবেদন জমা দিন
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}