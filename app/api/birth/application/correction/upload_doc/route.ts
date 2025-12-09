import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

const userAgentString =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  try {
    const formDataBody = await req.formData();
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Extract simple fields
    const attachmentType = formDataBody.get("attachmentType") as string;
    const attachmentSubType = formDataBody.get("attachmentSubType") as string;
    const csrf = formDataBody.get("csrf") as string;
    const cookies = formDataBody.get("cookies") as string;

    // Extract file(s)
    const file = formDataBody.get("files") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Disable SSL verification (only in dev)
    // if (process.env.NODE_ENV === "development") {
    //   process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    // }

    // Build query parameters safel

    const url = `${process.env.BDRIS_PROXY}/admin/doc/upload`;

    // Build headers
    const headers = new Headers({
      "User-Agent": userAgentString,
      Accept: "*/*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://bdris.gov.bd/br/correction",
    });

    if (cookies?.length) {
      headers.set("Cookie", cookies);
    }

    // Build form data
    const formData = new FormData();
    formData.append("_csrf", csrf);
    formData.append("attachmentType", attachmentType);
    formData.append("attachmentSubType", attachmentSubType || "-1");
    formData.append("files", file);

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

    return NextResponse.json({ success: true, data: jsonData.files });
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
