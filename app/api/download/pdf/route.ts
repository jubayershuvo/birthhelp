import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-extra";
import Services from "@/models/Services";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";
import Reseller from "@/models/Reseller";
import Spent from "@/models/Use";
import Earnings from "@/models/Earnings";
import File from "@/models/ApplicationPDF";
import path from "path";
import fs from "fs";
export async function GET(request: NextRequest) {
  const urlParams = new URL(request.url);
  const appId = urlParams.searchParams.get("appId");
  const dob = urlParams.searchParams.get("dob");
  const appType = urlParams.searchParams.get("appType");

  if (!appId || !dob || !appType) {
    return NextResponse.json(
      { error: "Missing required parameters" },
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

  const serviceCost = user.isSpecialUser
    ? userService.fee
    : userService.fee + service.fee;

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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

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
      return NextResponse.json(
        { success: false, error: "Session has expired cookie" },
        { status: 401 }
      );
    }

    if (
      html.includes("error") ||
      html.includes("not found") ||
      html.includes("কোনও অ্যাপ্লিকেশন পাওয়া যায় নাই")
    ) {
      return NextResponse.json(
        { success: false, error: "Try again" },
        { status: 404 }
      );
    }

    // Check if we actually got valid content
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (!bodyText || bodyText.length < 100) {
      return NextResponse.json(
        { success: false, error: "Invalid content" },
        { status: 500 }
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
      return NextResponse.json(
        { success: false, error: "Failed to generate PDF" },
        { status: 500 }
      );
    }

    // Folder: /upload/pdf/<user._id>/
    const folderPath = path.join(process.cwd(), "upload", "pdf", `${user._id}`);

    // Create folder if not exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // File path: /upload/pdf/<user._id>/<appId>.pdf
    const filePath = path.join(folderPath, `${appId}.pdf`);

    // Save file
    fs.writeFileSync(filePath, pdfBuffer);

    // Deduct balance and create records after successful PDF generation
    user.balance -= serviceCost;
    const file = await File.create({
      user: user._id,
      path: filePath,
      name: appId,
      type: "pdf",
      title: `Application Pdf`,
    });
    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: file._id,
      dataSchema: "DownloadPDF",
    });
    if (reseller && !user.isSpecialUser) {
      reseller.balance += userService.fee;
      await Earnings.create({
        user: user._id,
        reseller: reseller._id,
        service: userService._id,
        amount: userService.fee,
        data: file._id,
        dataSchema: "DownloadPDF",
      });

      await reseller.save();
    }

    await user.save();

    return NextResponse.json({ file }, { status: 200 });
  } catch (err) {
    console.error("❌ PDF Generation Error:", err);

    // More specific error messages
    if (err instanceof Error) {
      if (err.message.includes("timeout")) {
        return NextResponse.json(
          { success: false, error: "Request timed out" },
          { status: 408 }
        );
      }
      if (err.message.includes("net::ERR")) {
        return NextResponse.json(
          { success: false, error: "Network error" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
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
