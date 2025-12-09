import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

const userAgentString =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

// 🔒 এগুলো ফিক্সড থাকবে
const FIXED_PERSON_UBRN = "20007518535017636"; // নিবন্ধন নম্বর (UBRN)
const FIXED_APPLICANT_NAME = "ইয়াবানুর বেগম"; // নাম
const FIXED_RELATION = "SELF";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // এখন body থেকে শুধু phone, cookies, csrf নেব
    const { phone, cookies, csrf, email } = await req.json();

    // personUbrn, applicantName, relation আর body থেকে আশা করব না
    if (!phone || !csrf) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (phone / csrf)" },
        { status: 400 }
      );
    }

    // Build query parameters safely
    const params = new URLSearchParams({
      appType: "BIRTH_INFORMATION_CORRECTION_APPLICATION",
      phone,
      officeId: "0",
      personUbrn: FIXED_PERSON_UBRN,
      relation: FIXED_RELATION,
      applicantName: FIXED_APPLICANT_NAME.trim(),
      ubrn: "",
      nid: "",
      officeAddressType: "",
    });

    if (email) params.append("email", email);

    const url = `${process.env.BDRIS_PROXY}/api/otp/sent?${params.toString()}`;

    // Build headers
    const headers = new Headers({
      "User-Agent": userAgentString,
      Accept: "*/*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://bdris.gov.bd/br/correction",
    });

    // session cookie ডায়নামিক থাকবে
    if (cookies?.length) {
      headers.set("Cookie", cookies.join("; "));
    }

    // Build form data
    const formData = new FormData();
    formData.append("_csrf", csrf);

    // Make the request
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const textResponse = await response.text();

    // Try to parse JSON safely
    let jsonData;
    try {
      jsonData = JSON.parse(textResponse);
    } catch {
      console.error("Invalid JSON response:", textResponse);
      return NextResponse.json(
        { success: false, error: "Invalid JSON response from BDRIS" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error("BDRIS error:", jsonData);
      return NextResponse.json(
        { success: false, error: jsonData || "BDRIS request failed" },
        { status: response.status }
      );
    }

    console.log("BDRIS response:", jsonData.isVerified);

    return NextResponse.json({ success: true, data: jsonData });
  } catch (err: unknown) {
    console.error("BDRIS request error:", err);

    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Internal server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
