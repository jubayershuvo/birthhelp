// app/birth-correction/page.tsx
import BirthCorrectionForm from "@/components/BirthCorrection";
import puppeteer from "puppeteer";

export const runtime = "nodejs"; 

export default async function BirthCorrectionPage() {
  const url = "https://bdris.gov.bd/br/correction";
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for captcha and CSRF
    await page.waitForSelector("#captcha", { timeout: 10000 });

    const captchaSrc = await page.$eval("#captcha", (el) =>
      el.getAttribute("src")
    );

    const csrf = await page.$eval('meta[name="_csrf"]', (el) =>
      el.getAttribute("content")
    );

    const cookies = await browser.cookies();
    const sessionCookies = cookies.map((c) => `${c.name}=${c.value}`);

    await browser.close();

    return (
      <BirthCorrectionForm
        InitData={{
          url,
          cookies: sessionCookies,
          csrf: csrf || "",
          captcha: { src: captchaSrc || "" },
        }}
      />
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return <div>BDRIS main server issue</div>;
  } finally {
    if (browser) await browser.close();
  }
}
