import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const { cookies, csrf, ubrn, dob, nameEn, childBirthDate, gender } = body;

    const url = `${process.env.BDRIS_PROXY}/api/br/parent-info`;
    const userAgentString =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

    // Build headers
    const headers = new Headers({
      "User-Agent": userAgentString,
      Accept: "*/*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://bdris.gov.bd/br/application",
      "X-Csrf-Token": csrf,
    });

    if (cookies?.length) {
      headers.set("Cookie", cookies.join("; "));
    }

    // Build form data
    const formData = new FormData();
    formData.append("ubrn", ubrn);
    formData.append("dob", dob);
    formData.append("nameEn", nameEn);
    formData.append("childBirthDate", childBirthDate);
    formData.append("gender", gender);

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
    if(!jsonData[0].gender.toString() || !jsonData[0].personNationality.toString()) {
      console.error("BDRIS error:", jsonData);
      return NextResponse.json(
        { success: false, error: jsonData?.error || "BDRIS request failed" },
        { status: 404 }
      );
    }

  

    return NextResponse.json({ success: true, data: jsonData });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
