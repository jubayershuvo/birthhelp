// app/api/scrape/route.ts
import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

export async function GET() {
  const url = "https://bdris.gov.bd/br/correction";
  let browser;

  try {
    await connectDB();
    const user = await getUser();
    if(!user){
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for the captcha image to appear
    await page.waitForSelector("#captcha", { timeout: 10000 });

    const captchaSrc = await page.$eval("#captcha", el => el.getAttribute("src"));
    const csrf = await page.$eval('meta[name="_csrf"]', el => el.getAttribute("content"));

    const cookies = await browser.cookies();
    const sessionCookies = cookies.map(c => `${c.name}=${c.value}`);
    return NextResponse.json({
      url,
      cookies: sessionCookies,
      csrf,
      captcha: {
        src: captchaSrc,
      },
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
