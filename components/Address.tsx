"use client";
import React, { useState, useEffect, useRef } from "react";

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

interface GeoParams {
  parentId: string;
  nextOrder: string;
  nextType: string;
  currentType: string;
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

const BDRISGeoSelector: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedUpazila, setSelectedUpazila] = useState<string>("");
  const [selectedUnion, setSelectedUnion] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");

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

  const [wardLabel, setWardLabel] = useState<string>("ওয়ার্ড");

  const api = "http://localhost:3000/geo?ajax=1";

  // Refs to store select element values for metadata access
  const divisionRef = useRef<HTMLSelectElement>(null);
  const districtRef = useRef<HTMLSelectElement>(null);
  const upazilaRef = useRef<HTMLSelectElement>(null);
  const unionRef = useRef<HTMLSelectElement>(null);
  const wardRef = useRef<HTMLSelectElement>(null);

  const showLoading = (field: keyof LoadingState, visible: boolean) => {
    setLoading((prev) => ({ ...prev, [field]: visible }));
  };

  const clearSelects = (fields: (keyof OptionsState)[]) => {
    const newOptions = { ...options };
    fields.forEach((field) => {
      newOptions[field] = [];
    });
    setOptions(newOptions);
  };

  const updateWardLabel = (unionType: string) => {
    const typeStr = String(unionType);
    if (typeStr === "7") {
      return "ওয়ার্ড (ক্যান্টনমেন্ট)";
    } else if (typeStr === "8") {
      return "ওয়ার্ড (সিটি)";
    } else {
      return "ওয়ার্ড";
    }
  };

  const buildUrl = (
    parentId: string,
    order: string,
    type: string,
    ward = false
  ) => {
    const w = ward ? "&ward=true" : "";
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
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          (error as any)?.message || `HTTP error! status: ${response.status}`
        );
      }

      const data: GeoResponse = await response.json();
      const list = data && Array.isArray(data.geoObject) ? data.geoObject : [];

      const processedList = list.map((loc) => ({
        ...loc,
        nameBn: (loc.nameBn || "").replace(/</g, "&lt;"),
        nameEn: (loc.nameEn || "").replace(/</g, "&lt;"),
      }));

      setOptions((prev) => ({ ...prev, [target]: processedList }));
      showLoading(target, false);
      return processedList;
    } catch (err) {
      console.error(`Error loading ${target}`, err);
      alert((err as Error)?.message || `Error loading ${target}`);
      showLoading(target, false);
      return [];
    }
  };

  const getParams = (
    selectRef: React.RefObject<HTMLSelectElement>
  ): GeoParams | null => {
    const sel = selectRef.current;
    if (!sel || !sel.selectedOptions || sel.selectedOptions.length === 0)
      return null;

    const opt = sel.selectedOptions[0];
    if (!opt || !opt.value) return null;

    return {
      parentId: opt.value,
      nextOrder: opt.getAttribute("data-next-order") || "",
      nextType: opt.getAttribute("data-next-type") || "",
      currentType: opt.getAttribute("data-current-type") || "",
    };
  };

  // Initial load (Divisions)
  useEffect(() => {
    loadGeo("division", "1", "0", "0");
  }, []);

  // Division change handler
  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDivision(value);
    setSelectedDistrict("");
    setSelectedUpazila("");
    setSelectedUnion("");
    setSelectedWard("");

    clearSelects(["district", "upazila", "union", "ward"]);

    if (!value) return;

    const params = getParams(divisionRef);
    if (!params) return;

    const order = params.nextOrder || "1";
    const type = params.nextType || "1";
    loadGeo("district", params.parentId, order, type);
  };

  // District change handler
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDistrict(value);
    setSelectedUpazila("");
    setSelectedUnion("");
    setSelectedWard("");

    clearSelects(["upazila", "union", "ward"]);

    if (!value) return;

    const params = getParams(districtRef);
    if (!params) return;

    const order = params.nextOrder || "2";
    const type = params.nextType || "2";
    loadGeo("upazila", params.parentId, order, type);
  };

  // Upazila change handler - Load ALL types of unions/city/cantonment
  const handleUpazilaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedUpazila(value);
    setSelectedUnion("");
    setSelectedWard("");

    clearSelects(["union", "ward"]);

    if (!value) return;

    const params = getParams(upazilaRef);
    if (!params) return;

    const upazilaId = params.parentId;
    showLoading("union", true);

    // Try to load all three types and combine results
    Promise.all([
      fetch(buildUrl(upazilaId, "3", "8"))
        .then((r) => r.json())
        .catch(() => ({ geoObject: [] })), // City
      fetch(buildUrl(upazilaId, "3", "7", true))
        .then((r) => r.json())
        .catch(() => ({ geoObject: [] })), // Cantonment
      fetch(buildUrl(upazilaId, "3", "3"))
        .then((r) => r.json())
        .catch(() => ({ geoObject: [] })), // Union
    ])
      .then(([cityData, cantonmentData, unionData]) => {
        const allUnions: GeoLocation[] = [];

        // Add City Corporations (type 8)
        const cityList = (cityData as GeoResponse)?.geoObject || [];
        cityList.forEach((loc) => {
          allUnions.push({
            ...loc,
            nameBn: (loc.nameBn || "").replace(/</g, "&lt;"),
            nameEn: (loc.nameEn || "").replace(/</g, "&lt;"),
          });
        });

        // Add Cantonments (type 7)
        const cantonmentList = (cantonmentData as GeoResponse)?.geoObject || [];
        cantonmentList.forEach((loc) => {
          allUnions.push({
            ...loc,
            nameBn: (loc.nameBn || "").replace(/</g, "&lt;"),
            nameEn: (loc.nameEn || "").replace(/</g, "&lt;"),
          });
        });

        // Add Regular Unions (type 3)
        const unionList = (unionData as GeoResponse)?.geoObject || [];
        unionList.forEach((loc) => {
          allUnions.push({
            ...loc,
            nameBn: (loc.nameBn || "").replace(/</g, "&lt;"),
            nameEn: (loc.nameEn || "").replace(/</g, "&lt;"),
          });
        });

        setOptions((prev) => ({ ...prev, union: allUnions }));
        showLoading("union", false);

        if (allUnions.length === 0) {
          console.warn(
            "No union/city/cantonment data found for upazila:",
            upazilaId
          );
        }
      })
      .catch((err) => {
        console.error("Error loading unions:", err);
        showLoading("union", false);
        alert("Error loading union data");
      });
  };

  // Union change handler - Load wards based on union type
  const handleUnionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedUnion(value);
    setSelectedWard("");

    clearSelects(["ward"]);

    if (!value) return;

    const params = getParams(unionRef);
    if (!params) return;

    const unionId = params.parentId;
    const unionType = params.currentType;

    // Update ward label
    setWardLabel(updateWardLabel(unionType));

    // Determine correct ward parameters
    let wardOrder = "4";
    let wardType = "5"; // default

    if (unionType === "8") {
      // City Corporation → ward type 9
      wardType = params.nextType || "9";
    } else if (unionType === "7") {
      // Cantonment → ward type 6
      wardType = params.nextType || "6";
    } else if (unionType === "3") {
      // Regular Union → ward type 5
      wardType = params.nextType || "5";
    }

    // Override with API response if available
    if (params.nextOrder) wardOrder = params.nextOrder;
    if (params.nextType) wardType = params.nextType;

    console.log(
      `Loading ward: unionId=${unionId}, order=${wardOrder}, type=${wardType}, unionType=${unionType}`
    );

    // Load wards with ward=true
    loadGeo("ward", unionId, wardOrder, wardType, true);
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWard(e.target.value);
  };

  const renderSelect = (
    id: string,
    label: string,
    value: string,
    optionsList: GeoLocation[],
    isLoading: boolean,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    ref?: React.RefObject<HTMLSelectElement>,
    includeMetadata: boolean = true
  ) => (
    <>
      <label htmlFor={id}>{label}:</label>
      <select id={id} ref={ref} value={value} onChange={onChange}>
        <option value="">-- নির্বাচন করুন --</option>
        {optionsList.map((loc) => {
          if (!includeMetadata) {
            return (
              <option key={loc.id} value={loc.id}>
                {loc.nameBn} ({loc.nameEn})
              </option>
            );
          }

          const nextOrder = loc.targetGeoOrder?.toString() || "";
          const nextType = loc.geoLevelId?.toString() || "";
          const currentType = loc.geoLevelId?.toString() || "";

          return (
            <option
              key={loc.id}
              value={loc.id}
              data-next-order={nextOrder}
              data-next-type={nextType}
              data-current-type={currentType}
            >
              {loc.nameBn} ({loc.nameEn})
            </option>
          );
        })}
      </select>
      <p className="loading" style={{ display: isLoading ? "block" : "none" }}>
        লোড হচ্ছে...
      </p>
    </>
  );

  return (
    <div className="container">
      <h2>ঠিকানা নির্বাচন (BDRIS)</h2>

      {renderSelect(
        "division",
        "বিভাগ",
        selectedDivision,
        options.division,
        loading.division,
        handleDivisionChange,
        divisionRef
      )}

      {renderSelect(
        "district",
        "জেলা",
        selectedDistrict,
        options.district,
        loading.district,
        handleDistrictChange,
        districtRef
      )}

      {renderSelect(
        "upazila",
        "উপজেলা",
        selectedUpazila,
        options.upazila,
        loading.upazila,
        handleUpazilaChange,
        upazilaRef
      )}

      <label id="label_union" htmlFor="union">
        ইউনিয়ন / সিটি কর্পোরেশন / ক্যান্টনমেন্ট:
      </label>
      <select
        id="union"
        ref={unionRef}
        value={selectedUnion}
        onChange={handleUnionChange}
      >
        <option value="">-- নির্বাচন করুন --</option>
        {options.union.map((loc) => {
          let nextOrder = "4";
          let nextType = "5";
          let currentType = "3";

          // Determine type based on the data
          if (loc.geoLevelId === 8) {
            // City
            nextType = "9";
            currentType = "8";
          } else if (loc.geoLevelId === 7) {
            // Cantonment
            nextType = "6";
            currentType = "7";
          } else if (loc.geoLevelId === 3) {
            // Union
            nextType = "5";
            currentType = "3";
          }

          return (
            <option
              key={loc.id}
              value={loc.id}
              data-next-order={nextOrder}
              data-next-type={nextType}
              data-current-type={currentType}
            >
              {loc.nameBn} ({loc.nameEn})
            </option>
          );
        })}
      </select>
      <p
        className="loading"
        style={{ display: loading.union ? "block" : "none" }}
      >
        লোড হচ্ছে...
      </p>

      <label id="label_ward" htmlFor="ward">
        {wardLabel}:
      </label>
      {renderSelect(
        "ward",
        wardLabel,
        selectedWard,
        options.ward,
        loading.ward,
        handleWardChange,
        wardRef,
        false // No metadata needed for wards
      )}

      <div className="footer">
        <span>Powered by BDRIS API · Designed by sagarmandal1</span>
      </div>

      <style jsx>{`
        .container {
          max-width: 460px;
          margin: auto;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
          padding: 32px 24px 24px 24px;
        }
        h2 {
          font-size: 1.4em;
          margin-bottom: 18px;
          color: #0a6cbe;
          letter-spacing: 0.02em;
          text-align: center;
        }
        label {
          display: block;
          margin-top: 20px;
          margin-bottom: 6px;
          font-weight: 600;
          color: #2c3e50;
        }
        select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #b8c4ce;
          background: #f6fbff;
          font-size: 1em;
          margin-bottom: 4px;
          transition: border-color 0.2s, background 0.2s;
        }
        select:focus {
          outline: none;
          border-color: #0a6cbe;
          background: #eef7ff;
        }
        .loading {
          color: #0a6cbe;
          font-size: 0.95em;
          margin-top: 5px;
          margin-bottom: 0;
        }
        .footer {
          text-align: center;
          font-size: 0.9em;
          color: #888;
          margin-top: 32px;
        }
      `}</style>
    </div>
  );
};

export default BDRISGeoSelector;
