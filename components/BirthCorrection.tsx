"use client";

import { useEffect, useRef, useState } from "react";
import { countriesList, nationalityOptions } from "@/json/countries";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import SimpleUnicodeLoader from "./Loader";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────────── */
// Define the type for correction info
interface CorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
  error?: string; // Added error field for validation
}

// Define the type for the update function
type UpdateCorrectionInfo = (
  id: string,
  field: keyof CorrectionInfo,
  value: string
) => void;

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

interface BirthRecord {
  personNameBn: string;
  personNameEn: string;
  motherNameBn: string;
  motherNameEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  personDob: string;
  ubrn: string;
  registrationOfficeNameBn: string;
  officeAddressBn: string;
  officeId: string;
  divisionId?: string;
  divisionName?: string;
  districtId?: string;
  districtName?: string;
  upazilaId?: string;
  upazilaName?: string;
  unionId?: string;
  unionName?: string;
  wardId?: string;
  wardName?: string;
  birthAddress?: Address;
  permAddress?: Address;
  prsntAddress?: Address;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  attachmentTypeId: string;
  fileType?: string;
  deleteUrl?: string;
}

interface FileType {
  id: string;
  name: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   BDRISGeoSelector – Updated to use country selection with address inputs
   ──────────────────────────────────────────────────────────────────────────── */
interface GeoLocation {
  id: string;
  nameBn: string;
  nameEn: string;
  targetGeoOrder?: number;
  geoLevelId?: number;
}

interface GeoResponse {
  geoObject: GeoLocation[];
  targetGeoOrder?: number;
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

type GeoSelectorProps = {
  /** Called when the user clicks "প্রয়োগ করুন" */
  onApply: (addr: Address) => void;
  /** Optional pre-filled address (used when editing) */
  initial?: Partial<Address>;
};

const BDRISGeoSelector: React.FC<GeoSelectorProps> = ({ onApply, initial }) => {
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

  const [addressErrors, setAddressErrors] = useState({
    postOfc: "",
    postOfcEn: "",
    vilAreaTownBn: "",
    vilAreaTownEn: "",
    houseRoadBn: "",
    houseRoadEn: "",
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

  const api = "/api/address?ajax=1";

  const refs = {
    country: useRef<HTMLSelectElement>(null),
    division: useRef<HTMLSelectElement>(null),
    district: useRef<HTMLSelectElement>(null),
    upazila: useRef<HTMLSelectElement>(null),
    union: useRef<HTMLSelectElement>(null),
    ward: useRef<HTMLSelectElement>(null),
  };

  // Updated validation functions for address inputs - allowing numbers, special characters, and additional symbols
  const validateBanglaText = (value: string): boolean => {
    // Allow Bengali characters, numbers, and common special characters including , - and space
    const banglaRegex = /^[\u0980-\u09FF\s.,;:!?()\-–—'"০-৯,/ -]+$/;
    return banglaRegex.test(value) || value === "";
  };

  const validateEnglishText = (value: string): boolean => {
    // Allow English characters, numbers, and common special characters including , - and space
    const englishRegex = /^[A-Za-z\s.,;:!?()\-–—'"0-9,/ -]+$/;
    return englishRegex.test(value) || value === "";
  };

  const validateBanglaWithNumbers = (value: string): boolean => {
    // Allow Bengali characters, numbers, and common special characters including , - and space
    const banglaWithNumbersRegex = /^[\u0980-\u09FF\s.,;:!?()\-–—'"০-৯,/ -]+$/;
    return banglaWithNumbersRegex.test(value) || value === "";
  };

  const validateEnglishWithNumbers = (value: string): boolean => {
    // Allow English characters, numbers, and common special characters including , - and space
    const englishWithNumbersRegex = /^[A-Za-z\s.,;:!?()\-–—'"0-9,/ -]+$/;
    return englishWithNumbersRegex.test(value) || value === "";
  };

  const showLoading = (field: keyof LoadingState, visible: boolean) => {
    setLoading((p) => ({ ...p, [field]: visible }));
  };

  const clearSelects = (fields: (keyof OptionsState)[]) => {
    setOptions((p) => {
      const n = { ...p };
      fields.forEach((f) => (n[f] = []));
      return n;
    });
  };

  const buildUrl = (
    parentId: string,
    order: string,
    type: string,
    ward = false
  ) => {
    const w = ward && "&ward=true";
    return `${api}&parent=${encodeURIComponent(
      parentId
    )}&geoGroup=birthPlace&geoOrder=${order}&geoType=${encodeURIComponent(
      type
    )}${w}`;
  };

  const loadGeo = async (
    target: keyof OptionsState,
    parentId: string,
    order: string,
    type: string,
    ward = false
  ): Promise<GeoLocation[]> => {
    showLoading(target, true);
    const url = buildUrl(parentId, order, type, ward);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: GeoResponse = await r.json();
      const list = Array.isArray(data.geoObject) ? data.geoObject : [];
      const safe = list.map((l) => ({
        ...l,
        nameBn: (l.nameBn || "").replace(/</g, "&lt;"),
        nameEn: (l.nameEn || "").replace(/</g, "&lt;"),
      }));
      setOptions((p) => ({ ...p, [target]: safe }));
      return safe;
    } catch (e) {
      console.error(e);
      toast.error("লোড করতে সমস্যা হয়েছে");
      return [];
    } finally {
      showLoading(target, false);
    }
  };

  const getParams = (ref: React.RefObject<HTMLSelectElement>) => {
    const sel = ref.current;
    if (!sel?.selectedOptions?.[0]) return null;
    const opt = sel.selectedOptions[0];
    return {
      parentId: opt.value,
      nextOrder: opt.dataset.nextOrder ?? "",
      nextType: opt.dataset.nextType ?? "",
      currentType: opt.dataset.currentType ?? "",
    };
  };

  // Handle address input changes with validation
  const handleAddressInputChange = (
    field: keyof typeof addressInputs,
    value: string
  ) => {
    setAddressInputs((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate input based on field type
    let isValid = true;
    let errorMessage = "";

    switch (field) {
      case "postOfc":
        isValid = validateBanglaText(value);
        errorMessage = isValid ? "" : "শুধুমাত্র বাংলা অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
        break;
      case "postOfcEn":
        isValid = validateEnglishText(value);
        errorMessage = isValid ? "" : "শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
        break;
      case "vilAreaTownBn":
        isValid = validateBanglaWithNumbers(value);
        errorMessage = isValid ? "" : "শুধুমাত্র বাংলা অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
        break;
      case "vilAreaTownEn":
        isValid = validateEnglishWithNumbers(value);
        errorMessage = isValid
          ? ""
          : "শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
        break;
      case "houseRoadBn":
        isValid = validateBanglaWithNumbers(value);
        errorMessage = isValid ? "" : "শুধুমাত্র বাংলা অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
        break;
      case "houseRoadEn":
        isValid = validateEnglishWithNumbers(value);
        errorMessage = isValid
          ? ""
          : "শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, কমা, হайфেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
        break;
    }

    setAddressErrors((prev) => ({
      ...prev,
      [field]: errorMessage,
    }));
  };

  // Validate all address inputs before applying
  const validateAddressInputs = (): boolean => {
    const newErrors = { ...addressErrors };

    // Validate postOfc (Bangla) - Required
    if (!addressInputs.postOfc.trim()) {
      newErrors.postOfc = "ডাকঘরের নাম বাংলায় পূরণ করুন";
    } else if (!validateBanglaText(addressInputs.postOfc)) {
      newErrors.postOfc = "শুধুমাত্র বাংলা অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
    } else {
      newErrors.postOfc = "";
    }

    // Validate postOfcEn (English) - Required
    if (!addressInputs.postOfcEn.trim()) {
      newErrors.postOfcEn = "ডাকঘরের নাম ইংরেজিতে পূরণ করুন";
    } else if (!validateEnglishText(addressInputs.postOfcEn)) {
      newErrors.postOfcEn = "শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
    } else {
      newErrors.postOfcEn = "";
    }

    // Validate vilAreaTownBn (Bangla with numbers) - Required
    if (!addressInputs.vilAreaTownBn.trim()) {
      newErrors.vilAreaTownBn = "গ্রাম/পাড়া/মহল্লার নাম বাংলায় পূরণ করুন";
    } else if (!validateBanglaWithNumbers(addressInputs.vilAreaTownBn)) {
      newErrors.vilAreaTownBn = "শুধুমাত্র বাংলা অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
    } else {
      newErrors.vilAreaTownBn = "";
    }

    // Validate vilAreaTownEn (English with numbers) - Required
    if (!addressInputs.vilAreaTownEn.trim()) {
      newErrors.vilAreaTownEn = "গ্রাম/পাড়া/মহল্লার নাম ইংরেজিতে পূরণ করুন";
    } else if (!validateEnglishWithNumbers(addressInputs.vilAreaTownEn)) {
      newErrors.vilAreaTownEn = "শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
    } else {
      newErrors.vilAreaTownEn = "";
    }

    // Validate houseRoadBn (Bangla with numbers) - Optional
    if (addressInputs.houseRoadBn && !validateBanglaWithNumbers(addressInputs.houseRoadBn)) {
      newErrors.houseRoadBn = "শুধুমাত্র বাংলা অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
    } else {
      newErrors.houseRoadBn = "";
    }

    // Validate houseRoadEn (English with numbers) - Optional
    if (addressInputs.houseRoadEn && !validateEnglishWithNumbers(addressInputs.houseRoadEn)) {
      newErrors.houseRoadEn = "শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, কমা, হাইফেন এবং সাধারণ বিশেষ চিহ্ন অনুমোদিত";
    } else {
      newErrors.houseRoadEn = "";
    }

    setAddressErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    // For non-Bangladesh countries, check if all required address fields are filled
    if (selected.country !== "1" && selected.country !== "-1") {
      const hasAllRequiredFields = 
        addressInputs.postOfc.trim() &&
        addressInputs.postOfcEn.trim() &&
        addressInputs.vilAreaTownBn.trim() &&
        addressInputs.vilAreaTownEn.trim();

      if (!hasAllRequiredFields) {
        toast.error("দয়া করে সকল প্রয়োজনীয় ঠিকানা তথ্য পূরণ করুন");
        return false;
      }
    }

    // For Bangladesh, check required fields
    if (selected.country === "1") {
      const hasAllRequiredFields = 
        addressInputs.postOfc.trim() &&
        addressInputs.postOfcEn.trim() &&
        addressInputs.vilAreaTownBn.trim() &&
        addressInputs.vilAreaTownEn.trim();

      if (!hasAllRequiredFields) {
        toast.error("দয়া করে সকল প্রয়োজনীয় ঠিকানা তথ্য পূরণ করুন");
        return false;
      }
    }

    return !hasErrors;
  };

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSelected((p) => ({
      ...p,
      country: v,
      division: "",
      district: "",
      upazila: "",
      union: "",
      ward: "",
    }));
    clearSelects(["division", "district", "upazila", "union", "ward"]);

    // Only load divisions if Bangladesh is selected (value "1")
    if (v === "1") {
      loadGeo("division", "1", "0", "0");
    }
  };

  const handleDivision = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSelected((p) => ({
      ...p,
      division: v,
      district: "",
      upazila: "",
      union: "",
      ward: "",
    }));
    clearSelects(["district", "upazila", "union", "ward"]);
    if (!v) return;
    const p = getParams(refs.division as React.RefObject<HTMLSelectElement>);
    if (!p) return;
    loadGeo("district", p.parentId, p.nextOrder || "1", p.nextType || "1");
  };

  const handleDistrict = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSelected((p) => ({
      ...p,
      district: v,
      upazila: "",
      union: "",
      ward: "",
    }));
    clearSelects(["upazila", "union", "ward"]);
    if (!v) return;
    const p = getParams(refs.district as React.RefObject<HTMLSelectElement>);
    if (!p) return;
    loadGeo("upazila", p.parentId, p.nextOrder || "2", p.nextType || "2");
  };

  const handleUpazila = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSelected((p) => ({ ...p, upazila: v, union: "", ward: "" }));
    clearSelects(["union", "ward"]);
    if (!v) return;
    const p = getParams(refs.upazila as React.RefObject<HTMLSelectElement>);
    if (!p) return;
    const upazilaId = p.parentId;
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
        const all: GeoLocation[] = [];
        [city, canton, union].forEach((d) => {
          const list = (d as GeoResponse).geoObject || [];
          list.forEach((l) =>
            all.push({
              ...l,
              nameBn: (l.nameBn || "").replace(/</g, "&lt;"),
              nameEn: (l.nameEn || "").replace(/</g, "&lt;"),
            })
          );
        });
        setOptions((prev) => ({ ...prev, union: all }));
        showLoading("union", false);
      })
      .catch(() => showLoading("union", false));
  };

  const handleUnion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSelected((p) => ({ ...p, union: v, ward: "" }));
    clearSelects(["ward"]);
    if (!v) return;
    const p = getParams(refs.union as React.RefObject<HTMLSelectElement>);
    if (!p) return;
    const unionType = p.currentType;
    setWardLabel(
      unionType === "7"
        ? "ওয়ার্ড (ক্যান্টনমেন্ট)"
        : unionType === "8"
        ? "ওয়ার্ড (সিটি)"
        : "ওয়ার্ড"
    );
    let wardType = "5";
    if (unionType === "8") wardType = "9";
    else if (unionType === "7") wardType = "6";
    loadGeo("ward", p.parentId, "4", wardType, true);
  };

  const handleWard = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected((p) => ({ ...p, ward: e.target.value }));
  };

  const buildAddress = (): Address | null => {
    const getCountry = () => {
      const country = countriesList.find((c) => c.id === selected.country);
      return country || null;
    };

    const get = (field: keyof typeof selected) => {
      const id = selected[field];
      if (!id) return null;
      const list = options[field as keyof OptionsState] as GeoLocation[];

      return (
        list.find((i) => {
          return i.id.toString() === id.toString();
        }) ?? null
      );
    };

    const country = getCountry();
    const div = get("division");
    const dis = get("district");
    const upa = get("upazila");
    const uni = get("union");
    const wrd = get("ward");

    if (!country || country.id === "-1") {
      toast.error("Country not selected or invalid");
      return null;
    }

    // For Bangladesh, require all geographic levels
    if (country.id === "1") {
      if (!div || !dis || !upa || !uni) {
        toast.error("Geographic levels not selected or invalid");
        return null;
      }
    }

    // Validate required address fields
    if (
      !addressInputs.postOfc.trim() ||
      !addressInputs.postOfcEn.trim() ||
      !addressInputs.vilAreaTownBn.trim() ||
      !addressInputs.vilAreaTownEn.trim()
    ) {
      toast.error("Missing required address fields");
      return null;
    }

    return {
      country: country.id,
      geoId: country.geoId,
      division: div?.id || "-1",
      divisionName: div?.nameBn || "",
      district: dis?.id || "-1",
      districtName: dis?.nameBn || "",
      cityCorpCantOrUpazila: upa?.id || "-1",
      upazilaName: upa?.nameBn || "",
      paurasavaOrUnion: uni?.id || "-1",
      unionName: uni?.nameBn || "",
      postOfc: addressInputs.postOfc || "",
      postOfcEn: addressInputs.postOfcEn || "",
      vilAreaTownBn: addressInputs.vilAreaTownBn || "",
      vilAreaTownEn: addressInputs.vilAreaTownEn || "",
      houseRoadBn: addressInputs.houseRoadBn || "",
      houseRoadEn: addressInputs.houseRoadEn || "",
      ward: wrd?.id ?? "-1",
      wardName: wrd?.nameBn ?? "",
    };
  };

  const apply = () => {
    // Validate address inputs first
    if (!validateAddressInputs()) {
      return;
    }

    const addr = buildAddress();

    if (addr) {
      onApply(addr);
    } else {
      // Show specific error messages
      if (!selected.country || selected.country === "-1") {
        toast.error("দয়া করে একটি দেশ নির্বাচন করুন");
      } else if (selected.country === "1") {
        if (!selected.division) toast.error("দয়া করে বিভাগ নির্বাচন করুন");
        else if (!selected.district) toast.error("দয়া করে জেলা নির্বাচন করুন");
        else if (!selected.upazila)
          toast.error("দয়া করে উপজেলা নির্বাচন করুন");
        else if (!selected.union) toast.error("দয়া করে ইউনিয়ন নির্বাচন করুন");
      } else {
        if (
          !addressInputs.postOfc.trim() ||
          !addressInputs.postOfcEn.trim() ||
          !addressInputs.vilAreaTownBn.trim() ||
          !addressInputs.vilAreaTownEn.trim()
        ) {
          toast.error("দয়া করে সকল প্রয়োজনীয় ঠিকানা তথ্য পূরণ করুন");
        }
      }
    }
  };

  // ── Pre-fill when editing ───────────────────────────────────────────────
  useEffect(() => {
    if (!initial) return;

    // Load divisions if Bangladesh is selected
    if (initial.country === "1") {
      loadGeo("division", "1", "0", "0").then(() => {
        // After divisions are loaded, load subsequent levels
        if (initial.division) {
          loadGeo("district", initial.division, "1", "1").then(() => {
            if (initial.district) {
              loadGeo("upazila", initial.district, "2", "2").then(() => {
                if (initial.cityCorpCantOrUpazila) {
                  const upazilaId = initial.cityCorpCantOrUpazila;
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
                      const all: GeoLocation[] = [];
                      [city, canton, union].forEach((d) => {
                        const list = (d as GeoResponse).geoObject || [];
                        list.forEach((l) =>
                          all.push({
                            ...l,
                            nameBn: (l.nameBn || "").replace(/</g, "&lt;"),
                            nameEn: (l.nameEn || "").replace(/</g, "&lt;"),
                          })
                        );
                      });
                      setOptions((prev) => ({ ...prev, union: all }));
                      showLoading("union", false);

                      // After unions are loaded, load wards if needed
                      if (initial.paurasavaOrUnion) {
                        const unionType = all
                          .find((u) => u.id === initial.paurasavaOrUnion)
                          ?.geoLevelId?.toString();
                        if (unionType) {
                          setWardLabel(
                            unionType === "7"
                              ? "ওয়ার্ড (ক্যান্টনমেন্ট)"
                              : unionType === "8"
                              ? "ওয়ার্ড (সিটি)"
                              : "ওয়ার্ড"
                          );
                          let wardType = "5";
                          if (unionType === "8") wardType = "9";
                          else if (unionType === "7") wardType = "6";
                          loadGeo(
                            "ward",
                            initial.paurasavaOrUnion!,
                            "4",
                            wardType,
                            true
                          );
                        }
                      }
                    })
                    .catch(() => showLoading("union", false));
                }
              });
            }
          });
        }
      });
    }
  }, [initial]);

  // ── Render helper ───────────────────────────────────────────────────────
  const renderSelect = (
    id: string,
    label: string,
    value: string,
    list: GeoLocation[],
    loading: boolean,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    ref?: React.RefObject<HTMLSelectElement>,
    includeMeta = true
  ) => (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        value={value}
        onChange={onChange}
        className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        <option value="-1">-- নির্বাচন করুন --</option>
        {list.map((item, index) => {
          if (!includeMeta)
            return (
              <option key={`${id}-${item.id}-${index}`} value={item.id}>
                {item.nameBn}
              </option>
            );

          const nextOrder = item.targetGeoOrder?.toString() ?? "";
          const nextType = item.geoLevelId?.toString() ?? "";
          const curType = item.geoLevelId?.toString() ?? "";

          return (
            <option
              key={`${id}-${item.id}-${index}`}
              value={item.id}
              data-next-order={nextOrder}
              data-next-type={nextType}
              data-current-type={curType}
            >
              {item.nameBn}
            </option>
          );
        })}
      </select>
      {loading && (
        <p className="text-sm text-blue-600 dark:text-blue-400">লোড হচ্ছে...</p>
      )}
    </div>
  );

  // Render address input fields with validation
  const renderAddressInputs = () => (
    <div className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
        অতিরিক্ত ঠিকানা তথ্য
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ডাকঘর (বাংলায়) */}
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            ডাকঘর (বাংলায়) *
          </label>
          <input
            type="text"
            value={addressInputs.postOfc}
            onChange={(e) =>
              handleAddressInputChange("postOfc", e.target.value)
            }
            className={`w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              addressErrors.postOfc ? "border-red-500 dark:border-red-400" : ""
            }`}
            placeholder="ডাকঘরের নাম বাংলায়"
            required
          />
          {addressErrors.postOfc && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {addressErrors.postOfc}
            </p>
          )}
        </div>

        {/* ডাকঘর (ইংরেজিতে) */}
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            ডাকঘর (ইংরেজিতে) *
          </label>
          <input
            type="text"
            value={addressInputs.postOfcEn}
            onChange={(e) =>
              handleAddressInputChange("postOfcEn", e.target.value)
            }
            className={`w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              addressErrors.postOfcEn
                ? "border-red-500 dark:border-red-400"
                : ""
            }`}
            placeholder="Post Office Name in English"
            required
          />
          {addressErrors.postOfcEn && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {addressErrors.postOfcEn}
            </p>
          )}
        </div>

        {/* গ্রাম / পাড়া / মহল্লা */}
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            গ্রাম / পাড়া / মহল্লা (বাংলায়) *
          </label>
          <textarea
            value={addressInputs.vilAreaTownBn}
            onChange={(e) =>
              handleAddressInputChange("vilAreaTownBn", e.target.value)
            }
            className={`w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              addressErrors.vilAreaTownBn
                ? "border-red-500 dark:border-red-400"
                : ""
            }`}
            placeholder="গ্রাম/পাড়া/মহল্লার নাম বাংলায়"
            rows={3}
            required
          />
          {addressErrors.vilAreaTownBn && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {addressErrors.vilAreaTownBn}
            </p>
          )}
        </div>

        {/* গ্রাম / পাড়া / মহল্লা (ইংরেজি) */}
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            গ্রাম / পাড়া / মহল্লা (ইংরেজি) *
          </label>
          <textarea
            value={addressInputs.vilAreaTownEn}
            onChange={(e) =>
              handleAddressInputChange("vilAreaTownEn", e.target.value)
            }
            className={`w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              addressErrors.vilAreaTownEn
                ? "border-red-500 dark:border-red-400"
                : ""
            }`}
            placeholder="Village/Area/Town in English"
            rows={3}
            required
          />
          {addressErrors.vilAreaTownEn && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {addressErrors.vilAreaTownEn}
            </p>
          )}
        </div>

        {/* বাসা ও সড়ক (নাম, নম্বর) */}
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            বাসা ও সড়ক (নাম, নম্বর)
          </label>
          <textarea
            value={addressInputs.houseRoadBn}
            onChange={(e) =>
              handleAddressInputChange("houseRoadBn", e.target.value)
            }
            className={`w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              addressErrors.houseRoadBn
                ? "border-red-500 dark:border-red-400"
                : ""
            }`}
            placeholder="বাসা ও সড়কের বিবরণ বাংলায়"
            rows={3}
          />
          {addressErrors.houseRoadBn && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {addressErrors.houseRoadBn}
            </p>
          )}
        </div>

        {/* বাসা ও সড়ক (নাম, নম্বর) (ইংরেজি) */}
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            বাসা ও সড়ক (নাম, নম্বর) (ইংরেজি)
          </label>
          <textarea
            value={addressInputs.houseRoadEn}
            onChange={(e) =>
              handleAddressInputChange("houseRoadEn", e.target.value)
            }
            className={`w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              addressErrors.houseRoadEn
                ? "border-red-500 dark:border-red-400"
                : ""
            }`}
            placeholder="House and Road details in English"
            rows={3}
          />
          {addressErrors.houseRoadEn && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">
              {addressErrors.houseRoadEn}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        * চিহ্নিত ফিল্ডগুলি আবশ্যক (বাসা ও সড়ক ছাড়া)
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      {renderSelect(
        "country",
        "দেশ *",
        selected.country,
        countriesList,
        false,
        handleCountry,
        refs.country as React.RefObject<HTMLSelectElement>,
        false
      )}

      {/* Bangladesh Specific Geographic Selectors */}
      {selected.country === "1" && (
        <>
          {renderSelect(
            "division",
            "বিভাগ *",
            selected.division,
            options.division,
            loading.division,
            handleDivision,
            refs.division as React.RefObject<HTMLSelectElement>
          )}

          {selected.division &&
            renderSelect(
              "district",
              "জেলা *",
              selected.district,
              options.district,
              loading.district,
              handleDistrict,
              refs.district as React.RefObject<HTMLSelectElement>
            )}

          {selected.district &&
            renderSelect(
              "upazila",
              "উপজেলা/সিটি কর্পোরেশন *",
              selected.upazila,
              options.upazila,
              loading.upazila,
              handleUpazila,
              refs.upazila as React.RefObject<HTMLSelectElement>
            )}

          {selected.upazila && (
            <>
              <label className="block font-medium text-gray-700 dark:text-gray-300">
                ইউনিয়ন / পৌরসভা / ক্যান্টনমেন্ট *
              </label>
              <select
                id="union"
                ref={refs.union}
                value={selected.union}
                onChange={handleUnion}
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="-1">-- নির্বাচন করুন --</option>
                {options.union.map((loc, index) => {
                  const nextOrder = "4";
                  let nextType = "5";
                  let curType = "3";
                  if (loc.geoLevelId === 8) {
                    nextType = "9";
                    curType = "8";
                  } else if (loc.geoLevelId === 7) {
                    nextType = "6";
                    curType = "7";
                  }
                  return (
                    <option
                      key={`union-${loc.id}-${index}`}
                      value={loc.id}
                      data-next-order={nextOrder}
                      data-next-type={nextType}
                      data-current-type={curType}
                    >
                      {loc.nameBn}
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

          {selected.union && (
            <>
              {renderSelect(
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
        </>
      )}

      {/* Address Input Fields for all countries */}
      {(selected.country === "1" ||
        (selected.country &&
          selected.country !== "1" &&
          selected.country !== "-1")) &&
        renderAddressInputs()}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={apply}
          className="rounded cursor-pointer bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          প্রয়োগ করুন
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN FORM COMPONENT
  
   ──────────────────────────────────────────────────────────────────────────── */

interface IData {
  cookies: string[];
  url: string;
  csrf: string;
  serviceCost: number;
  captcha: { src: string };
}

// Validation functions
const validateBanglaText = (
  id: string,
  value: string,
  updateCorrectionInfo: UpdateCorrectionInfo
): void => {
  const banglaRegex = /^[\u0980-\u09FF\s]+$/;
  if (value && !banglaRegex.test(value)) {
    updateCorrectionInfo(id, "error", "শুধুমাত্র বাংলা অক্ষর অনুমোদিত");
  } else {
    updateCorrectionInfo(id, "error", "");
  }
};

const validateEnglishText = (
  id: string,
  value: string,
  updateCorrectionInfo: UpdateCorrectionInfo
): void => {
  const englishRegex = /^[A-Za-z\s]+$/;
  if (value && !englishRegex.test(value)) {
    updateCorrectionInfo(id, "error", "Only English letters are allowed");
  } else {
    updateCorrectionInfo(id, "error", "");
  }
};

const validateBirthDate = (
  id: string,
  value: string,
  updateCorrectionInfo: UpdateCorrectionInfo
): void => {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (value && !dateRegex.test(value)) {
    updateCorrectionInfo(id, "error", "Date must be in DD/MM/YYYY format");
    return;
  }

  // Additional date validation
  if (value) {
    const [day, month, year] = value.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      updateCorrectionInfo(id, "error", "Please enter a valid date");
    } else {
      updateCorrectionInfo(id, "error", "");
    }
  } else {
    updateCorrectionInfo(id, "error", "");
  }
};

const validateNID = (
  id: string,
  value: string,
  updateCorrectionInfo: UpdateCorrectionInfo
): void => {
  const nidRegex = /^\d+$/;
  if (value && !nidRegex.test(value)) {
    updateCorrectionInfo(id, "error", "NID must contain only numbers");
  } else if (
    value &&
    value.length !== 10 &&
    value.length !== 13 &&
    value.length !== 17
  ) {
    updateCorrectionInfo(id, "error", "NID must be 10, 13, or 17 digits");
  } else {
    updateCorrectionInfo(id, "error", "");
  }
};

const validatePassport = (
  id: string,
  value: string,
  updateCorrectionInfo: UpdateCorrectionInfo
): void => {
  const passportRegex = /^[A-Z0-9<]+$/;
  if (value && !passportRegex.test(value)) {
    updateCorrectionInfo(
      id,
      "error",
      "Only capital English letters, numbers and < symbol are allowed"
    );
  } else {
    updateCorrectionInfo(id, "error", "");
  }
};

export default function BirthCorrectionForm() {
  /* ── Basic states ─────────────────────────────────────────────────────── */
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [correctionInfos, setCorrectionInfos] = useState<CorrectionInfo[]>([
    { id: "1", key: "", value: "", cause: "2" },
  ]);

  const [data, setData] = useState<IData>({
    cookies: [],
    url: "",
    csrf: "",
    serviceCost: 0,
    captcha: { src: "" },
  });
  const router = useRouter();
  // Enhanced address states with better initialization
  const [addresses, setAddresses] = useState<{
    birthPlace: Address;
    permAddress: Address;
    prsntAddress: Address;
  }>({
    birthPlace: createEmptyAddress(),
    permAddress: createEmptyAddress(),
    prsntAddress: createEmptyAddress(),
  });

  const [formData, setFormData] = useState({
    ubrn: "",
    dob: "",
    captcha: "",
    relationWithApplicant: "SELF",
    applicantName: "",
    email: "",
    phone: "",
    otp: "",
    copyBirthPlaceToPermAddr: false,
    copyPermAddrToPrsntAddr: false,
  });

  const [birthRecord, setBirthRecord] = useState<BirthRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<
    { file: File; fileTypeId: string }[]
  >([]);
  const [fileTypes] = useState<FileType[]>([
    { id: "1", name: "পিতার জন্ম নিবন্ধন সনদ" },
    { id: "2", name: "মাতার জন্ম নিবন্ধন সনদ" },
    { id: "3", name: "পিতার জাতীয় পরিচয়পত্র" },
    { id: "4", name: "মাতার জাতীয় পরিচয়পত্র" },
    { id: "5", name: "ই পি আই কার্ড" },
    { id: "6", name: "স্থায়ী ঠিকানার প্রমাণ" },
    { id: "7", name: "বর্তমান ঠিকানার প্রমাণ" },
    { id: "8", name: "পিতার পাসপোর্টের স্ক্যান করা কপি" },
    { id: "9", name: "মাতার পাসপোর্টের স্ক্যান করা কপি" },
    { id: "10", name: "পিতার পাসপোর্ট সাইজের ছবি" },
    { id: "11", name: "মাতার পাসপোর্ট সাইজের ছবি" },
    { id: "12", name: "নিবন্ধনাধীন ব্যক্তির পাসপোর্ট সাইজের ছবি" },
    {
      id: "13",
      name: "নিবন্ধনাধীন ব্যক্তির এস এস সি সার্টিফিকেটের স্ক্যান করা কপি",
    },
    { id: "14", name: "পিতার মৃত্যুর প্রমাণ" },
    { id: "15", name: "মাতার মৃত্যুর প্রমাণ" },
    { id: "16", name: "নিবন্ধনাধীন ব্যাক্তির জাতীয় পরিচয়পত্র" },
    { id: "44", name: "ইস্যু সম্পর্কিত ফাইল" },
    { id: "17", name: "প্রাথমিক স্কুল সার্টিফিকেট (পিএসসি)" },
    { id: "45", name: "অঙ্গীকারনামা" },
    { id: "46", name: "নিবন্ধকের প্রত্যয়নপত্র" },
    { id: "47", name: "হাতে লিখা বইয়ের সংশ্লিষ্ট পৃষ্ঠার সত্যায়িত কপি" },
    { id: "18", name: "জুনিয়র স্কুল সার্টিফিকেট (জেএসসি)" },
    { id: "48", name: "হাতে লিখা সনদের কপি" },
    {
      id: "20",
      name: "চিকিৎসা প্রতিষ্ঠানের ছাড়পত্র বা চিকিৎসা প্রতিষ্ঠান প্রদত্ত জন্ম সংক্রান্ত সনদের সত্যায়িত কপি বা পূরণকৃ্ত আবেদনপত্রে বার্থ এটেন্ডের এর প্রত্যায়ন বা ইপিআই কার্ডের সত্যায়িত অনুলিপি",
    },
    {
      id: "21",
      name: "পিতা / মাতা/ পিতামহ / পিতামহীর দ্বারা স্বনামে স্থায়ী ঠিকানা হিসেবে ঘোষিত আবাস স্থলের বিপরীতে হালনাগাদ কর পরিশোধের প্রমানপত্র বা পিতা / মাতা/ পিতামহ / পিতামহীর জাতীয় পরিচয়পত্র বা পাসপোর্ট ঘোষিত স্থায়ী ঠিকানা বা জমি অথবা বাড়ি ক্রয়ের দলিল , খাজনা ও কর পরিশোধ রশিদ। (নদীভাঙ্গন অন্য কোন কারনে স্থায়ী ঠিকানা বিলুপ্ত হলে)",
    },
    {
      id: "22",
      name: "জন্ম নিবন্ধনাধীন ব্যক্তির পিতার জন্ম নিবন্ধন নম্বরসহ সনদ",
    },
    {
      id: "23",
      name: "জন্ম নিবন্ধনাধীন ব্যক্তির মাতার জন্ম নিবন্ধন নম্বরসহ সনদ",
    },
    {
      id: "30",
      name: "চিকিৎসা প্রতিষ্ঠানের ছাড়পত্র বা চিকিৎসা প্রতিষ্ঠান প্রদত্ত জন্ম সংক্রান্ত সনদের সত্যায়িত কপি বা পূরণকৃ্ত আবেদনপত্রে বার্থ এটেন্ডের এর প্রত্যায়ন বা ইপিআই কার্ডের সত্যায়িত অনুলিপি ।",
    },
    {
      id: "31",
      name: "পিতা / মাতা/ পিতামহ / পিতামহীর দ্বারা স্বনামে স্থায়ী ঠিকানা হিসেবে ঘোষিত আবাস স্থলের বিপরীতে হালনাগাদ কর পরিশোধের প্রমানপত্র বা পিতা / মাতা/ পিতামহ / পিতামহীর জাতীয় পরিচয়পত্র বা পাসপোর্ট ঘোষিত স্থায়ী ঠিকানা বা জমি অথবা বাড়ি ক্রয়ের দলিল , খাজনা ও কর পরিশোধ রশিদ। (নদীভাঙ্গন অন্য কোন কারনে স্থায়ী ঠিকানা বিলুপ্ত হলে)",
    },
    {
      id: "32",
      name: "জন্ম নিবন্ধনাধীন ব্যক্তির পিতার জন্ম নিবন্ধন নম্বরসহ সনদ",
    },
    {
      id: "33",
      name: "জন্ম নিবন্ধনাধীন ব্যক্তির মাতার জন্ম নিবন্ধন নম্বরসহ সনদ",
    },
    {
      id: "40",
      name: "চিকিৎসক কর্তৃক প্রত্যায়ন পত্র (বাংলাদেশ মেডিক্যাল এন্ড ডেন্টাল কাউন্সিল কর্তৃক স্বীকৃত এমবিবিএস বা তদূর্ধ্ব ডিগ্রিধারী) বা সরকার কর্তৃক পরিচালিত প্রথমিক শিক্ষা সমাপনী, জুনিয়র স্কুল সার্টিফিকেট এবং শিক্ষা বোর্ড কর্তৃক পরিচালিত মাধ্যমিক স্কুল সার্টিফিকেট",
    },
    {
      id: "41",
      name: "পিতা / মাতা/ পিতামহ / পিতামহীর দ্বারা স্বনামে স্থায়ী ঠিকানা হিসেবে ঘোষিত আবাস স্থলের বিপরীতে হালনাগাদ কর পরিশোধের প্রমানপত্র বা পিতা / মাতা/ পিতামহ / পিতামহীর জাতীয় পরিচয়পত্র বা পাসপোর্ট ঘোষিত স্থায়ী ঠিকানা বা জমি অথবা বাড়ি ক্রয়ের দলিল , খাজনা ও কর পরিশোধ রশিদ। (নদীভাঙ্গন অন্য কোন কারনে স্থায়ী ঠিকানা বিলুপ্ত হলে)",
    },
    {
      id: "42",
      name: "জন্ম নিবন্ধনাধীন ব্যক্তির পিতার জন্ম নিবন্ধন নম্বরসহ সনদ",
    },
    {
      id: "43",
      name: "জন্ম নিবন্ধনাধীন ব্যক্তির মাতার জন্ম নিবন্ধন নম্বরসহ সনদ",
    },
  ]);
  const [currectionList] = useState<FileType[]>([
    {
      id: "personBirthDate",
      name: "জন্ম তারিখ (খ্রিঃ)",
    },
    {
      id: "thChild",
      name: "পিতা ও মাতার কততম সন্তান",
    },
    {
      id: "gender",
      name: "লিঙ্গ",
    },
    {
      id: "fatherNameBn",
      name: "পিতার নাম (বাংলা)",
    },
    {
      id: "motherNameBn",
      name: "মাতার নাম (বাংলা)",
    },
    {
      id: "fatherNameEn",
      name: "পিতার নাম (ইংরেজি)",
    },
    {
      id: "motherNameEn",
      name: "মাতার নাম (ইংরেজি)",
    },
    {
      id: "personFirstNameBn",
      name: "নামের প্রথম অংশ বাংলায়",
    },
    {
      id: "personLastNameBn",
      name: "নামের শেষ অংশ বাংলায়",
    },
    {
      id: "personFirstNameEn",
      name: "নামের প্রথম অংশ ইংরেজি",
    },
    {
      id: "personLastNameEn",
      name: "নামের শেষ অংশ ইংরেজি",
    },
    {
      id: "personNationality",
      name: "জাতীয়তা",
    },
    {
      id: "personNid",
      name: "এন আই ডি",
    },
    {
      id: "passportNumber",
      name: "পাসপোর্ট নাম্বার",
    },
    {
      id: "fatherNationality",
      name: "পিতার জাতীয়তা",
    },
    {
      id: "motherNationality",
      name: "মাতার জাতীয়তা",
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  /* ── OTP Countdown Timer ───────────────────────────────────────────────── */
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0 && isOtpSent) {
      setIsOtpSent(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpCountdown, isOtpSent]);

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  /* ── Address modal ─────────────────────────────────────────────────────── */
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [currentAddressType, setCurrentAddressType] = useState<
    "birthPlace" | "permAddress" | "prsntAddress"
  >("birthPlace");

  // Helper function to create empty address
  function createEmptyAddress(): Address {
    return {
      country: "-1", // Default to "select country"
      geoId: "",
      division: "-1",
      divisionName: "",
      district: "-1",
      districtName: "",
      cityCorpCantOrUpazila: "-1",
      upazilaName: "",
      paurasavaOrUnion: "-1",
      unionName: "",
      postOfc: "",
      postOfcEn: "",
      vilAreaTownBn: "",
      vilAreaTownEn: "",
      houseRoadBn: "",
      houseRoadEn: "",
      ward: "-1",
      wardName: "",
    };
  }

  // Enhanced address modal handlers
  const openAddressModal = (type: typeof currentAddressType) => {
    setCurrentAddressType(type);
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
  };

  const applyAddressFromSelector = (addr: Address) => {
    setAddresses((prev) => ({
      ...prev,
      [currentAddressType]: addr,
    }));
    toast.success("ঠিকানা সফলভাবে প্রয়োগ করা হয়েছে");
    closeAddressModal();
  };

  // Handle checkbox changes with proper sequence: Birth Place → Permanent Address → Present Address
  const handleCheckboxChange = (
    field: keyof typeof formData,
    checked: boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));

    if (checked) {
      if (field === "copyBirthPlaceToPermAddr") {
        // Copy from birthPlace to permAddress
        setAddresses((prev) => ({
          ...prev,
          permAddress: { ...prev.birthPlace },
        }));
        toast.success("জন্মস্থানের ঠিকানা স্থায়ী ঠিকানায় কপি করা হয়েছে");

        // If perm address to present address is already checked, also update present address
        if (formData.copyPermAddrToPrsntAddr) {
          setAddresses((prev) => ({
            ...prev,
            prsntAddress: { ...prev.birthPlace },
          }));
        }
      } else if (field === "copyPermAddrToPrsntAddr") {
        // Copy from permAddress to prsntAddress
        setAddresses((prev) => ({
          ...prev,
          prsntAddress: { ...prev.permAddress },
        }));
        toast.success("স্থায়ী ঠিকানা বর্তমান ঠিকানায় কপি করা হয়েছে");
      }
    } else {
      // Remove address when unchecked
      if (field === "copyBirthPlaceToPermAddr") {
        setAddresses((prev) => ({
          ...prev,
          permAddress: createEmptyAddress(),
        }));
        toast.success("স্থায়ী ঠিকানা সরানো হয়েছে");

        // Also uncheck and clear present address if it was dependent
        if (formData.copyPermAddrToPrsntAddr) {
          setFormData((prev) => ({ ...prev, copyPermAddrToPrsntAddr: false }));
          setAddresses((prev) => ({
            ...prev,
            prsntAddress: createEmptyAddress(),
          }));
        }
      } else if (field === "copyPermAddrToPrsntAddr") {
        setAddresses((prev) => ({
          ...prev,
          prsntAddress: createEmptyAddress(),
        }));
        toast.success("বর্তমান ঠিকানা সরানো হয়েছে");
      }
    }
  };

  // Clear address function for all address types
  const clearAddress = (type: keyof typeof addresses) => {
    setAddresses((prev) => ({
      ...prev,
      [type]: createEmptyAddress(),
    }));
    toast.success(`${getAddressTypeLabel(type)} সাফ করা হয়েছে`);

    // Also uncheck checkboxes if clearing addresses
    if (type === "permAddress") {
      setFormData((prev) => ({ ...prev, copyBirthPlaceToPermAddr: false }));
      // Also uncheck present address if it was dependent on permanent address
      if (formData.copyPermAddrToPrsntAddr) {
        setFormData((prev) => ({ ...prev, copyPermAddrToPrsntAddr: false }));
      }
    } else if (type === "prsntAddress") {
      setFormData((prev) => ({ ...prev, copyPermAddrToPrsntAddr: false }));
    }
  };

  const getAddressTypeLabel = (type: keyof typeof addresses): string => {
    const labels = {
      birthPlace: "জন্মস্থানের ঠিকানা",
      permAddress: "স্থায়ী ঠিকানা",
      prsntAddress: "বর্তমান ঠিকানা",
    };
    return labels[type];
  };

  const getCountryName = (countryCode: string): string => {
    const country = countriesList.find((c) => c.id === countryCode);
    return country?.nameBn || "নির্বাচন করা হয়নি";
  };

  // Enhanced address display component with clear button
  const AddressDisplay = ({
    address,
    type,
    onEdit,
  }: {
    address: Address;
    type: keyof typeof addresses;
    onEdit: () => void;
  }) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
          {getAddressTypeLabel(type)}
        </h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            সম্পাদনা
          </button>
          <button
            type="button"
            onClick={() => clearAddress(type)}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            সাফ করুন
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div className="md:col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            দেশ:
          </span>{" "}
          <span className="text-gray-900 dark:text-gray-100">
            {getCountryName(address.country)}
          </span>
        </div>

        {address.country === "1" && (
          <>
            {address.divisionName && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  বিভাগ:
                </span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {address.divisionName}
                </span>
              </div>
            )}
            {address.districtName && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  জেলা:
                </span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {address.districtName}
                </span>
              </div>
            )}
            {address.upazilaName && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  উপজেলা:
                </span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {address.upazilaName}
                </span>
              </div>
            )}
            {address.unionName && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  ইউনিয়ন:
                </span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {address.unionName}
                </span>
              </div>
            )}
            {address.wardName && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  ওয়ার্ড:
                </span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {address.wardName}
                </span>
              </div>
            )}
          </>
        )}

        {address.postOfc && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              ডাকঘর:
            </span>{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {address.postOfc}
            </span>
          </div>
        )}

        {address.vilAreaTownBn && (
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              গ্রাম/পাড়া:
            </span>{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {address.vilAreaTownBn}
            </span>
          </div>
        )}

        {address.houseRoadBn && (
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              বাসা ও সড়ক:
            </span>{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {address.houseRoadBn}
            </span>
          </div>
        )}

        {address.country === "-1" && (
          <div className="md:col-span-2 text-gray-500 dark:text-gray-400">
            ঠিকানা নির্বাচন করা হয়নি
          </div>
        )}
      </div>
    </div>
  );

  // Enhanced UBRN search with address pre-fill
  const searchByUbrn = async () => {
    if (!formData.ubrn || !formData.dob || !formData.captcha) {
      toast.error("সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("অনুসন্ধান করা হচ্ছে...");

    try {
      const res = await fetch(
        "/api/birth/application/correction/get-data-by-ubrn",
        {
          method: "POST",
          body: JSON.stringify({
            ubrn: formData.ubrn,
            dob: formData.dob,
            captcha: formData.captcha,
            data,
          }),
        }
      );
      const userData = await res.json();
      setBirthRecord(userData.data);

      if (userData.success === false) {
        toast.error(userData.error.message);
        return;
      }

      // Pre-fill addresses from API response if available
      if (userData.data) {
        const newAddresses = { ...addresses };

        if (userData.data.birthAddress) {
          newAddresses.birthPlace = {
            ...createEmptyAddress(),
            ...userData.data.birthAddress,
          };
        }

        if (userData.data.permAddress) {
          newAddresses.permAddress = {
            ...createEmptyAddress(),
            ...userData.data.permAddress,
          };
        }

        if (userData.data.prsntAddress) {
          newAddresses.prsntAddress = {
            ...createEmptyAddress(),
            ...userData.data.prsntAddress,
          };
        }

        setAddresses(newAddresses);
      }

      toast.success("তথ্য পাওয়া গেছে এবং ঠিকানা লোড করা হয়েছে");
    } catch (e) {
      toast.error("অনুসন্ধান ব্যর্থ");
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  /* ── File upload helpers (mock) ──────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processSelectedFiles(files);
  };

  const processSelectedFiles = (files: File[]) => {
    const valid = files.filter(
      (f) =>
        ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
          f.type
        ) && f.size <= 2 * 1024 * 1024
    );

    if (files.length !== valid.length) {
      toast.error("কিছু ফাইল অবৈধ (শুধুমাত্র JPG, PNG, PDF এবং সর্বোচ্চ 2MB)");
    }

    if (valid.length > 0) {
      setUploadingFiles((p) => [
        ...p,
        ...valid.map((f) => ({ file: f, fileTypeId: "-1" })),
      ]);
      toast.success(`${valid.length} টি ফাইল নির্বাচন করা হয়েছে`);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    processSelectedFiles(files);
  };

  const updateUploadingFileType = (idx: number, typeId: string) => {
    setUploadingFiles((p) =>
      p.map((it, i) => (i === idx ? { ...it, fileTypeId: typeId } : it))
    );
  };

  const removeUploadingFile = (idx: number) =>
    setUploadingFiles((p) => p.filter((_, i) => i !== idx));

  const uploadFile = async (file: File, typeId: string) => {
    const formData = new FormData();
    formData.append("attachmentType", typeId);
    formData.append("attachmentSubType", "-1");
    formData.append("files", file, file.name);
    formData.append("csrf", data.csrf);
    formData.append("cookies", data.cookies.join("; "));

    const loadingToast = toast.loading(`ফাইল আপলোড হচ্ছে: ${file.name}`);

    try {
      const res = await fetch("/api/birth/application/correction/upload_doc", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      toast.dismiss(loadingToast);
      toast.success(`ফাইল আপলোড সফল: ${file.name}`);

      return {
        id: data.data[0].id,
        name: file.name,
        url: data.data[0].url,
        deleteUrl: data.data[0].deleteUrl,
        attachmentTypeId: typeId,
        fileType: fileTypes.find((t) => t.id === typeId)?.name,
      };
    } catch (error) {
      toast.dismiss(loadingToast);
      const errMsg =
        error instanceof Error ? error.message : "অনুসন্ধান ব্যর্থ";
      toast.error(`ফাইল আপলোড ব্যর্থ: ${errMsg}`);
    }
  };

  const handleFileUpload = async (idx: number) => {
    const item = uploadingFiles[idx];
    if (!item || item.fileTypeId === "-1") {
      toast.error("ফাইল টাইপ নির্বাচন করুন");
      return;
    }
    try {
      const uploaded = await uploadFile(item.file, item.fileTypeId);
      if (!uploaded) return;
      setUploadedFiles((p) => [...p, uploaded]);
      setUploadingFiles((p) => p.filter((_, i) => i !== idx));
    } catch (error) {
      console.log(error);
      toast.error("ফাইল আপলোড ব্যর্থ");
    }
  };

  /* ── Correction helpers ──────────────────────────────────────────────── */
  const addCorrectionInfo = () => {
    if (correctionInfos.length < 20) {
      setCorrectionInfos((p) => [
        ...p,
        { id: Date.now().toString(), key: "", value: "", cause: "" },
      ]);
      toast.success("নতুন সংশোধিত তথ্য যোগ করা হয়েছে");
    } else {
      toast.error("সর্বোচ্চ ২০ টি সংশোধিত তথ্য যোগ করা যাবে");
    }
  };

  const removeCorrectionInfo = (id: string) => {
    if (correctionInfos.length > 0) {
      setCorrectionInfos((p) => p.filter((i) => i.id !== id));
      toast.success("সংশোধিত তথ্য মুছে ফেলা হয়েছে");
    }
  };

  const updateCorrectionInfo = (
    id: string,
    field: keyof CorrectionInfo,
    value: string
  ) => {
    setCorrectionInfos((p) =>
      p.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  /* ── Input change ─────────────────────────────────────────────────────── */
  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    if (
      field === "copyBirthPlaceToPermAddr" ||
      field === "copyPermAddrToPrsntAddr"
    ) {
      handleCheckboxChange(field, value as boolean);
    } else {
      setFormData((p) => ({ ...p, [field]: value }));
    }
  };

  /* ── Submit ───────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthRecord) {
      toast.error("প্রথমে UBRN অনুসন্ধান করুন");
      return;
    }
    if (!formData.otp) {
      toast.error("OTP যাচাই করুন");
      return;
    }
    if (!formData.phone) {
      toast.error("দয়া করে মোবাইল নম্বর পূরণ করুন");
      return;
    }

    setIsLoading(true);
    toast.loading("আবেদন জমা হচ্ছে...", {
      id: "submission",
    });

    // Prepare data for API submission
    const submissionData = {
      ubrn: formData.ubrn,
      dob: birthRecord.personDob,
      correctionInfos,
      addresses: addresses,
      applicantInfo: {
        name: birthRecord.personNameBn || birthRecord.personNameEn,
        officeId: birthRecord.officeId,
        email: formData.email,
        phone: `+88${formData.phone}`,
        relationWithApplicant: formData.relationWithApplicant,
      },
      files: uploadedFiles,
      otp: formData.otp,
      captcha: formData.captcha,
      csrf: data.csrf,
      cookies: data.cookies,
      isPermAddressIsSameAsBirthPlace: formData.copyBirthPlaceToPermAddr,
      isPrsntAddressIsSameAsPermAddress: formData.copyPermAddrToPrsntAddr,
    };

    try {
      const response = await fetch(
        "/api/birth/application/correction/otp-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personUbrn: formData.ubrn,
            cookies: submissionData.cookies,
            csrf: submissionData.csrf,
            otp: submissionData.otp,
            email: submissionData.applicantInfo.email,
            phone: submissionData.applicantInfo.phone,
          }),
        }
      );
      const respData = await response.json();
      if (respData.data.isVerified !== true) {
        toast.error("OTP যাচাই ব্যর্থ হয়েছে", { id: "submission" });
        return;
      }

      try {
        const resp = await fetch("/api/birth/application/correction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });
        const data = await resp.json();
        if (!data._id) {
          toast.error(data.message || data.error.message, { id: "submission" });
          return;
        }

        toast.success("আবেদন সফলভাবে জমা হয়েছে", { id: "submission" });
        router.push(`/birth/application/correction/view/${data._id}`);
      } catch (error) {
        toast.error("আবেদন জমা করতে সমস্যা হয়েছে", { id: "submission" });
      }
    } catch (error) {
      console.log(error);
      toast.error("আবেদন জমা করতে সমস্যা হয়েছে", { id: "submission" });
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async () => {
    try {
      if (!birthRecord?.personNameBn || !formData.ubrn) {
        toast.error("প্রথমে UBRN অনুসন্ধান করুন");
        return;
      }

      function validateMobile(mobile: string) {
        const regex = /^01[0-9]{9}$/; // total 11 digits
        return regex.test(mobile);
      }

      if (!validateMobile(formData.phone)) {
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

      const submissionData = {
        ubrn: formData.ubrn,
        dob: birthRecord.personDob,
        correctionInfos,
        addresses: addresses,
        applicantInfo: {
          name: birthRecord.personNameBn || birthRecord.personNameEn,
          officeId: birthRecord.officeId,
          email: formData.email,
          phone: `+88${formData.phone}`,
          relationWithApplicant: formData.relationWithApplicant,
        },
        files: uploadedFiles,
        captcha: formData.captcha,
        csrf: data.csrf,
        cookies: data.cookies,
        isPermAddressIsSameAsBirthPlace: formData.copyBirthPlaceToPermAddr,
        isPrsntAddressIsSameAsPermAddress: formData.copyPermAddrToPrsntAddr,
      };

      toast.loading("OTP পাঠানো হচ্ছে...", { id: "otp" });

      const resp = await fetch("/api/birth/application/correction/is-valid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const res = await resp.json();
      if (res.success !== true) {
        toast.error(res.error.message || res.message, { id: "otp" });
        return;
      }

      const response = await fetch("/api/birth/application/correction/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: `+88${formData.phone}`,
          personUbrn: formData.ubrn,
          applicantName: birthRecord?.personNameBn,
          relation: "SELF",
          email: formData.email || "",
          csrf: data.csrf,
          cookies: data.cookies,
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        // Start 10-minute countdown (600 seconds)
        setOtpCountdown(600); // 10 minutes in seconds
        setIsOtpSent(true);

        toast.success("OTP সফলভাবে পাঠানো হয়েছে", { id: "otp" });
      } else {
        toast.error(resData.error.message || "OTP পাঠাতে সমস্যা হয়েছে", {
          id: "otp",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("OTP পাঠাতে সমস্যা হয়েছে");
    }
  };

  const sessionReload = async () => {
    try {
      toast.loading("সেশন রিলোড হচ্ছে...", { id: "sessionReload" });
      const response = await fetch("/api/birth/application/correction");

      if (response.ok) {
        const newData = await response.json();
        setData(newData);
        handleInputChange("captcha", "");
        toast.success("সেশন রিলোড সফলভাবে হয়েছে", { id: "sessionReload" });
      } else {
        toast.error("সেশন রিলোড করতে সমস্যা হয়েছে", { id: "sessionReload" }); //
      }
    } catch (error) {
      console.log(error);
      toast.error("সেশন রিলোড করতে সমস্যা হয়েছে", { id: "sessionReload" });
    }
  };

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        await sessionReload();
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <SimpleUnicodeLoader />;

  const formatBdt = (amount: number) => {
    return amount.toLocaleString("bn-BD", {
      style: "currency",
      currency: "BDT",
    });
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              জন্ম তথ্য সংশোধনের জন্য আবেদন
            </h1>
            <p className="text-red-600 text-center pb-2">প্রতি আবেদনে {formatBdt(data.serviceCost)} টাকা করে কাটা হবে</p>
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  ১
                </div>
                <div
                  className={`w-24 h-1 ${
                    currentStep >= 2
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= 2
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  ২
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      জন্ম নিবন্ধন নম্বর *
                    </label>
                    <input
                      type="text"
                      value={formData.ubrn}
                      onChange={(e) =>
                        handleInputChange("ubrn", e.target.value)
                      }
                      placeholder="UBRN"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      জন্ম তারিখ *
                    </label>
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ক্যাপচা *
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                    {/* Captcha & Reload */}
                    <div className="flex items-center justify-between sm:justify-start bg-gray-200 dark:bg-gray-700 p-3 rounded-lg w-full sm:w-auto">
                      {data.captcha?.src && (
                        <img
                          src={data.captcha.src}
                          alt="Captcha"
                          className="h-14 w-auto max-w-4/5 object-contain rounded-md border border-gray-300 dark:border-gray-600"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => sessionReload()}
                        className="ml-3 p-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition"
                        title="Reload Captcha"
                      >
                        🔄
                      </button>
                    </div>

                    {/* Input Field */}
                    <input
                      type="text"
                      value={formData.captcha}
                      onChange={(e) =>
                        handleInputChange("captcha", e.target.value)
                      }
                      className="flex-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="ক্যাপচা লিখুন"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={searchByUbrn}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {isLoading ? "অনুসন্ধান..." : "অনুসন্ধান"}
                  </button>
                </div>

                {birthRecord && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                      অনুসন্ধান ফলাফল
                    </h3>
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-green-800 dark:text-green-400">
                          তথ্য পাওয়া গেছে!
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded border dark:border-gray-700">
                          <div className="text-gray-900 dark:text-gray-100">
                            <strong>নাম (বাংলা):</strong>{" "}
                            {birthRecord.personNameBn}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            <strong>নাম (ইংরেজি):</strong>{" "}
                            {birthRecord.personNameEn}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            <strong>জন্ম তারিখ:</strong> {birthRecord.personDob}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            <strong>UBRN:</strong> {birthRecord.ubrn}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded border dark:border-gray-700">
                          <div className="text-gray-900 dark:text-gray-100">
                            <strong>পিতার নাম (বাংলা):</strong>{" "}
                            {birthRecord.fatherNameBn}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            <strong>মাতার নাম (বাংলা):</strong>{" "}
                            {birthRecord.motherNameBn}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded border dark:border-gray-700 md:col-span-2">
                          <div className="text-gray-900 dark:text-gray-100">
                            <strong>অফিস:</strong> {birthRecord.officeAddressBn}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                        >
                          তথ্য সঠিক, পরবর্তী ধাপ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
            {currentStep === 2 && birthRecord && (
              <div className="space-y-6">
                {/* ---------- User Information Summary ---------- */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-400">
                    নির্বাচিত ব্যক্তির তথ্য
                  </h3>
                  <div className="w-full text-center">
                    <h2 className="font-bold pb-2 text-gray-800 dark:text-white">
                      {birthRecord.officeAddressBn}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          নাম (বাংলা):
                        </div>
                        <div className="text-gray-900 dark:text-gray-100">
                          {birthRecord.personNameBn}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          নাম (ইংরেজি):
                        </div>
                        <div className="text-gray-900 dark:text-gray-100">
                          {birthRecord.personNameEn}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          জন্ম তারিখ:
                        </div>
                        <div className="text-gray-900 dark:text-gray-100">
                          {birthRecord.personDob}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          UBRN:
                        </div>
                        <div className="text-gray-900 dark:text-gray-100">
                          {birthRecord.ubrn}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---------- Correction Infos ---------- */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                    সংশোধিত তথ্য নির্বাচন *
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    কমপক্ষে একটি সংশোধিত তথ্য যোগ করুন
                  </p>
                  {correctionInfos.map((info) => (
                    <div
                      key={info.id}
                      className="bg-white dark:bg-gray-700 p-4 rounded border dark:border-gray-600 mb-4"
                    >
                      <div>
                        <select
                          value={info.key}
                          onChange={(e) =>
                            updateCorrectionInfo(info.id, "key", e.target.value)
                          }
                          className="px-3 py-2 border rounded w-full my-4 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          required
                        >
                          <option value="">---নির্বাচন করুন---</option>
                          {currectionList
                            .filter(
                              (c) =>
                                correctionInfos.length === 1 ||
                                !correctionInfos.some(
                                  (otherInfo) =>
                                    otherInfo.id !== info.id &&
                                    otherInfo.key === c.id
                                )
                            )
                            .map((c) => {
                              return (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              );
                            })}
                        </select>

                        {info.key === "gender" && (
                          <select
                            value={info.value}
                            onChange={(e) =>
                              updateCorrectionInfo(
                                info.id,
                                "value",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border rounded w-full mb-4 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            required
                          >
                            <option value="">---লিঙ্গ নির্বাচন করুন---</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="THIRD_GENDER">Third Gender</option>
                          </select>
                        )}

                        {info.key === "thChild" && (
                          <select
                            value={info.value}
                            onChange={(e) =>
                              updateCorrectionInfo(
                                info.id,
                                "value",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border rounded w-full mb-4 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            required
                          >
                            <option value="">---নির্বাচন করুন---</option>
                            {[...Array(20).keys()].map((i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        )}

                        {info.key === "personNationality" && (
                          <select
                            value={info.value}
                            onChange={(e) =>
                              updateCorrectionInfo(
                                info.id,
                                "value",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border rounded w-full mb-4 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            required
                          >
                            {nationalityOptions.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.value}
                              </option>
                            ))}
                          </select>
                        )}

                        {info.key === "fatherNationality" && (
                          <select
                            value={info.value}
                            onChange={(e) =>
                              updateCorrectionInfo(
                                info.id,
                                "value",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border rounded w-full mb-4 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            required
                          >
                            {nationalityOptions.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.value}
                              </option>
                            ))}
                          </select>
                        )}

                        {info.key === "motherNationality" && (
                          <select
                            value={info.value}
                            onChange={(e) =>
                              updateCorrectionInfo(
                                info.id,
                                "value",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border rounded w-full mb-4 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            required
                          >
                            {nationalityOptions.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.value}
                              </option>
                            ))}
                          </select>
                        )}

                        {[
                          "personFirstNameBn",
                          "personLastNameBn",
                          "fatherNameBn",
                          "motherNameBn",
                        ].includes(info.key) && (
                          <div>
                            <input
                              value={info.value}
                              onChange={(e) =>
                                updateCorrectionInfo(
                                  info.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                validateBanglaText(
                                  info.id,
                                  e.target.value,
                                  updateCorrectionInfo
                                )
                              }
                              className={`px-3 py-2 border rounded w-full dark:bg-gray-600 dark:border-gray-500 dark:text-white ${
                                info.error
                                  ? "border-red-500 dark:border-red-400"
                                  : ""
                              }`}
                              placeholder="চাহিত সংশোধিত তথ্য"
                              required
                            />
                            {info.error && (
                              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                                {info.error}
                              </p>
                            )}
                          </div>
                        )}

                        {[
                          "personFirstNameEn",
                          "personLastNameEn",
                          "fatherNameEn",
                          "motherNameEn",
                        ].includes(info.key) && (
                          <div>
                            <input
                              value={info.value}
                              onChange={(e) =>
                                updateCorrectionInfo(
                                  info.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                validateEnglishText(
                                  info.id,
                                  e.target.value,
                                  updateCorrectionInfo
                                )
                              }
                              className={`px-3 py-2 border rounded w-full dark:bg-gray-600 dark:border-gray-500 dark:text-white ${
                                info.error
                                  ? "border-red-500 dark:border-red-400"
                                  : ""
                              }`}
                              placeholder="Enter corrected information"
                              required
                            />
                            {info.error && (
                              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                                {info.error}
                              </p>
                            )}
                          </div>
                        )}

                        {info.key === "personBirthDate" && (
                          <div>
                            <input
                              value={info.value}
                              onChange={(e) =>
                                updateCorrectionInfo(
                                  info.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                validateBirthDate(
                                  info.id,
                                  e.target.value,
                                  updateCorrectionInfo
                                )
                              }
                              className={`px-3 py-2 border rounded w-full dark:bg-gray-600 dark:border-gray-500 dark:text-white ${
                                info.error
                                  ? "border-red-500 dark:border-red-400"
                                  : ""
                              }`}
                              placeholder="DD/MM/YYYY"
                              required
                            />
                            {info.error && (
                              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                                {info.error}
                              </p>
                            )}
                          </div>
                        )}

                        {info.key === "personNid" && (
                          <div>
                            <input
                              value={info.value}
                              onChange={(e) =>
                                updateCorrectionInfo(
                                  info.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                validateNID(
                                  info.id,
                                  e.target.value,
                                  updateCorrectionInfo
                                )
                              }
                              className={`px-3 py-2 border rounded w-full dark:bg-gray-600 dark:border-gray-500 dark:text-white ${
                                info.error
                                  ? "border-red-500 dark:border-red-400"
                                  : ""
                              }`}
                              placeholder="Enter NID number"
                              required
                            />
                            {info.error && (
                              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                                {info.error}
                              </p>
                            )}
                          </div>
                        )}

                        {info.key === "passportNumber" && (
                          <div>
                            <input
                              value={info.value}
                              onChange={(e) =>
                                updateCorrectionInfo(
                                  info.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                validatePassport(
                                  info.id,
                                  e.target.value,
                                  updateCorrectionInfo
                                )
                              }
                              className={`px-3 py-2 border rounded w-full dark:bg-gray-600 dark:border-gray-500 dark:text-white ${
                                info.error
                                  ? "border-red-500 dark:border-red-400"
                                  : ""
                              }`}
                              placeholder="Enter passport number"
                              required
                            />
                            {info.error && (
                              <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                                {info.error}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {correctionInfos.length > 0 && (
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeCorrectionInfo(info.id)}
                            className="text-red-600 dark:text-red-400 text-sm"
                          >
                            মুছে ফেলুন
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCorrectionInfo}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    disabled={correctionInfos.length >= currectionList.length}
                  >
                    + আরো তথ্য{" "}
                    {correctionInfos.length >= currectionList.length &&
                      "(সর্বোচ্চ সীমা)"}
                  </button>
                </div>

                {/* ---------- Address Section ---------- */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    ঠিকানা সংশোধন *
                  </h3>

                  {/* Birth Place Address */}
                  <AddressDisplay
                    address={addresses.birthPlace}
                    type="birthPlace"
                    onEdit={() => openAddressModal("birthPlace")}
                  />

                  {/* Copy to Permanent Address Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="copyBirthPlaceToPermAddr"
                      checked={formData.copyBirthPlaceToPermAddr}
                      onChange={(e) =>
                        handleInputChange(
                          "copyBirthPlaceToPermAddr",
                          e.target.checked
                        )
                      }
                      className="rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="copyBirthPlaceToPermAddr"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      জন্মস্থানের ঠিকানা স্থায়ী ঠিকানায় কপি করুন
                    </label>
                  </div>

                  {/* Permanent Address */}
                  <AddressDisplay
                    address={addresses.permAddress}
                    type="permAddress"
                    onEdit={() => openAddressModal("permAddress")}
                  />

                  {/* Copy to Present Address Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="copyPermAddrToPrsntAddr"
                      checked={formData.copyPermAddrToPrsntAddr}
                      onChange={(e) =>
                        handleInputChange(
                          "copyPermAddrToPrsntAddr",
                          e.target.checked
                        )
                      }
                      className="rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="copyPermAddrToPrsntAddr"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      স্থায়ী ঠিকানা বর্তমান ঠিকানায় কপি করুন
                    </label>
                  </div>

                  {/* Present Address */}
                  <AddressDisplay
                    address={addresses.prsntAddress}
                    type="prsntAddress"
                    onEdit={() => openAddressModal("prsntAddress")}
                  />
                </div>

                {/* ---------- File Upload with Drag & Drop ---------- */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    ফাইল আপলোড
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    শুধুমাত্র ইমেজ ফাইল (.jpg, .jpeg, .png) আপলোড করা যাবে।
                    (প্রতিটি ফাইলের জন্য সর্বোচ্চ ফাইল সাইজ 2 মেগা বাইট)
                  </p>

                  {/* Drag & Drop Area */}
                  <div
                    className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <svg
                        className="w-12 h-12 text-gray-400 dark:text-gray-500"
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
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                      >
                        ফাইল নির্বাচন করুন
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG, PDF ফাইল সমর্থিত • সর্বোচ্চ 2MB প্রতি ফাইল
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
                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600"
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
                              className="px-3 py-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white 
             w-40 truncate"
                            >
                              <option value="-1">---টাইপ নির্বাচন---</option>
                              {fileTypes.map((t) => (
                                <option
                                  key={`filetype-${t.id}`}
                                  value={t.id}
                                  className="truncate"
                                >
                                  {t.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleFileUpload(idx)}
                              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
                            >
                              আপলোড
                            </button>
                            <button
                              type="button"
                              onClick={() => removeUploadingFile(idx)}
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Remove file"
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded list */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                        আপলোডকৃত ফাইল ({uploadedFiles.length})
                      </h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((f) => (
                          <div
                            key={`uploaded-${f.id}`}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <div className="flex-1 min-w-0">
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-700 dark:text-green-400 hover:underline font-medium text-sm truncate block"
                              >
                                {f.name}
                              </a>
                              <p className="text-xs text-green-600 dark:text-green-500">
                                {f.fileType}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setUploadedFiles((p) =>
                                  p.filter((x) => x.id !== f.id)
                                )
                              }
                              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
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
                    </div>
                  )}
                </div>

                {/* ---------- Applicant Information ---------- */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                    আবেদনকারীর তথ্য *
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        আবেদনকারীর নাম *
                      </label>
                      <input
                        type="text"
                        value={birthRecord.personNameBn}
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
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="example@email.com"
                      />
                    </div>

                    {/* Phone input with Send button on the right */}
                    <div className="mb-4 w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ফোন নম্বর *
                      </label>
                      <div className="flex flex-col sm:flex-row w-full">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            setOtpCountdown(0);
                            setIsOtpSent(false);
                            handleInputChange("phone", e.target.value);
                          }}
                          className="flex-1 px-3 py-2 border rounded-md sm:rounded-l-md sm:rounded-r-none w-full mb-2 sm:mb-0 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="01XXXXXXXXX"
                          required
                        />
                        <button
                          type="button"
                          onClick={sendOTP}
                          disabled={isOtpSent && otpCountdown > 0}
                          className={`font-bold px-4 py-2 rounded-md sm:rounded-l-none sm:rounded-r-md w-full sm:w-auto transition-colors ${
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
                            "Send"
                          )}
                        </button>
                      </div>
                      {isOtpSent && otpCountdown > 0 && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          OTP পাঠানো হয়েছে। {formatTime(otpCountdown)} পরে আবার
                          পাঠাতে পারবেন
                        </p>
                      )}
                    </div>

                    {/* OTP input with Verify button on the right */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        OTP *
                      </label>
                      <div className="flex flex-col sm:flex-row w-full">
                        <input
                          type="text"
                          value={formData.otp}
                          onChange={(e) =>
                            handleInputChange("otp", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border rounded-md sm:rounded-l-md sm:rounded w-full mb-2 sm:mb-0 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Enter OTP"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---------- Navigation ---------- */}
                <div className="flex justify-between pt-6 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
                  >
                    পূর্ববর্তী
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
                  >
                    {isLoading ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ── ADDRESS MODAL ───────────────────────────────────────────────────── */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                ঠিকানা নির্বাচন করুন
              </h3>
              <button
                onClick={closeAddressModal}
                className="text-gray-500 dark:text-gray-400 text-2xl hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <BDRISGeoSelector
              onApply={applyAddressFromSelector}
              initial={addresses[currentAddressType]}
            />
          </div>
        </div>
      )}
    </div>
  );
}