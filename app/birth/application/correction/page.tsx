// app/birth-correction/page.tsx
import BirthCorrectionForm from "@/components/BirthCorrection";
import { getUser } from "@/lib/getUser";
import User from "@/models/User";
import puppeteer from "puppeteer";

export const runtime = "nodejs"; // Required for Puppeteer
export const dynamic = "force-dynamic";

export default async function BirthCorrectionPage() {
  try {
    const user = await getUser();
    const pathname = "/birth/application/correction";
    // how to use pathname here?
    if (!user || !user._id) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">User Not Found</p>
            <p className="text-gray-600 mt-2">Please log in to continue.</p>
          </div>
        </div>
      );
    }

    const userWithServices = await User.findById(user._id).populate(
      "services.service"
    );

    const services = userWithServices.services || [];

    const foundService = services.find(
      (s: { service: { href: string } }) => s.service.href === pathname
    );

    if (foundService.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Service Not Found
            </h1>
            <p className="text-gray-600 mt-2">Contact your provider.</p>
          </div>
        </div>
      );
    }

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
  } catch (error) {
    return <div>server issue</div>;
  }
}
