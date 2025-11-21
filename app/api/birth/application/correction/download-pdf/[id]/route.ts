import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { connectDB } from "@/lib/mongodb";
import Currection from "@/models/Currection";
import { getUser } from "@/lib/getUser";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let browser = null;

  try {
    const { id } = await params;

    await connectDB();

    // For production - uncomment this section
    const application = await Currection.findById(id);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const targetURL = application.printLink || "";

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set realistic browser settings
    await page.setViewport({ width: 1366, height: 768 });

    // Set security headers
    await page.setExtraHTTPHeaders({
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Sec-CH-UA":
        '"Chromium";v="120", "Google Chrome";v="120", "Not=A?Brand";v="99"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Upgrade-Insecure-Requests": "1",
    });

    // Override window.print
    await page.evaluateOnNewDocument(() => {
      window.print = () => {};
    });

    // First, navigate to the main correction page to establish session
    const mainPageResponse = await page.goto(
      "https://bdris.gov.bd/br/correction",
      {
        waitUntil: "networkidle0",
        timeout: 30000,
      }
    );

    if (!mainPageResponse || !mainPageResponse.ok()) {
      throw new Error(
        `Failed to load main page: ${mainPageResponse?.status()}`
      );
    }

    // Use page.evaluate for timeout instead of waitForTimeout
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 2000))
    );

    // Now navigate to the target PDF URL with the established cookies
    const pdfResponse = await page.goto(targetURL, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    if (!pdfResponse || !pdfResponse.ok()) {
      throw new Error(`Failed to load PDF page: ${pdfResponse?.status()}`);
    }

    const currentUrl = page.url();

    // Check if we're redirected to login or session expired
    const pageContent = await page.content();

    if (
      pageContent.toLowerCase().includes("session expired") ||
      pageContent.toLowerCase().includes("sign in") ||
      pageContent.toLowerCase().includes("login") ||
      currentUrl.includes("login")
    ) {
      throw new Error(
        "Session expired or authentication required. Redirected to: " +
          currentUrl
      );
    }

    // Wait for the content to be fully rendered
    try {
      await page.waitForSelector("body", { timeout: 10000 });
      console.log("Body content loaded successfully");
    } catch (e) {
      console.log("Body selector timeout, but continuing...");
    }

    // Optional: Wait for specific content that indicates the application is loaded
    try {
      await page.waitForFunction(() => document.body.innerText.length > 100, {
        timeout: 5000,
      });
      console.log("Substantial content detected");
    } catch (e) {
      console.log("No substantial content wait, continuing...");
    }

    // Get the scroll height for PDF
    const scrollHeight = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      width: "794px", // A4 width
      height: `${Math.min(scrollHeight, 10000)}px`, // Cap at 10000px
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: false,
      margin: {
        top: "10px",
        right: "10px",
        bottom: "10px",
        left: "10px",
      },
    });

    await browser.close();

    // Return PDF
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="application-${application.applicationId}.pdf"`,
      },
    });
  } catch (err: unknown) {
    if (browser) {
      await browser.close();
    }

    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: errorMessage,
        details: "Failed to establish session with the target website",
      },
      { status: 500 }
    );
  }
}
