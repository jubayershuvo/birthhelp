import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// Types for environment variables
interface ProcessEnv {
  BDRIS_COOKIE?: string;
  COOKIE_REFRESH_MIN?: string;
  ENABLE_DEBUG_COOKIE?: string;
  IGNORE_TLS?: string;
}

// Constants
const BDRIS_HOME = `${process.env.BDRIS_PROXY}`;
const BDRIS_API_BASE = `${process.env.BDRIS_PROXY}/v1/api/geo/parentGeoIdWithGeoGroupAndGeoOrder/`;
const COOKIE_REFRESH_MIN = parseInt(
  (process.env as ProcessEnv).COOKIE_REFRESH_MIN || "15",
  10
);

// Cookie jar implementation using Map (simplified tough-cookie functionality)
class CookieJar {
  private cookies: Map<
    string,
    { value: string; domain: string; path: string; expires?: Date }
  > = new Map();
  private lastCookieFetch: number = 0;

  async getCookieString(url: string): Promise<string> {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const validCookies: string[] = [];

    // Clean expired cookies
    for (const [key, cookie] of this.cookies.entries()) {
      if (cookie.expires && cookie.expires.getTime() < now) {
        this.cookies.delete(key);
        continue;
      }

      if (
        this.domainMatch(domain, cookie.domain) &&
        url.startsWith(cookie.path)
      ) {
        validCookies.push(`${key}=${cookie.value}`);
      }
    }

    return validCookies.join("; ");
  }

  setCookie(cookieStr: string, url: string): void {
    try {
      const domain = new URL(url).hostname;
      const [nameValue, ...attributes] = cookieStr
        .split(";")
        .map((attr) => attr.trim());
      const [name, value] = nameValue.split("=");

      if (!name || !value) return;

      const cookie: {
        value: string;
        domain: string;
        path: string;
        expires?: Date;
      } = {
        value,
        domain,
        path: "/",
      };

      // Parse attributes
      for (const attr of attributes) {
        const [attrName, attrValue] = attr.split("=").map((a) => a.trim());
        const lowerAttr = attrName.toLowerCase();

        if (lowerAttr === "domain" && attrValue) {
          cookie.domain = attrValue.startsWith(".")
            ? attrValue.slice(1)
            : attrValue;
        } else if (lowerAttr === "path" && attrValue) {
          cookie.path = attrValue;
        } else if (lowerAttr === "expires" && attrValue) {
          cookie.expires = new Date(attrValue);
        } else if (lowerAttr === "max-age" && attrValue) {
          cookie.expires = new Date(Date.now() + parseInt(attrValue) * 1000);
        }
      }

      this.cookies.set(name, cookie);
    } catch (error) {
      console.warn("Failed to parse cookie:", cookieStr);
    }
  }

  private domainMatch(hostname: string, domain: string): boolean {
    return hostname === domain || hostname.endsWith("." + domain);
  }

  getLastCookieFetch(): number {
    return this.lastCookieFetch;
  }

  setLastCookieFetch(time: number): void {
    this.lastCookieFetch = time;
  }

  async getCookies(
    url: string
  ): Promise<Array<{ key: string; value: string }>> {
    const cookieString = await this.getCookieString(url);
    return cookieString
      .split(";")
      .map((pair) => {
        const [key, value] = pair.split("=").map((s) => s.trim());
        return { key, value: value || "" };
      })
      .filter((cookie) => cookie.key);
  }
}

// Global cookie jar instance
const jar = new CookieJar();

/**
 * Perform a GET request with cookie handling
 */
async function fetchWithCookies(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieString = await jar.getCookieString(BDRIS_HOME);
  const headers = new Headers(options.headers);

  if (cookieString) {
    headers.set("Cookie", cookieString);
  }

  // Add required headers if not present
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/plain, */*");
  }
  if (!headers.has("Referer")) {
    headers.set("Referer", BDRIS_HOME);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    // Note: In a real production environment, you might want more sophisticated TLS handling
  });

  // Handle Set-Cookie headers
  const setCookieHeaders = response.headers.getSetCookie();
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    console.log(
      `fetchWithCookies: received ${setCookieHeaders.length} Set-Cookie headers from ${url}`
    );
    for (const cookie of setCookieHeaders) {
      jar.setCookie(cookie, BDRIS_HOME);
    }
  }

  return response;
}

/**
 * Ensure we have valid BDRIS cookies
 */
async function ensureBdrisCookies(): Promise<void> {
  try {
    const cookieString = await jar.getCookieString(BDRIS_HOME);
    const now = Date.now();
    const lastFetch = jar.getLastCookieFetch();
    const ageMin = lastFetch ? (now - lastFetch) / 60000 : Infinity;

    console.log(
      `Cookie jar state before ensure: length=${cookieString.length} ageMin=${
        ageMin === Infinity ? "∞" : ageMin.toFixed(2)
      }`
    );

    if (cookieString && ageMin < COOKIE_REFRESH_MIN) {
      console.log("Cookies are fresh enough; skipping homepage fetch.");
      return;
    }

    console.log("Fetching BDRIS homepage to acquire cookies...");
    const homeResponse = await fetchWithCookies(BDRIS_HOME, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    jar.setLastCookieFetch(Date.now());

    const setCookieHeaders = homeResponse.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      console.log(
        `Received Set-Cookie headers (${setCookieHeaders.length}) from homepage:`
      );
      setCookieHeaders.forEach((c, i) => {
        console.log(
          `  [${i}] ${String(c).slice(0, 300)}${
            String(c).length > 300 ? "…" : ""
          }`
        );
      });
    } else {
      console.log("No Set-Cookie headers received from BDRIS homepage.");
    }

    // Log cookies now in jar
    const cookieStringAfter = await jar.getCookieString(BDRIS_HOME);
    console.log(
      `Cookie string (after homepage): length=${cookieStringAfter.length}`
    );
    const cookiesInJar = await jar.getCookies(BDRIS_HOME);
    if (cookiesInJar && cookiesInJar.length) {
      console.log(
        `Cookies in jar (${cookiesInJar.length}): ${cookiesInJar
          .map((c) => c.key)
          .join(", ")}`
      );
    } else {
      console.log("Cookie jar still empty after homepage fetch.");
    }
  } catch (err) {
    console.error("Failed to fetch homepage for cookies:", err);
    throw err;
  }
}

/**
 * Build BDRIS API URL
 */
function buildBdrisUrl(
  parent: number,
  geoOrder: number,
  geoType: string,
  geoGroup: string = "birthPlace",
  ward: boolean = false
): string {
  const p = encodeURIComponent(String(parent));
  const go = encodeURIComponent(String(geoOrder));
  const gt = encodeURIComponent(String(geoType));
  const gg = encodeURIComponent(String(geoGroup));
  let url = `${BDRIS_API_BASE}${p}?geoGroup=${gg}&geoOrder=${go}&geoType=${gt}`;
  if (ward) url += "&ward=true";
  return url;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse and validate parameters
  const parent =
    searchParams.get("parent") &&
    /^\d+$/.test(String(searchParams.get("parent")))
      ? parseInt(searchParams.get("parent")!, 10)
      : 1;

  const geoOrder =
    searchParams.get("geoOrder") &&
    /^\d+$/.test(String(searchParams.get("geoOrder")))
      ? parseInt(searchParams.get("geoOrder")!, 10)
      : 0;

  let geoType = searchParams.get("geoType") || "0";
  if (!/^(?:\d+|7Cantonment)$/.test(geoType)) geoType = "0";

  const allowedGroups = new Set([
    "birthPlace",
    "presentAddress",
    "permanentAddress",
  ]);
  const geoGroup = allowedGroups.has(searchParams.get("geoGroup") || "")
    ? searchParams.get("geoGroup")!
    : "birthPlace";

  const wantWard = searchParams.get("ward") === "true";
  const allowWard =
    geoOrder === 4 ||
    (geoOrder === 3 && (geoType === "7" || geoType === "7Cantonment"));
  const ward = wantWard && allowWard;

  const url = buildBdrisUrl(parent, geoOrder, geoType, geoGroup, ward);

  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Ensure cookies exist or fetch homepage
    await ensureBdrisCookies();

    // Optionally seed jar from BDRIS_COOKIE env if still empty
    if ((process.env as ProcessEnv).BDRIS_COOKIE) {
      const current = await jar.getCookieString(BDRIS_HOME);
      if (!current || current.length === 0) {
        console.log("Seeding cookie jar from BDRIS_COOKIE env var (one-time).");
        const cookiePairs = (process.env as ProcessEnv)
          .BDRIS_COOKIE!.split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const pair of cookiePairs) {
          jar.setCookie(pair + "; Domain=bdris.gov.bd; Path=/", BDRIS_HOME);
        }
        const after = await jar.getCookieString(BDRIS_HOME);
        console.log(`Cookie jar seeded; length now=${after.length}`);
      }
    }

    console.log(`Proxying to BDRIS API: ${url}`);
    const start = Date.now();
    const upstreamResponse = await fetchWithCookies(url);
    const duration = Date.now() - start;

    console.log(
      `BDRIS API: ${upstreamResponse.status} | ${duration}ms | Parent: ${parent} | GeoOrder: ${geoOrder}`
    );

    // Get response body
    const responseBody = await upstreamResponse.text();

    // Create response with CORS headers
    const response = new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });

    // Copy relevant headers
    const interestingHeaders = [
      "content-type",
      "content-length",
      "cache-control",
      "date",
    ];
    interestingHeaders.forEach((header) => {
      const value = upstreamResponse.headers.get(header);
      if (value) {
        response.headers.set(header, value);
      }
    });

    return response;
  } catch (err) {
    console.error("BDRIS fetch error:", err);

    const errorResponse = {
      error: "Upstream fetch failed",
      message: err instanceof Error ? err.message : "Unknown error",
      url,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, {
      status: 502,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
