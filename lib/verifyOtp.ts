// lib/verifyOtp.ts

interface VerifyOtpPayload {
  otp: string;
  phone: string;
  personUbrn: string;
  relation: string;
  applicantName: string;
  applicantBrn: string;
  applicantDob: string; // DD/MM/YYYY
}

interface VerifyOtpOptions {
  cookieString: string;
  csrf: string;
}

export async function verifyOtp(
  payload: VerifyOtpPayload,
  options: VerifyOtpOptions,
) {
  const baseUrl = "https://bdris.gov.bd";

  const url = new URL(`${process.env.BDRIS_PROXY}/api/otp/verify`);

  // Add query parameters
  url.searchParams.set("otp", payload.otp);
  url.searchParams.set("appType", "BIRTH_INFORMATION_CORRECTION_APPLICATION");
  url.searchParams.set("personUbrn", payload.personUbrn);
  url.searchParams.set("phone", payload.phone);
  url.searchParams.set("geoLocationId", "0");
  url.searchParams.set("email", "");
  url.searchParams.set("officeId", "0");
  url.searchParams.set("relation", payload.relation);
  url.searchParams.set("applicantName", payload.applicantName);
  url.searchParams.set("applicantBrn", payload.applicantBrn);
  url.searchParams.set("applicantDob", payload.applicantDob);
  url.searchParams.set("officeAddressType", "");

  // Prepare form body with CSRF token
  const body = new URLSearchParams({
    _csrf: options.csrf,
  }).toString();

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,bn;q=0.8",
      client: "bris",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: baseUrl,
      referer: `${baseUrl}/br/correction`,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "x-csrf-token": options.csrf,
      "x-requested-with": "XMLHttpRequest",
      cookie: options.cookieString,
    },
    body,
  });

  const text = await res.text();

  try {
    const data = JSON.parse(text);

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid OTP verification response (not JSON)");
    }
    throw error;
  }
}
