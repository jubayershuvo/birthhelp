import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Services from "@/models/Services";
import { NextRequest, NextResponse } from "next/server";

const userAgentString =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  const { ubrn, dob, captcha, data } = await req.json();

  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const servicePath = "/birth/certificate";

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
        { success: false, error: "Insufficient balance" },
        { status: 402 }
      );
    }

    const url = `https://bdris.gov.bd/api/br/search-by-ubrn-and-dob?ubrn=${ubrn}&personBirthDate=${dob}&captchaAns=${captcha}`;

    // Build headers
    const headers = new Headers();
    headers.set("User-Agent", userAgentString);
    if (data?.cookies?.length) {
      headers.set("Cookie", data.cookies.join("; "));
    }
    headers.set("Accept", "*/*");
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("Referer", "https://bdris.gov.bd/br/correction");
    // Make the request
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.log(response);
      return NextResponse.json(
        { success: false, error: "Failed to fetch data" },
        { status: 500 }
      );
    }
    const jsonData = await response.json(); // JSON response
    if (jsonData.success === false) {
      return NextResponse.json(
        { success: false, error: jsonData || "No data found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: jsonData[0] });
  } catch (err) {
    console.error("BDRIS request error:", err);
    return NextResponse.json(
      { success: false, error: err || "Server error" },
      { status: 500 }
    );
  }
}
