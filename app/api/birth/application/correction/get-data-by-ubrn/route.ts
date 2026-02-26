import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { saveHtmlDebug } from "@/lib/saveHtmlDebug";
import Services from "@/models/Services";
import { NextRequest, NextResponse } from "next/server";
const userAgentString =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  const { ubrn, dob, captcha, data } = await req.json();

  if (data?.cookies?.length === 0) {
    return NextResponse.json(
      { success: false, error: "No cookies provided" },
      { status: 400 },
    );
  }
  if (!data?.csrf) {
    return NextResponse.json(
      { success: false, error: "No CSRF token provided" },
      { status: 400 },
    );
  }

  if (!ubrn || !dob || !captcha) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = `${process.env.BDRIS_PROXY}/api/br/search-by-ubrn-and-dob`;

    const headers = new Headers();

    headers.set("User-Agent", userAgentString);
    headers.set("Accept", "*/*");
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("Referer", "https://bdris.gov.bd/br/correction");
    headers.set(
      "Content-Type",
      "application/x-www-form-urlencoded; charset=UTF-8",
    );

    // CSRF
    if (data?.csrf) {
      headers.set("X-CSRF-Token", data.csrf);
    }

    // Cookies
    if (data?.cookies?.length) {
      headers.set("Cookie", data.cookies.join("; "));
    }

    // IMPORTANT: must match original curl exactly
    const params = new URLSearchParams();

    params.append("draw", "1");
    params.append("order[0][column]", "0");
    params.append("order[0][dir]", "asc");
    params.append("order[0][name]", "");
    params.append("start", "0");
    params.append("length", "-1");
    params.append("search[value]", "");
    params.append("search[regex]", "false");
    params.append("officeAddressType", "BANGLADESH");
    params.append("ubrn", ubrn);
    params.append("personBirthDate", dob); // DD/MM/YYYY
    params.append("captchaAns", captcha);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: params.toString(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.message || "Failed to fetch data" },
        { status: 500 },
      );
    }
    //html response save to /tmp for debugging
    const html = await response.text();

    if (html && html.includes("<html")) {
      const debugFilePath = saveHtmlDebug(html);
      console.log(debugFilePath);
      if (html.includes("Login To BDRIS")) {
        return NextResponse.json(
          { success: false, error: "BDRIS error" },
          { status: 404 },
        );
      } else {
        return NextResponse.json(
          { success: false, error: "Unknown error from BDRIS" },
          { status: 500 },
        );
      }
    }

    const parsedData = JSON.parse(html);

    // const jsonData = await response?.json(); // JSON response
    if (parsedData.success === false) {
      return NextResponse.json(
        { success: false, error: parsedData || "No data found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: parsedData[0] });
  } catch (err) {
    console.error("BDRIS request error:", err);
    return NextResponse.json(
      { success: false, error: err || "Server error" },
      { status: 500 },
    );
  }
}
