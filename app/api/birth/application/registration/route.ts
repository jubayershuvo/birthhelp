import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthRegistration from "@/models/BirthRegistration";
import Earnings from "@/models/Earnings";
import Reseller from "@/models/Reseller";
import Services from "@/models/Services";
import { NextRequest, NextResponse } from "next/server";
import Spent from "@/models/Use";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer-extra";

// Helper function to check if response is HTML
function isHTML(str: string): boolean {
  const trimmed = str.trim();
  return trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
}

// Interface for parsed response
interface HTMLParseResult {
  success: boolean;
  applicationId?: string;
  lastDate?: string;
  printLink?: string;
  message?: string;
  cookieLink?: string;
  error?: string;
}

// Helper function to extract data from HTML response
function extractDataFromHTML(html: string) {
  const bdrisLink = "https://bdris.gov.bd";

  // Normalize HTML (remove newlines, multiple spaces)
  const normalized = html.replace(/\s+/g, " ").trim();

  // 1️⃣ Extract Print Link
  const printLinkRegex = /<a[^>]*id="appPrintBtn"[^>]*href="([^"]+)"/i;
  const printMatch = normalized.match(printLinkRegex);
  const printLink = printMatch ? bdrisLink + printMatch[1] : null;

  // 2️⃣ Extract Application ID
  const appIdRegex =
    /আবেদনপত্র\s*নম্বর\s*[:]\s*<span[^>]*>\s*([0-9]+)\s*<\/span>/i;
  const appIdMatch = normalized.match(appIdRegex);
  const applicationId = appIdMatch ? appIdMatch[1] : null;

  // 3️⃣ Extract Last Submission Date
  const lastDateRegex =
    /আগামী\s*<span[^>]*>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/span>\s*তারিখের\s*মধ্যে/i;
  const lastDateMatch = normalized.match(lastDateRegex);
  const lastDate = lastDateMatch ? lastDateMatch[1] : null;

  // Validate
  if (applicationId && printLink && lastDate) {
    return {
      success: true,
      applicationId,
      printLink,
      lastDate,
    };
  }

  return {
    success: false,
    error: "Failed to extract data from HTML",
  };
}

// Helper function to check for specific error patterns
function checkForErrorsInHTML(html: string): HTMLParseResult | null {
  // 1️⃣ Extract the alert div (any type of error alert)
  const alertRegex =
    /<div[^>]*class="[^"]*alert[^"]*alert-danger[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
  const alertMatch = html.match(alertRegex);

  if (!alertMatch) return null; // No alert → no error

  const alertHtml = alertMatch[1];

  // 3️⃣ Extract <span> or text after strong
  const spanRegex = /<span[^>]*>([\s\S]*?)<\/span>/i;
  const spanMatch = alertHtml.match(spanRegex);
  const errorMessage = spanMatch
    ? spanMatch[1].trim()
    : "An unknown error occurred.";

  return {
    success: false,
    error: errorMessage,
    message: errorMessage,
  };
}

// Main response parser
async function parseServerResponse(
  response: Response
): Promise<HTMLParseResult> {
  const responseText = await response.text();

  // If response is HTML, parse it
  if (isHTML(responseText)) {
    // Save the HTML to /html dir
    const htmlDir = path.join(process.cwd(), "html");
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir);
    }
    const htmlPath = path.join(htmlDir, `${Date.now()}.html`);
    fs.writeFileSync(htmlPath, responseText);
    // First check for specific error patterns

    // Try to extract successful application data
    const extractedData = extractDataFromHTML(responseText);
    if (extractedData.success) {
      return extractedData;
    }

    const errorResult = checkForErrorsInHTML(responseText);
    if (errorResult) {
      return errorResult;
    }
    // Generic HTML error response
    return {
      success: false,
      error: "HTML_RESPONSE_ERROR",
      message: "Unexpected HTML response received from server.",
    };
  }

  // Try to parse as JSON
  try {
    const jsonResponse = JSON.parse(responseText);

    // Check if JSON indicates error
    if (jsonResponse.error || !jsonResponse.success) {
      return {
        success: false,
        error: jsonResponse.error || "JSON_ERROR",
        message: jsonResponse.message || "Error received from server.",
        ...jsonResponse,
      };
    }

    // Successful JSON response
    return {
      success: true,
      applicationId: jsonResponse.applicationId,
      printLink: jsonResponse.printLink,
      message: jsonResponse.message,
      ...jsonResponse,
    };
  } catch (parseError) {
    // Non-HTML, non-JSON response
    console.error("Failed to parse response:", responseText.substring(0, 500));

    // Check HTTP status codes
    if (response.status === 403) {
      return {
        success: false,
        error: "FORBIDDEN",
        message:
          "Access forbidden. You do not have permission to access this resource.",
      };
    } else if (response.status === 404) {
      return {
        success: false,
        error: "NOT_FOUND",
        message: "Resource not found. The requested endpoint does not exist.",
      };
    } else if (response.status >= 500) {
      return {
        success: false,
        error: "SERVER_ERROR",
        message: "Server error occurred. Please try again later.",
      };
    } else if (response.status >= 400) {
      return {
        success: false,
        error: "CLIENT_ERROR",
        message: "Bad request. Please check your input data.",
      };
    }

    return {
      success: false,
      error: "UNKNOWN_RESPONSE",
      message: "Failed to parse server response.",
    };
  }
}

export async function POST(request: NextRequest) {
  const submissionData = await request.json();
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/birth/application/registration";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString()
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 }
      );
    }
    const serviceCost = userService.fee + service.fee;

    if (user.balance < serviceCost) {
      return NextResponse.json(
        { success: false, error: "User does not have enough balance" },
        { status: 403 }
      );
    }

    const reseller = await Reseller.findById(user.reseller);
    const application = await BirthRegistration.create({
      ...submissionData,
      user: user._id,
      cost: serviceCost,
    });
    // Extract cookies and CSRF from the request if they exist in the body
    const { cookies, csrf, ...restData } = submissionData;

    // Create FormData for multipart/form-data
    const formData = new FormData();

    // Helper function to safely append form data
    const appendFormData = (key: string, value: string) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      } else {
        formData.append(key, "");
      }
    };

    // Basic fields
    appendFormData("_csrf", csrf);
    appendFormData("otp", restData.otp);
    appendFormData("officeAddressType", restData.officeAddressType);
    appendFormData("officeAddrCountry", restData.officeAddrCountry);
    appendFormData("officeAddrCity", restData.officeAddrCity);
    appendFormData("officeAddrDivision", restData.officeAddrDivision);
    appendFormData("officeAddrDistrict", restData.officeAddrDistrict);
    appendFormData(
      "officeAddrCityCorpCantOrUpazila",
      restData.officeAddrCityCorpCantOrUpazila
    );
    appendFormData(
      "officeAddrPaurasavaOrUnion",
      restData.officeAddrPaurasavaOrUnion
    );
    appendFormData("officeAddrWard", restData.officeAddrWard);
    appendFormData("officeAddrOffice", restData.officeAddrOffice);

    // Personal Information
    if (restData.personInfoForBirth) {
      const person = restData.personInfoForBirth;
      appendFormData(
        "personInfoForBirth.personFirstNameBn",
        person.personFirstNameBn
      );
      appendFormData(
        "personInfoForBirth.personLastNameBn",
        person.personLastNameBn
      );
      appendFormData("personInfoForBirth.personNameBn", person.personNameBn);
      appendFormData(
        "personInfoForBirth.personFirstNameEn",
        person.personFirstNameEn
      );
      appendFormData(
        "personInfoForBirth.personLastNameEn",
        person.personLastNameEn
      );
      appendFormData("personInfoForBirth.personNameEn", person.personNameEn);
      appendFormData(
        "personInfoForBirth.personBirthDate",
        person.personBirthDate
      );
      appendFormData("personInfoForBirth.thChild", person.thChild);
      appendFormData("personInfoForBirth.gender", person.gender);
      appendFormData("personInfoForBirth.religion", person.religion);
      appendFormData(
        "personInfoForBirth.religionOther",
        person.religionOther || ""
      );
      appendFormData("personInfoForBirth.personNid", person.personNid || "");
    }

    // Father's information
    if (restData.father) {
      const father = restData.father;
      appendFormData(
        "personInfoForBirth.father.personNameBn",
        father.personNameBn
      );
      appendFormData(
        "personInfoForBirth.father.personNameEn",
        father.personNameEn
      );
      appendFormData(
        "personInfoForBirth.father.personNationality",
        father.personNationality
      );
      appendFormData(
        "personInfoForBirth.father.personNid",
        father.personNid || ""
      );
      appendFormData(
        "personInfoForBirth.father.passportNumber",
        father.passportNumber || ""
      );
      appendFormData("personInfoForBirth.father.ubrn", father.ubrn || "");
      appendFormData(
        "personInfoForBirth.father.personBirthDate",
        father.personBirthDate
      );
    }

    // Mother's information
    if (restData.mother) {
      const mother = restData.mother;
      appendFormData(
        "personInfoForBirth.mother.personNameBn",
        mother.personNameBn
      );
      appendFormData(
        "personInfoForBirth.mother.personNameEn",
        mother.personNameEn
      );
      appendFormData(
        "personInfoForBirth.mother.personNationality",
        mother.personNationality
      );
      appendFormData(
        "personInfoForBirth.mother.personNid",
        mother.personNid || ""
      );
      appendFormData(
        "personInfoForBirth.mother.passportNumber",
        mother.passportNumber || ""
      );
      appendFormData("personInfoForBirth.mother.ubrn", mother.ubrn || "");
      appendFormData(
        "personInfoForBirth.mother.personBirthDate",
        mother.personBirthDate
      );
    }

    // Birth Place Address
    appendFormData("birthPlaceCountry", restData.birthPlaceCountry);
    appendFormData("birthPlaceDiv", restData.birthPlaceDiv);
    appendFormData("birthPlaceDist", restData.birthPlaceDist);
    appendFormData(
      "birthPlaceCityCorpCantOrUpazila",
      restData.birthPlaceCityCorpCantOrUpazila
    );
    appendFormData(
      "birthPlacePaurasavaOrUnion",
      restData.birthPlacePaurasavaOrUnion
    );
    appendFormData(
      "birthPlaceWardInPaurasavaOrUnion",
      restData.birthPlaceWardInPaurasavaOrUnion
    );
    appendFormData("birthPlaceVilAreaTownBn", restData.birthPlaceVilAreaTownBn);
    appendFormData("birthPlaceVilAreaTownEn", restData.birthPlaceVilAreaTownEn);
    appendFormData("birthPlacePostOfc", restData.birthPlacePostOfc);
    appendFormData("birthPlacePostOfcEn", restData.birthPlacePostOfcEn);
    appendFormData("birthPlaceHouseRoadBn", restData.birthPlaceHouseRoadBn);
    appendFormData("birthPlaceHouseRoadEn", restData.birthPlaceHouseRoadEn);

    // Additional birth place fields that appear in curl
    appendFormData("birthPlaceArea", "-1");
    appendFormData(
      "birthPlaceBn",
      ` ${restData.birthPlaceVilAreaTownBn || ""} ${
        restData.birthPlacePostOfc || ""
      }`
    );
    appendFormData(
      "birthPlaceEn",
      ` ${restData.birthPlaceVilAreaTownEn || ""} ${
        restData.birthPlacePostOfcEn || ""
      }`
    );
    appendFormData(
      "birthPlaceLocationId",
      restData.birthPlacePaurasavaOrUnion || "-1"
    );
    appendFormData("birthPlacePostCode", "");
    appendFormData("birthPlaceWardInCityCorp", "-1");

    // Permanent Address
    appendFormData(
      "copyBirthPlaceToPermAddr",
      restData.copyBirthPlaceToPermAddr
    );
    appendFormData("permAddrCountry", restData.permAddrCountry);
    appendFormData("permAddrDiv", restData.permAddrDiv);
    appendFormData("permAddrDist", restData.permAddrDist);
    appendFormData(
      "permAddrCityCorpCantOrUpazila",
      restData.permAddrCityCorpCantOrUpazila
    );
    appendFormData(
      "permAddrPaurasavaOrUnion",
      restData.permAddrPaurasavaOrUnion
    );
    appendFormData(
      "permAddrWardInPaurasavaOrUnion",
      restData.permAddrWardInPaurasavaOrUnion
    );

    // Additional permanent address fields
    appendFormData("permAddrArea", restData.permAddrArea);
    appendFormData(
      "permAddrBn",
      ` ${restData.birthPlaceVilAreaTownBn || ""} ${
        restData.birthPlacePostOfc || ""
      }`
    );
    appendFormData(
      "permAddrEn",
      ` ${restData.permAddrVilAreaTownBn || ""} ${
        restData.permAddrPostOfc || ""
      }`
    );
    appendFormData("permAddrHouseRoadBn", restData.permAddrHouseRoadBn);
    appendFormData("permAddrHouseRoadEn", restData.permAddrHouseRoadEn);
    appendFormData(
      "permAddrLocationId",
      restData.permAddrPaurasavaOrUnion || "-1"
    );
    appendFormData("permAddrPostCode", "");
    appendFormData("permAddrPostOfc", restData.permAddrPostOfc);
    appendFormData("permAddrPostOfcEn", restData.permAddrPostOfcEn);
    appendFormData("permAddrVilAreaTownBn", restData.permAddrVilAreaTownBn);
    appendFormData("permAddrVilAreaTownEn", restData.permAddrVilAreaTownEn);
    appendFormData("permAddrWardInCityCorp", restData.permAddrWardInCityCorp);

    // Present Address
    appendFormData("copyPermAddrToPrsntAddr", restData.copyPermAddrToPrsntAddr);
    appendFormData("prsntAddrCountry", restData.prsntAddrCountry);
    appendFormData("prsntAddrDiv", restData.prsntAddrDiv);
    appendFormData("prsntAddrDist", restData.prsntAddrDist);
    appendFormData(
      "prsntAddrCityCorpCantOrUpazila",
      restData.prsntAddrCityCorpCantOrUpazila
    );
    appendFormData(
      "prsntAddrPaurasavaOrUnion",
      restData.prsntAddrPaurasavaOrUnion
    );
    appendFormData(
      "prsntAddrWardInPaurasavaOrUnion",
      restData.prsntAddrWardInPaurasavaOrUnion
    );

    // Additional present address fields
    appendFormData("prsntAddrArea", "-1");
    appendFormData(
      "prsntAddrBn",
      ` ${restData.prsntAddrVilAreaTownBn || ""} ${
        restData.prsntAddrPostOfc || ""
      }`
    );
    appendFormData(
      "prsntAddrEn",
      ` ${restData.prsntAddrVilAreaTownEn || ""} ${
        restData.prsntAddrPostOfcEn || ""
      }`
    );
    appendFormData("prsntAddrHouseRoadBn", restData.prsntAddrHouseRoadBn);
    appendFormData("prsntAddrHouseRoadEn", restData.prsntAddrHouseRoadEn);
    appendFormData(
      "prsntAddrLocationId",
      restData.prsntAddrPaurasavaOrUnion || "-1"
    );
    appendFormData("prsntAddrPostCode", restData.prsntAddrPostCode);
    appendFormData("prsntAddrPostOfc", restData.prsntAddrPostOfc);
    appendFormData("prsntAddrPostOfcEn", restData.prsntAddrPostOfcEn);
    appendFormData("prsntAddrVilAreaTownBn", restData.prsntAddrVilAreaTownBn);
    appendFormData("prsntAddrVilAreaTownEn", restData.prsntAddrVilAreaTownEn);
    appendFormData("prsntAddrWardInCityCorp", restData.prsntAddrWardInCityCorp);

    // Applicant Information
    appendFormData("applicantName", restData.applicantName);
    appendFormData("phone", restData.phone);
    appendFormData("email", restData.email || "");
    appendFormData("relationWithApplicant", restData.relationWithApplicant);

    // Additional applicant fields
    appendFormData("applicantDob", restData.applicantDob || "");
    appendFormData("applicantNotParentsBrn", restData.applicantNotParentsBrn || "");

    // File attachments
    if (restData.attachments && Array.isArray(restData.attachments)) {
      restData.attachments.forEach((attachment: { id: string }) => {
        if (attachment.id) {
          formData.append("attachments", attachment.id);
        }
      });
    } else {
      formData.append("attachments", "");
    }

    // Other required fields
    appendFormData("declaration", "on");
    appendFormData("personImage", "");
    appendFormData("files", "");
    appendFormData("geoLocationId", "");
    appendFormData("father.id", "");
    appendFormData("mother.id", "");
    appendFormData("officeId", "");
    appendFormData("wardId", restData.birthPlaceWardInPaurasavaOrUnion || "-1");

    // Prepare headers
    const userAgentString =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

    const headers = new Headers();
    headers.set("User-Agent", userAgentString);

    if (cookies?.length) {
      headers.set("Cookie", cookies.join("; "));
    }

    headers.set("Accept", "*/*");
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("X-Csrf-Token", csrf);
    headers.set("Referer", "https://bdris.gov.bd/br/application");
    // Make the request to the external API
    const apiUrl = "https://bdris.gov.bd/br/application";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: formData,
    });
    // Parse the response
    const result = await parseServerResponse(response);
    console.log(result);

    // Handle the result
    if (!result.success) {
      application.status = "failed";
      await application.save();

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
          details: result,
        },
        { status: 500 }
      );
    }

    application.status = "submitted";
    application.applicationId = result.applicationId;
    application.printLink = result.printLink;
    application.cost = serviceCost;
    application.lastDate = result?.lastDate;
    user.balance -= serviceCost;
    reseller.balance += userService.fee;
    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: application._id,
      dataSchema: "RegistrationApplication",
    });
    await Earnings.create({
      user: user._id,
      reseller: reseller._id,
      service: userService._id,
      amount: userService.fee,
      data: application._id,
      dataSchema: "RegistrationApplication",
    });
    await reseller.save();
    await user.save();
    await application.save();
    // Success response
    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      printLink: result.printLink,
      message: result.message,
      cookieLink: result.cookieLink,
      data: result,
      id: application._id,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "PROXY_ERROR",
        message: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/birth/application/registration";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString()
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 }
      );
    }
    const serviceCost = userService.fee + service.fee;
    const url = "https://bdris.gov.bd";
    const applicationUrl = "https://bdris.gov.bd/br/application";
    const res = await fetch(applicationUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "X-Requested-With": "XMLHttpRequest",
        Referer: url,
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      cache: "no-store",
      redirect: "follow",
    });
    const cookies = res.headers.get("set-cookie") || "";
    const cookiesStr: string = cookies ?? "";

    const cookiesArr: string[] = [];

    // Regex to capture all "key=value" before first semicolon of each cookie
    const cookieRegex = /([^\s,=]+=[^;,\s]+)/g;
    //match
    let match: RegExpExecArray | null;
    while ((match = cookieRegex.exec(cookiesStr)) !== null) {
      cookiesArr.push(match[1]);
    }
    const html = await res.text();
    const csrf = html.match(/<meta name="_csrf" content="([^"]+)"/)?.[1] || "";

    return NextResponse.json({
      cookies: cookiesArr,
      csrf,
      serviceCost: serviceCost,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
