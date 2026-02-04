import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthRegistration from "@/models/BirthRegistration";
import CorrectionApplication from "@/models/Currection";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(request: NextRequest) {
  const urlParams = new URL(request.url);
  const appId = urlParams.searchParams.get("appId");
  const appType = urlParams.searchParams.get("appType");

  if (!appId || !appType) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  await connectDB();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if(user.balance < 10){
    return NextResponse.json({ error: "Insufficient balance" }, { status: 402 });
  }

  let dob;

  if (appType === "br") {
    const application = await BirthRegistration.findOne({
      applicationId: appId,
    });
    if (!application) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }
    if (application.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "No access" }, { status: 401 });
    } else {
      dob = application.personInfoForBirth.personBirthDate;
    }
  }

  if (appType === "br_correction") {
    const application = await CorrectionApplication.findOne({
      applicationId: appId,
    });
    if (!application || !application.dob || !application.user) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }
    if (application.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "No access" }, { status: 401 });
    } else {
      dob = application.dob;
    }
  }

  if(!dob){
    return NextResponse.json({ error: "Data not found" }, { status: 404 });
  }

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

    // Wait for network to be idle and content to load
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const html = await page.content();

    if (html.includes("session has expired")) {
      return NextResponse.json(
        { success: false, error: "Session has expired cookie" },
        { status: 401 },
      );
    }

    if (
      html.includes("error") ||
      html.includes("not found") ||
      html.includes("কোনও অ্যাপ্লিকেশন পাওয়া যায় নাই")
    ) {
      return NextResponse.json(
        { success: false, error: "Try again" },
        { status: 404 },
      );
    }

    // Check if we actually got valid content
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (!bodyText || bodyText.length < 100) {
      return NextResponse.json(
        { success: false, error: "Invalid content" },
        { status: 500 },
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
        { status: 500 },
      );
    }

    user.balance -= 10;
    await user.save();

    //send the pdf buffer file
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${appId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("❌ PDF Generation Error:", err);

    // More specific error messages
    if (err instanceof Error) {
      if (err.message.includes("timeout")) {
        return NextResponse.json(
          { success: false, error: "Request timed out" },
          { status: 408 },
        );
      }
      if (err.message.includes("net::ERR")) {
        return NextResponse.json(
          { success: false, error: "Network error" },
          { status: 500 },
        );
      }
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
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
    { status: 410 },
  );
}
