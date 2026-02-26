import { bdrisCurrectionCookies } from "@/lib/bdrisCurrectionCookies";
import { connectDB } from "@/lib/mongodb";
import CorrectionApplication from "@/models/CurrectionReq";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

function isHTML(str: string): boolean {
  return str.trim().startsWith("<!DOCTYPE") || str.trim().startsWith("<html");
}
async function safeParseResponse(response: Response) {
  const text = await response.text();

  // console.log(`HTML page saved to: ${filePath}`);
  if (isHTML(text)) {
    if (text.includes("OTP NOT VERIFIED")) {
      return {
        success: false,
        message: "OTP not verified. Please check the OTP and try again.",
      };
    }

    const bdrisLink = "https://bdris.gov.bd";

    function extractData(html: string) {
      // 1️⃣ Extract ID (inside red span)
      const idRegex = /<span[^>]*color:red[^>]*>\s*([\d]+)\s*<\/span>/;
      const idMatch = html.match(idRegex);
      const applicationId = idMatch ? idMatch[1] : null;

      // 2️⃣ Extract success message (green message)
      const msgRegex =
        /<span[^>]*color:green[^>]*>\s*<b>\s*(.*?)\s*<\/b>\s*<\/span>/;
      const msgMatch = html.match(msgRegex);
      const message = msgMatch ? msgMatch[1] : null;

      // 3️⃣ Extract print link
      const printLinkRegex = /<a[^>]*id="appPrintBtn"[^>]*href="([^"]+)"/;
      const printMatch = html.match(printLinkRegex);
      const printLink = printMatch ? printMatch[1] : null;

      return {
        success: !!(applicationId && message && printLink),
        applicationId,
        message,
        cookieLink: bdrisLink + "/br/correction",
        printLink: printLink ? bdrisLink + printLink : null,
      };
    }

    const extracted = extractData(text);
    if (extracted.success) {
      return extracted;
    }

    // Check for common HTML error patterns
    if (
      text.includes("login") ||
      text.includes("session") ||
      text.includes("expired")
    ) {
      return {
        success: false,
        message: "Session expired or user not logged in. Please log in again.",
      };
    } else if (text.includes("CSRF") || text.includes("token")) {
      return {
        success: false,
        message: "CSRF token error. Please refresh and try again.",
      };
    } else if (response.status === 403) {
      return {
        success: false,
        message:
          "Access forbidden. You do not have permission to access this resource.",
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: "Resource not found. The requested endpoint does not exist.",
      };
    } else {
      return {
        success: false,
        message: "Unexpected HTML response received from server.",
      };
    }
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error("Failed to parse response as JSON:", text.substring(0, 500));
    return { success: false, message: "Failed to parse server response." };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // [id] param
    const { id } = await params;
    const ObjectId = mongoose.Types.ObjectId;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID parameter is required." },
        { status: 400 },
      );
    }
    await connectDB();
    const currection = await CorrectionApplication.findById(id);

    if (!currection) {
      return NextResponse.json(
        { error: "Correction application request not found." },
        { status: 404 },
      );
    }

    const session = await bdrisCurrectionCookies();

    if (!session) {
      return NextResponse.json(
        { error: "Failed to fetch session data." },
        { status: 500 },
      );
    }

    return NextResponse.json({ currection, session }, { status: 200 });
  } catch (error) {
    console.error("Error fetching correction application requests:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while fetching correction application requests.",
      },
      { status: 500 },
    );
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ObjectId = mongoose.Types.ObjectId;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID parameter is required." },
        { status: 400 },
      );
    }
    await connectDB();
    const currection = await CorrectionApplication.findById(id);
    const body = await request.json();

    if (!currection) {
      return NextResponse.json(
        { error: "Correction application request not found." },
        { status: 404 },
      );
    }

    // Build correctionInfoJson array (similar to PHP logic)
    const correctionInfoArray = [];

    // Add personal info corrections
    currection.correctionInfos.forEach((info) => {
      if (info.key && info.value) {
        correctionInfoArray.push({
          id: info.key,
          val: info.value,
          cause: info.cause || "2",
        });
      }
    });

    // Add address corrections
    const { birthPlace, permAddress, prsntAddress } =
      currection?.addresses || {};

    // Birth place address
    if (birthPlace && birthPlace.country !== "-1") {
      correctionInfoArray.push(
        {
          id: "birthPlaceLocationId",
          val:
            birthPlace.geoId !== "0"
              ? birthPlace.country
              : birthPlace?.paurasavaOrUnion?.toString(),
        },
        {
          id: "birthPlaceWardInPaurasavaOrUnion",
          val: birthPlace?.ward?.toString(),
        },
        {
          id: "birthPlaceEn",
          val: `${birthPlace.houseRoadEn} ${birthPlace.vilAreaTownEn} ${birthPlace.postOfcEn}`.trim(),
        },
        {
          id: "birthPlaceBn",
          val: `${birthPlace.houseRoadBn} ${birthPlace.vilAreaTownBn} ${birthPlace.postOfc}`.trim(),
        },
      );
    }

    // Present and Permanent addresses
    if (permAddress && permAddress.country !== "-1") {
      correctionInfoArray.push(
        {
          id: "permAddrLocationId",
          val:
            permAddress.geoId !== "0"
              ? permAddress.country
              : permAddress?.paurasavaOrUnion?.toString(),
        },
        {
          id: "permAddrWardInPaurasavaOrUnion",
          val: permAddress?.ward?.toString(),
        },
        {
          id: "permAddrEn",
          val: `${permAddress.houseRoadEn} ${permAddress.vilAreaTownEn} ${permAddress.postOfcEn}`.trim(),
        },
        {
          id: "permAddrBn",
          val: `${permAddress.houseRoadBn} ${permAddress.vilAreaTownBn} ${permAddress.postOfc}`.trim(),
        },
      );
    }
    if (prsntAddress && prsntAddress.country !== "-1") {
      correctionInfoArray.push(
        {
          id: "prsntAddrLocationId",
          val:
            prsntAddress.geoId !== "0"
              ? prsntAddress.country
              : prsntAddress?.paurasavaOrUnion?.toString(),
        },
        {
          id: "prsntAddrWardInPaurasavaOrUnion",
          val: prsntAddress?.ward?.toString(),
        },
        {
          id: "prsntAddrEn",
          val: `${prsntAddress.houseRoadEn} ${prsntAddress.vilAreaTownEn} ${prsntAddress.postOfcEn}`.trim(),
        },
        {
          id: "prsntAddrBn",
          val: `${prsntAddress.houseRoadBn} ${prsntAddress.vilAreaTownBn} ${prsntAddress.postOfc}`.trim(),
        },
      );
    }

    // Prepare FormData
    const formData = new FormData();

    // Add CSRF token and basic identifiers
    formData.append("_csrf", body.session.csrf);
    formData.append("brSearchAliveBrnCorr", currection.ubrn);
    formData.append("birthRegisterId", "");
    formData.append("brSearchDob", currection.dob);
    formData.append("captchaAns", body.captchaAns);
    formData.append("otp", body.otp);

    // Add specific personal info corrections

    // Add correction information from correctionInfos
    currection.correctionInfos.forEach((info) => {
      if (info.key && info.value) {
        formData.append(info.key, info.value);
        formData.append(`${info.key}_cause`, "2");
      }
    });

    // Add birth place address if provided
    if (birthPlace && birthPlace.country !== "-1") {
      formData.append("birthPlaceCorrectionCheckbox", "yes");
      formData.append("birthPlaceCountry", birthPlace?.country || "");
      formData.append("birthPlaceDiv", birthPlace?.division?.toString() || "");
      formData.append("birthPlaceDist", birthPlace?.district?.toString() || "");
      formData.append(
        "birthPlaceCityCorpCantOrUpazila",
        birthPlace.cityCorpCantOrUpazila?.toString() || "",
      );
      formData.append(
        "birthPlacePaurasavaOrUnion",
        birthPlace?.paurasavaOrUnion?.toString() || "",
      );
      formData.append("birthPlaceWardInCityCorp", "-1");
      formData.append("birthPlaceArea", "-1");
      formData.append(
        "birthPlaceWardInPaurasavaOrUnion",
        birthPlace?.ward?.toString() || "",
      );

      // Add ALL birth place address fields
      formData.append("birthPlacePostOfc", birthPlace.postOfc || "");
      formData.append("birthPlacePostOfcEn", birthPlace.postOfcEn || "");
      formData.append(
        "birthPlaceVilAreaTownBn",
        birthPlace.vilAreaTownBn || "",
      );
      formData.append(
        "birthPlaceVilAreaTownEn",
        birthPlace.vilAreaTownEn || "",
      );
      formData.append("birthPlaceHouseRoadBn", birthPlace.houseRoadBn || "");
      formData.append("birthPlaceHouseRoadEn", birthPlace.houseRoadEn || "");
      formData.append("birthPlacePostCode", "");
      formData.append(
        "birthPlaceLocationId",
        (birthPlace?.geoId !== "0"
          ? birthPlace.country
          : birthPlace?.paurasavaOrUnion?.toString()) || "",
      );
      formData.append(
        "birthPlaceEn",
        `${birthPlace.houseRoadEn} ${birthPlace.vilAreaTownEn} ${birthPlace.postOfcEn}`.trim() ||
          "",
      );
      formData.append(
        "birthPlaceBn",
        `${birthPlace.houseRoadBn} ${birthPlace.vilAreaTownBn} ${birthPlace.postOfc}`.trim() ||
          "",
      );
    }

    // Handle Permanent Address - ALWAYS include it with proper data
    if (permAddress && permAddress.country !== "-1") {
      // Use birth place data for permanent address
      formData.append("permAddrCorrectionCheckbox", "yes");
      formData.append("permAddrCountry", permAddress?.country || "");
      formData.append("permAddrDiv", permAddress?.division?.toString() || "");
      formData.append("permAddrDist", permAddress?.district?.toString() || "");
      formData.append(
        "permAddrCityCorpCantOrUpazila",
        permAddress?.cityCorpCantOrUpazila?.toString() || "",
      );
      formData.append(
        "permAddrPaurasavaOrUnion",
        permAddress?.paurasavaOrUnion?.toString() || "",
      );
      formData.append("permAddrWardInCityCorp", "-1");
      formData.append("permAddrArea", "-1");
      formData.append(
        "permAddrWardInPaurasavaOrUnion",
        permAddress?.ward?.toString() || "",
      );

      // Add ALL permanent address fields
      formData.append("permAddrPostOfc", permAddress.postOfc || "");
      formData.append("permAddrPostOfcEn", permAddress.postOfcEn || "");
      formData.append("permAddrVilAreaTownBn", permAddress.vilAreaTownBn || "");
      formData.append("permAddrVilAreaTownEn", permAddress.vilAreaTownEn || "");
      formData.append("permAddrHouseRoadBn", permAddress.houseRoadBn || "");
      formData.append("permAddrHouseRoadEn", permAddress.houseRoadEn || "");
      formData.append("permAddrPostCode", "");
      formData.append(
        "permAddrLocationId",
        (permAddress?.geoId !== "0"
          ? permAddress?.country
          : permAddress?.paurasavaOrUnion?.toString()) || "",
      );
      formData.append(
        "permAddrEn",
        `${permAddress.houseRoadEn} ${permAddress.vilAreaTownEn} ${permAddress.postOfcEn}`.trim() ||
          "",
      );
      formData.append(
        "permAddrBn",
        `${permAddress.houseRoadBn} ${permAddress.vilAreaTownBn} ${permAddress.postOfc}`.trim() ||
          "",
      );
    }

    // Handle Present Address - ALWAYS include it with proper data
    if (prsntAddress && prsntAddress.country !== "-1") {
      // Use birth place data for present address
      formData.append("prsntAddrCorrectionCheckbox", "yes");
      formData.append("prsntAddrCountry", prsntAddress?.country || "");
      formData.append("prsntAddrDiv", prsntAddress?.division?.toString() || "");
      formData.append(
        "prsntAddrDist",
        prsntAddress?.district?.toString() || "",
      );
      formData.append(
        "prsntAddrCityCorpCantOrUpazila",
        prsntAddress?.cityCorpCantOrUpazila?.toString() || "",
      );
      formData.append(
        "prsntAddrPaurasavaOrUnion",
        prsntAddress?.paurasavaOrUnion?.toString() || "",
      );
      formData.append("prsntAddrWardInCityCorp", "-1");
      formData.append("prsntAddrArea", "-1");
      formData.append(
        "prsntAddrWardInPaurasavaOrUnion",
        prsntAddress?.ward?.toString() || "",
      );

      // Add ALL present address fields
      formData.append("prsntAddrPostOfc", prsntAddress.postOfc || "");
      formData.append("prsntAddrPostOfcEn", prsntAddress.postOfcEn || "");
      formData.append(
        "prsntAddrVilAreaTownBn",
        prsntAddress.vilAreaTownBn || "",
      );
      formData.append(
        "prsntAddrVilAreaTownEn",
        prsntAddress.vilAreaTownEn || "",
      );
      formData.append("prsntAddrHouseRoadBn", prsntAddress.houseRoadBn || "");
      formData.append("prsntAddrHouseRoadEn", prsntAddress.houseRoadEn || "");
      formData.append("prsntAddrPostCode", "");
      formData.append(
        "prsntAddrLocationId",
        prsntAddress?.geoId !== "0"
          ? prsntAddress?.country || ""
          : prsntAddress?.paurasavaOrUnion?.toString() || "",
      );
      formData.append(
        "prsntAddrEn",
        `${prsntAddress.houseRoadEn} ${prsntAddress.vilAreaTownEn} ${prsntAddress.postOfcEn}`.trim() ||
          "",
      );
      formData.append(
        "prsntAddrBn",
        `${prsntAddress.houseRoadBn} ${prsntAddress.vilAreaTownBn} ${prsntAddress.postOfc}`.trim() ||
          "",
      );
    }
    formData.append(
      "copyBirthPlaceToPermAddr",
      currection.isPermAddressIsSameAsBirthPlace ? "yes" : "no",
    );
    formData.append(
      "copyPermAddrToPrsntAddr",
      currection.isPrsntAddressIsSameAsPermAddress ? "yes" : "no",
    );
    // Add files/attachments
    if (currection.files && currection.files.length > 0) {
      currection.files.forEach((file) => {
        formData.append("attachments", file.id.toString());
      });
    }

    // Add applicant information
    formData.append(
      "relationWithApplicant",
      currection.applicantInfo?.relationWithApplicant || "SELF",
    );
    formData.append("applicantFatherBrn", "");
    formData.append("applicantFatherNid", "");
    formData.append("applicantMotherBrn", "");
    formData.append("applicantMotherNid", "");
    formData.append("applicantNotParentsBrn", "");
    formData.append("applicantNotParentsDob", "");
    formData.append("applicantNotParentsNid", "");
    formData.append("applicantName", body.applicant.applicantName);
    formData.append("email", body.applicant.applicantEmail || "");

    // Format phone number (similar to PHP logic)
    let phone = body.applicantInfo.phone;
    if (phone.length === 11 && phone.startsWith("01")) {
      phone = "+88" + phone;
    }
    formData.append("phone", phone);

    // Add the correction info JSON (important!)
    formData.append("correctionInfoJson", JSON.stringify(correctionInfoArray));

    // Prepare headers
    const userAgentString =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

    const headers = new Headers();
    headers.set("User-Agent", userAgentString);

    if (body.session?.cookies?.length) {
      headers.set("Cookie", body.session.cookieString);
    }

    headers.set("Accept", "*/*");
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("X-Csrf-Token", body.session.csrf);
    headers.set("Referer", "https://bdris.gov.bd/br/correction");
    // Make the request to the external API
    const apiUrl = `${process.env.BDRIS_PROXY}/br/correction`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    // Use safe parsing to handle HTML responses
    const result = await safeParseResponse(response);

    if (!result.success) {
      console.log(result);
      currection.submit_status = "failed";
      await currection.save();
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Something went wrong",
        },
        { status: 500 },
      );
    }
    currection.submit_status = "submitted";
    currection.applicationId = result.applicationId;
    currection.printLink = result.printLink;
    await currection.save();

    return NextResponse.json({ currection, body }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "An error occurred while fetching correction application requests.",
      },
      { status: 500 },
    );
  }
}
