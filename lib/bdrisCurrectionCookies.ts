
export interface BdrisSessionData {
  cookies: string[];
  csrf: string;
  captchaSrc: string;
  cookieString: string;
}

export async function bdrisCurrectionCookies(): Promise<BdrisSessionData> {
  const baseUrl = "https://bdris.gov.bd";
  const applicationUrl = `${process.env.BDRIS_PROXY}/br/correction`;

  const res = await fetch(applicationUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "X-Requested-With": "XMLHttpRequest",
      Referer: baseUrl,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    cache: "no-store",
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`BDRIS request failed: ${res.status}`);
  }

  /* -------------------- COOKIES -------------------- */
  const rawCookies = res.headers.get("set-cookie") || "";

  const cookiesArr: string[] = [];
  const cookieRegex = /([^\s,=]+=[^;,\s]+)/g;

  let match: RegExpExecArray | null;
  while ((match = cookieRegex.exec(rawCookies)) !== null) {
    cookiesArr.push(match[1]);
  }

  const cookieString = cookiesArr.join("; ");

  /* -------------------- HTML -------------------- */
  const html = await res.text();

  const csrf =
    html.match(/<meta name="_csrf" content="([^"]+)"/)?.[1] || "";

  const captchaMatch = html.match(
    /<img[^>]*id="captcha"[^>]*src="([^"]*)"/
  );
  const captchaSrc = captchaMatch ? captchaMatch[1] : "";

  if (!csrf || !captchaSrc || cookiesArr.length === 0) {
    throw new Error("Failed to extract CSRF / Captcha / Cookies");
  }

  return {
    cookies: cookiesArr,
    csrf,
    captchaSrc,
    cookieString,
  };
}