import { NextResponse } from "next/server";
import puppeteer from "puppeteer-extra";
import Services from "@/models/Services";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";
import Reseller from "@/models/Reseller";
import Spent from "@/models/Use";
import Earnings from "@/models/Earnings";

export async function GET(request: Request) {
  const urlParams = new URL(request.url);
  const appId = urlParams.searchParams.get("appId");
  const dob = urlParams.searchParams.get("dob");
  const appType = urlParams.searchParams.get("appType");

  if (!appId || !dob || !appType) {
    return NextResponse.json(
      { error: true, message: "Invalid request" },
      { status: 400 }
    );
  }

  await connectDB();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const servicePath = "/application/download/pdf";
  const service = await Services.findOne({ href: servicePath });
  if (!service) {
    return NextResponse.json(
      { success: false, error: "Service not found" },
      { status: 404 }
    );
  }

  const userService = user.services.find(
    (s: { service: string }) => s.service.toString() === service._id.toString()
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

  const reseller = await Reseller.findById(user.reseller);
  let browser;

  try {
    const url = `https://api.sheva247.site/test/4.php?appId=${appId}&dob=${dob}&appType=${appType}`;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
      Referer: "http://api.sheva247.site",
    });

    await page.setViewport({ width: 1200, height: 2000 });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    page.on("requestfailed", (req) => {
      console.log("❌ Request failed:", req.url(), req.failure());
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const html = await page.content();
    if (html.includes("session has expired")) {
      return NextResponse.json({ error: "Session Expired" }, { status: 403 });
    }
    if (html.includes("error")) {
      return NextResponse.json(
        { error: "কোনও অ্যাপ্লিকেশন পাওয়া যায় নাই" },
        { status: 403 }
      );
    }

    // Generate PDF as buffer and convert to Uint8Array
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    // Convert Buffer to Uint8Array
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Create filename for download
    const filename = `${appId}.pdf`;

    // Create response with Uint8Array
    const response = new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfUint8Array.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

    // Deduct balance and create records after successful PDF generation
    user.balance -= serviceCost;
    reseller.balance += userService.fee;

    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: "DownloadPDF",
      dataSchema: "DownloadPDF",
    });

    await Earnings.create({
      user: user._id,
      reseller: reseller._id,
      service: userService._id,
      amount: userService.fee,
      data: "DownloadPDF",
      dataSchema: "DownloadPDF",
    });

    await reseller.save();
    await user.save();

    return response;

  } catch (err) {
    console.error("❌ PDF Error:", err);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(err) },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// DELETE endpoint is no longer needed since files aren't stored
export async function DELETE() {
  return NextResponse.json(
    { error: "This endpoint is no longer supported" },
    { status: 410 }
  );
}