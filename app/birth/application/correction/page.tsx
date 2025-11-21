// app/birth-correction/page.tsx
import BirthCorrectionForm from "@/components/BirthCorrection";

export default async function BirthCorrectionPage() {
  const url = "https://bdris.gov.bd/br/correction";

  try {
    // Fetch the HTML page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Extract cookies from response
    const cookies = response.headers.get("set-cookie");
    const cookiesStr: string = cookies ?? "";

    const cookiesArr: string[] = [];

    // Regex to capture all "key=value" before first semicolon of each cookie
    const cookieRegex = /([^\s,=]+=[^;,\s]+)/g;

    let match: RegExpExecArray | null;
    while ((match = cookieRegex.exec(cookiesStr)) !== null) {
      cookiesArr.push(match[1]);
    }

 

    // Parse HTML to extract required data
    const csrfMatch = html.match(/<meta name="_csrf" content="([^"]*)"/);
    const csrf = csrfMatch ? csrfMatch[1] : null;

    const captchaMatch = html.match(/<img[^>]*id="captcha"[^>]*src="([^"]*)"/);
    const captchaSrc = captchaMatch ? captchaMatch[1] : null;

    return (
      <BirthCorrectionForm
        InitData={{
          url,
          cookies: cookiesArr,
          csrf: csrf || "",
          captcha: { src: captchaSrc || "" },
        }}
      />
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return <div>BDRIS main server issue</div>;
  }
}
