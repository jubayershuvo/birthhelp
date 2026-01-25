import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

const userAgentString =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  try {
    const { cookies, csrf, phone, email, otp, relation, applicantName, officeAddressType, officeId } = await req.json();

    if (!cookies  || !phone || !csrf) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Build query parameters safely
    const params = new URLSearchParams({
      appType: "BIRTH_REGISTRATION_APPLICATION",
      otp,
      phone,
      relation,
      applicantName,
      officeId: officeId || "0",
      personUbrn:'',
      geoLocationId: "0",
      ubrn: "",
      nid: "",
      officeAddressType
    });

    if (email) params.append("email", email);

    const url = `${process.env.BDRIS_PROXY}/api/otp/verify?${params.toString()}`;

    // Build headers
    const headers = new Headers({
      "User-Agent": userAgentString,
      Accept: "*/*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://bdris.gov.bd/br/application",
    });

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
        { success: false, error: jsonData?.error || "BDRIS request failed" },
        { status: response.status }
      );
    }

    console.log("BDRIS response:", jsonData);

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
