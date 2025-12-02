import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Services from "@/models/Services";
import { NextResponse } from "next/server";

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
