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
    return NextResponse.redirect(
      new URL(
        `/application/download/pdf?error=Missing required fields`,
        request.url
      )
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
    return NextResponse.redirect(
      new URL(`/application/download/pdf?error=Service not found`, request.url)
    );
  }

  const userService = user.services.find(
    (s: { service: string }) => s.service.toString() === service._id.toString()
  );
  if (!userService) {
    return NextResponse.redirect(
      new URL(
        `/application/download/pdf?error=User does not have access to this service`,
        request.url
      )
    );
  }

  const serviceCost = userService.fee + service.fee;

  if (user.balance < serviceCost) {
    return NextResponse.redirect(
      new URL(
        `/application/download/pdf?error=Insufficient balance`,
        request.url
      )
    );
  }

  const reseller = await Reseller.findById(user.reseller);
  let browser;

  try {
    const url = `https://api.sheva247.site/test/4.php?appId=${appId}&dob=${dob}&appType=${appType}`;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Upgrade-Insecure-Requests": "1",
      Referer: "http://api.sheva247.site",
    });

    await page.setViewport({ width: 1200, height: 2000 });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    page.on("requestfailed", (req) => {
      console.log("❌ Request failed:", req.url(), req.failure());
    });

    page.on("console", (msg) => {
      console.log("PAGE LOG:", msg.text());
    });

    // Wait for network to be idle and content to load
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const html = await page.content();

    if (html.includes("session has expired")) {
      return NextResponse.redirect(
        new URL(
          `/application/download/pdf?error=Session has expired`,
          request.url
        )
      );
    }

    if (
      html.includes("error") ||
      html.includes("not found") ||
      html.includes("কোনও অ্যাপ্লিকেশন পাওয়া যায় নাই")
    ) {
      return NextResponse.redirect(
        new URL(
          `/application/download/pdf?error=কোনও অ্যাপ্লিকেশন পাওয়া যায় নাই`,
          request.url
        )
      );
    }

    // Check if we actually got valid content
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (!bodyText || bodyText.length < 100) {
      return NextResponse.redirect(
        new URL(`/application/download/pdf?error=Invalid content`, request.url)
      );
    }

    // Generate PDF as buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      timeout: 30000,
    });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Generated PDF is empty");
    }

    // Create filename for download
    const filename = `${appId}.pdf`;

    // Convert buffer to Blob or use ArrayBuffer for proper response
    const pdfArrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );

    // Create response with proper body type
    const response = new NextResponse(pdfArrayBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Filename": filename,
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
    console.error("❌ PDF Generation Error:", err);

    // More specific error messages
    if (err instanceof Error) {
      if (err.message.includes("timeout")) {
        return NextResponse.redirect(
          new URL(`/application/download/pdf?error=Timeout`, request.url)
        );
      }
      if (err.message.includes("net::ERR")) {
        return NextResponse.redirect(
          new URL(`/application/download/pdf?error=Network error`, request.url)
        );
      }
    }

    return NextResponse.redirect(
      new URL(
        `/application/download/pdf?error=Failed to generate PDF`,
        request.url
      )
    );
  } finally {
    if (browser) {
      await browser.close().catch(console.error);
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
