// app/api/birth-registration/correction/route.ts
import { connectDB } from "@/lib/mongodb";
import Currection from "@/models/Currection";
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/getUser";
import Services from "@/models/Services";
import Reseller from "@/models/Reseller";
import Spent from "@/models/Use";
import Earnings from "@/models/Earnings";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer-extra";

// Define types for the request body
interface CorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
}

interface Address {
  country: string;
  geoId: string;
  division: string | number;
  divisionName: string;
  district: string | number;
  districtName: string;
  cityCorpCantOrUpazila: string | number;
  upazilaName: string;
  paurasavaOrUnion: string | number;
  unionName: string;
  postOfc: string;
  postOfcEn: string;
  vilAreaTownBn: string;
  vilAreaTownEn: string;
  houseRoadBn: string;
  houseRoadEn: string;
  ward: string | number;
  wardName: string;
}

interface ApplicantInfo {
  name: string;
  officeId?: number;
  email: string;
  phone: string;
  relationWithApplicant: string;
}

interface FileInfo {
  id: number;
  name: string;
  url: string;
  deleteUrl: string;
  attachmentTypeId: string;
  fileType: string;
}

interface CorrectionRequestBody {
  ubrn: string;
  dob: string;
  correctionInfos: CorrectionInfo[];
  addresses: {
    birthPlace: Address;
    permAddress: Address;
    prsntAddress: Address;
  };
  applicantInfo: ApplicantInfo;
  files: FileInfo[];
  otp: string;
  captcha: string;
  csrf: string;
  cookies: string[];
  isPermAddressIsSameAsBirthPlace: boolean;
  isPrsntAddressIsSameAsPermAddress: boolean;
}

// Helper function to check if string is HTML
function isHTML(str: string): boolean {
  return str.trim().startsWith("<!DOCTYPE") || str.trim().startsWith("<html");
}

// Helper function to parse response safely
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

export async function POST(request: NextRequest) {
  try {
    const body: CorrectionRequestBody = await request.json();

    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const servicePath = "/birth/application/correction";

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

    if (user.balace < serviceCost) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 402 }
      );
    }

    const reseller = await Reseller.findById(user.reseller);

    const currection = await Currection.create({ ...body, user: user._id });
    // Validate required fields
    if (
      !body.ubrn ||
      !body.otp ||
      !body.captcha ||
      !body.csrf ||
      !body.cookies ||
      !body.applicantInfo
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "অনুগ্রহ করে সকল আবশ্যক তথ্য প্রদান করুন।",
        },
        { status: 400 }
      );
    }

    // Validate applicant name (as in PHP)
    if (!body.applicantInfo.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "আবেদনকারীর নাম নির্বাচন করুন, না হলে আবেদন জমা হবে না।",
        },
        { status: 400 }
      );
    }

    // Build correctionInfoJson array (similar to PHP logic)
    const correctionInfoArray = [];

    // Add personal info corrections
    body.correctionInfos.forEach((info) => {
      if (info.key && info.value) {
        correctionInfoArray.push({
          id: info.key,
          val: info.value,
          cause: info.cause || "2",
        });
      }
    });

    // Add address corrections
    const { birthPlace, permAddress, prsntAddress } = body.addresses;

    // Birth place address
    if (birthPlace && birthPlace.country !== "-1") {
      correctionInfoArray.push(
        {
          id: "birthPlaceLocationId",
          val:
            birthPlace.geoId !== "0"
              ? birthPlace.country
              : birthPlace.paurasavaOrUnion.toString(),
        },
        {
          id: "birthPlaceWardInPaurasavaOrUnion",
          val: birthPlace.ward.toString(),
        },
        {
          id: "birthPlaceEn",
          val: `${birthPlace.houseRoadEn} ${birthPlace.vilAreaTownEn} ${birthPlace.postOfcEn}`.trim(),
        },
        {
          id: "birthPlaceBn",
          val: `${birthPlace.houseRoadBn} ${birthPlace.vilAreaTownBn} ${birthPlace.postOfc}`.trim(),
        }
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
              : permAddress.paurasavaOrUnion.toString(),
        },
        {
          id: "permAddrWardInPaurasavaOrUnion",
          val: permAddress.ward.toString(),
        },
        {
          id: "permAddrEn",
          val: `${permAddress.houseRoadEn} ${permAddress.vilAreaTownEn} ${permAddress.postOfcEn}`.trim(),
        },
        {
          id: "permAddrBn",
          val: `${permAddress.houseRoadBn} ${permAddress.vilAreaTownBn} ${permAddress.postOfc}`.trim(),
        }
      );
    }
    if (prsntAddress && prsntAddress.country !== "-1") {
      correctionInfoArray.push(
        {
          id: "prsntAddrLocationId",
          val:
            prsntAddress.geoId !== "0"
              ? prsntAddress.country
              : prsntAddress.paurasavaOrUnion.toString(),
        },
        {
          id: "prsntAddrWardInPaurasavaOrUnion",
          val: prsntAddress.ward.toString(),
        },
        {
          id: "prsntAddrEn",
          val: `${prsntAddress.houseRoadEn} ${prsntAddress.vilAreaTownEn} ${prsntAddress.postOfcEn}`.trim(),
        },
        {
          id: "prsntAddrBn",
          val: `${prsntAddress.houseRoadBn} ${prsntAddress.vilAreaTownBn} ${prsntAddress.postOfc}`.trim(),
        }
      );
    }

    // Prepare FormData
    const formData = new FormData();

    // Add CSRF token and basic identifiers
    formData.append("_csrf", body.csrf);
    formData.append("brSearchAliveBrnCorr", body.ubrn);
    formData.append("birthRegisterId", "");
    formData.append("brSearchDob", body.dob);
    formData.append("captchaAns", body.captcha);
    formData.append("otp", body.otp);

    // Add specific personal info corrections

    // Add correction information from correctionInfos
    body.correctionInfos.forEach((info) => {
      if (info.key && info.value) {
        formData.append(info.key, info.value);
        formData.append(`${info.key}_cause`, "2");
      }
    });

    // Add birth place address if provided
    if (birthPlace && birthPlace.country !== "-1") {
      formData.append("birthPlaceCorrectionCheckbox", "yes");
      formData.append("birthPlaceCountry", birthPlace.country);
      formData.append("birthPlaceDiv", birthPlace.division.toString());
      formData.append("birthPlaceDist", birthPlace.district.toString());
      formData.append(
        "birthPlaceCityCorpCantOrUpazila",
        birthPlace.cityCorpCantOrUpazila.toString()
      );
      formData.append(
        "birthPlacePaurasavaOrUnion",
        birthPlace.paurasavaOrUnion.toString()
      );
      formData.append("birthPlaceWardInCityCorp", "-1");
      formData.append("birthPlaceArea", "-1");
      formData.append(
        "birthPlaceWardInPaurasavaOrUnion",
        birthPlace.ward.toString()
      );

      // Add ALL birth place address fields
      formData.append("birthPlacePostOfc", birthPlace.postOfc || "");
      formData.append("birthPlacePostOfcEn", birthPlace.postOfcEn || "");
      formData.append(
        "birthPlaceVilAreaTownBn",
        birthPlace.vilAreaTownBn || ""
      );
      formData.append(
        "birthPlaceVilAreaTownEn",
        birthPlace.vilAreaTownEn || ""
      );
      formData.append("birthPlaceHouseRoadBn", birthPlace.houseRoadBn || "");
      formData.append("birthPlaceHouseRoadEn", birthPlace.houseRoadEn || "");
      formData.append("birthPlacePostCode", "");
      formData.append(
        "birthPlaceLocationId",
        birthPlace.geoId !== "0"
          ? birthPlace.country
          : birthPlace.paurasavaOrUnion.toString()
      );
      formData.append(
        "birthPlaceEn",
        `${birthPlace.houseRoadEn} ${birthPlace.vilAreaTownEn} ${birthPlace.postOfcEn}`.trim() ||
          ""
      );
      formData.append(
        "birthPlaceBn",
        `${birthPlace.houseRoadBn} ${birthPlace.vilAreaTownBn} ${birthPlace.postOfc}`.trim() ||
          ""
      );
    }

    // Handle Permanent Address - ALWAYS include it with proper data
    if (permAddress && permAddress.country !== "-1") {
      // Use birth place data for permanent address
      formData.append("permAddrCorrectionCheckbox", "yes");
      formData.append("permAddrCountry", permAddress.country);
      formData.append("permAddrDiv", permAddress.division.toString());
      formData.append("permAddrDist", permAddress.district.toString());
      formData.append(
        "permAddrCityCorpCantOrUpazila",
        permAddress.cityCorpCantOrUpazila.toString()
      );
      formData.append(
        "permAddrPaurasavaOrUnion",
        permAddress.paurasavaOrUnion.toString()
      );
      formData.append("permAddrWardInCityCorp", "-1");
      formData.append("permAddrArea", "-1");
      formData.append(
        "permAddrWardInPaurasavaOrUnion",
        permAddress.ward.toString()
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
        permAddress.geoId !== "0"
          ? permAddress.country
          : permAddress.paurasavaOrUnion.toString()
      );
      formData.append(
        "permAddrEn",
        `${permAddress.houseRoadEn} ${permAddress.vilAreaTownEn} ${permAddress.postOfcEn}`.trim() ||
          ""
      );
      formData.append(
        "permAddrBn",
        `${permAddress.houseRoadBn} ${permAddress.vilAreaTownBn} ${permAddress.postOfc}`.trim() ||
          ""
      );
    }

    // Handle Present Address - ALWAYS include it with proper data
    if (prsntAddress && prsntAddress.country !== "-1") {
      // Use birth place data for present address
      formData.append("prsntAddrCorrectionCheckbox", "yes");
      formData.append("prsntAddrCountry", prsntAddress.country);
      formData.append("prsntAddrDiv", prsntAddress.division.toString());
      formData.append("prsntAddrDist", prsntAddress.district.toString());
      formData.append(
        "prsntAddrCityCorpCantOrUpazila",
        prsntAddress.cityCorpCantOrUpazila.toString()
      );
      formData.append(
        "prsntAddrPaurasavaOrUnion",
        prsntAddress.paurasavaOrUnion.toString()
      );
      formData.append("prsntAddrWardInCityCorp", "-1");
      formData.append("prsntAddrArea", "-1");
      formData.append(
        "prsntAddrWardInPaurasavaOrUnion",
        prsntAddress.ward.toString()
      );

      // Add ALL present address fields
      formData.append("prsntAddrPostOfc", prsntAddress.postOfc || "");
      formData.append("prsntAddrPostOfcEn", prsntAddress.postOfcEn || "");
      formData.append(
        "prsntAddrVilAreaTownBn",
        prsntAddress.vilAreaTownBn || ""
      );
      formData.append(
        "prsntAddrVilAreaTownEn",
        prsntAddress.vilAreaTownEn || ""
      );
      formData.append("prsntAddrHouseRoadBn", prsntAddress.houseRoadBn || "");
      formData.append("prsntAddrHouseRoadEn", prsntAddress.houseRoadEn || "");
      formData.append("prsntAddrPostCode", "");
      formData.append(
        "prsntAddrLocationId",
        prsntAddress.geoId !== "0"
          ? prsntAddress.country
          : prsntAddress.paurasavaOrUnion.toString()
      );
      formData.append(
        "prsntAddrEn",
        `${prsntAddress.houseRoadEn} ${prsntAddress.vilAreaTownEn} ${prsntAddress.postOfcEn}`.trim() ||
          ""
      );
      formData.append(
        "prsntAddrBn",
        `${prsntAddress.houseRoadBn} ${prsntAddress.vilAreaTownBn} ${prsntAddress.postOfc}`.trim() ||
          ""
      );
    }
    formData.append(
      "copyBirthPlaceToPermAddr",
      body.isPermAddressIsSameAsBirthPlace ? "yes" : "no"
    );
    formData.append(
      "copyPermAddrToPrsntAddr",
      body.isPrsntAddressIsSameAsPermAddress ? "yes" : "no"
    );
    // Add files/attachments
    if (body.files && body.files.length > 0) {
      body.files.forEach((file) => {
        formData.append("attachments", file.id.toString());
      });
    }

    // Add applicant information
    formData.append(
      "relationWithApplicant",
      body.applicantInfo.relationWithApplicant || "SELF"
    );
    formData.append("applicantFatherBrn", "");
    formData.append("applicantFatherNid", "");
    formData.append("applicantMotherBrn", "");
    formData.append("applicantMotherNid", "");
    formData.append("applicantNotParentsBrn", "");
    formData.append("applicantNotParentsDob", "");
    formData.append("applicantNotParentsNid", "");
    formData.append("applicantName", body.applicantInfo.name);
    formData.append("email", body.applicantInfo.email || "");

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

    if (body.cookies?.length) {
      headers.set("Cookie", body.cookies.join("; "));
    }

    headers.set("Accept", "*/*");
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("X-Csrf-Token", body.csrf);
    headers.set("Referer", "https://bdris.gov.bd/br/correction");
    // Make the request to the external API
    const apiUrl = "https://bdris.gov.bd/br/correction";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    // Use safe parsing to handle HTML responses
    const result = await safeParseResponse(response);

    if (!result.success) {
      currection.submit_status = "failed";
      await currection.save();
      return NextResponse.json(
        {
          success: false,
          error: result,
        },
        { status: 500 }
      );
    }
    currection.submit_status = "submitted";
    currection.applicationId = result.applicationId;
    currection.printLink = result.printLink;
    currection.cost = serviceCost;
    user.balance -= serviceCost;
    reseller.balance += userService.fee;

    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: currection._id,
      dataSchema: "CurrectionApplication",
    });
    await Earnings.create({
      user: user._id,
      reseller: reseller._id,
      service: userService._id,
      amount: userService.fee,
      data: currection._id,
      dataSchema: "CurrectionApplication",
    });
    await reseller.save();
    await user.save();
    await currection.save();

    // Return the result from external API
    return NextResponse.json(currection);
  } catch (error) {
    console.error("Error processing birth registration correction:", error);

    // Return user-friendly error message
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          error ||
          "আপনার আবেদনের সেশনের মেয়াদ শেষ অথবা নিবন্ধন সার্ভার সমস্যা। দয়া করে আবার চেষ্টা করুন।",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    // --------- Extra anti-block settings ----------
    await page.setViewport({ width: 1280, height: 900 });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/121.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://bdris.gov.bd/",
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    // ------------------------------------------------

    await page.goto("https://bdris.gov.bd/br/correction", {
      waitUntil: "networkidle2",
      timeout: 90000,
    });

    // Wait for body load
    await page.waitForSelector("body");

    const html = await page.content();
    console.log(html.length)

    const cookies = await page.cookies();
    const cookiesArr = cookies.map((c) => `${c.name}=${c.value}`);

    const csrf = await page
      .$eval('meta[name="_csrf"]', (el) => el.getAttribute("content"))
      .catch(() => null);

    const captchaSrc = await page
      .$eval("#captcha", (el) => el.getAttribute("src"))
      .catch(() => null);

    await browser.close();

    return NextResponse.json({
      cookies: cookiesArr,
      csrf,
      serviceCost: 0,
      captcha: {
        src: captchaSrc,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: true, message: String(err) });
  }
}

// export async function GET() {
//   const url = "https://bdris.gov.bd/br/correction";
//   const url1 = "https://bdris.gov.bd";

//   try {
//     await connectDB();
//     const user = await getUser();
//     if (!user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const servicePath = "/birth/application/correction";

//     const service = await Services.findOne({ href: servicePath });
//     if (!service) {
//       return NextResponse.json(
//         { success: false, error: "Service not found" },
//         { status: 404 }
//       );
//     }

//     const userService = user.services.find(
//       (s: { service: string }) =>
//         s.service.toString() === service._id.toString()
//     );

//     if (!userService) {
//       return NextResponse.json(
//         { success: false, error: "User does not have access to this service" },
//         { status: 403 }
//       );
//     }
//     const serviceCost = userService.fee + service.fee;

//     // Fetch the HTML page
//     const headers = {
//       "User-Agent":
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//       Accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//       "Accept-Language": "en-US,en;q=0.9",
//       "Accept-Encoding": "gzip, deflate, br",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//       "Upgrade-Insecure-Requests": "1",
//       "Sec-Fetch-Dest": "document",
//       "Sec-Fetch-Mode": "navigate",
//       "Sec-Fetch-Site": "none",
//       "Sec-Fetch-User": "?1",
//       "sec-ch-ua":
//         '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"Windows"',
//       Pragma: "no-cache",
//       Referer: url1,
//     };

//     const response = await fetch(url, { headers });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const html = await response.text();

//     // Check if we got the challenge page
//     if (html.includes("Please enable JavaScript") || html.includes("ie9rgb4")) {
//       throw new Error("Bot detection triggered - got challenge page");
//     }

//     //save the html
//     const filePath = path.join(
//       process.cwd(),
//       "public",
//       "html",
//       "correction.html"
//     );
//     // if not exist create the file
//     if (!fs.existsSync(path.dirname(filePath))) {
//       fs.mkdirSync(path.dirname(filePath), { recursive: true });
//     }
//     await fs.promises.writeFile(filePath, html);

//     // Extract cookies from response
//     const cookies = response.headers.get("set-cookie");
//     const cookiesStr: string = cookies ?? "";

//     const cookiesArr: string[] = [];

//     // Regex to capture all "key=value" before first semicolon of each cookie
//     const cookieRegex = /([^\s,=]+=[^;,\s]+)/g;
//     //match
//     let match: RegExpExecArray | null;
//     while ((match = cookieRegex.exec(cookiesStr)) !== null) {
//       cookiesArr.push(match[1]);
//     }

//     // Parse HTML to extract required data
//     const csrfMatch = html.match(/<meta name="_csrf" content="([^"]*)"/);
//     const csrf = csrfMatch ? csrfMatch[1] : null;

//     const captchaMatch = html.match(
//       /<img[^>]*id=["']captcha["'][^>]*src=["'](data:image\/png;base64,[^"']+)["']/i
//     );
//     const captchaSrc = captchaMatch ? captchaMatch[1] : null;

//     return NextResponse.json({
//       url,
//       cookies: cookiesArr,
//       csrf,
//       serviceCost,
//       captcha: {
//         src: captchaSrc,
//       },
//     });
//   } catch (error) {
//     console.error("Scrape error:", error);
//     return NextResponse.json({ error: String(error) }, { status: 500 });
//   }
// }
// export async function GET() {
//   const url = "http://api.sheva247.site/test/cpr.php";
//   try {
//     await connectDB();
//     const user = await getUser();
//     if (!user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const servicePath = "/birth/application/correction";

//     const service = await Services.findOne({ href: servicePath });
//     if (!service) {
//       return NextResponse.json(
//         { success: false, error: "Service not found" },
//         { status: 404 }
//       );
//     }

//     const userService = user.services.find(
//       (s: { service: string }) =>
//         s.service.toString() === service._id.toString()
//     );

//     if (!userService) {
//       return NextResponse.json(
//         { success: false, error: "User does not have access to this service" },
//         { status: 403 }
//       );
//     }
//     const serviceCost = userService.fee + service.fee;

//     const response = await fetch(url, { method: "GET" });
//     const data = await response.json();
//     const csrf = data.csrf_token;
//     const cookiesArr = Object.entries(data.cookies).map(
//       ([k, v]) => `${k}=${v}`
//     );
//     const captchaSrc = data.captcha_image_src;
//     console.log(cookiesArr);
//     return NextResponse.json({
//       cookies: cookiesArr,
//       csrf,
//       serviceCost,
//       captcha: {
//         src: captchaSrc,
//       },
//     });
//   } catch (error) {
//     return NextResponse.json(
//       { message: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
