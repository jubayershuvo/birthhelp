import { NextResponse } from "next/server";
import puppeteer from "puppeteer-extra";
import fs from "fs";
import path from "path";
import os from "os";
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

  try {
    const url = `https://api.sheva247.site/test/4.php?appId=${appId}&dob=${dob}&appType=${appType}`;

    const browser = await puppeteer.launch({
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
      await browser.close();
      return NextResponse.json({ error: "Session Expired" }, { status: 403 });
    }
    if (html.includes("error")) {
      await browser.close();
      return NextResponse.json(
        { error: "কোনও অ্যাপ্লিকেশন পাওয়া যায় নাই" },
        { status: 403 }
      );
    }

    // Create public directory path for PDFs
    const publicDir = path.join(process.cwd(), "public", "pdfs");

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Create filename with timestamp to avoid conflicts
    const filename = `${appId}.pdf`;
    const pdfPath = path.join(publicDir, filename);

    // Generate PDF and save to public folder
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    // Generate static URL for the PDF
    const pdfUrl = `/pdfs/${filename}`;

    // Deduct balance and create records
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
    // Return the static URL instead of the file
    return NextResponse.json({
      success: true,
      pdfUrl: pdfUrl,
      filename: filename,
      message: "PDF generated successfully",
    });
  } catch (err) {
    console.error("❌ PDF Error:", err);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(err) },
      { status: 500 }
    );
  }
}

// Optional: Add cleanup endpoint to delete old PDFs
export async function DELETE(request: Request) {
  try {
    const urlParams = new URL(request.url);
    const filename = urlParams.searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    const publicDir = path.join(process.cwd(), "public", "pdfs");
    const filePath = path.join(publicDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (err) {
    console.error("❌ File deletion error:", err);
    return NextResponse.json(
      { error: "File deletion failed", details: String(err) },
      { status: 500 }
    );
  }
}
