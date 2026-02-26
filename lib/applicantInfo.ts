// lib/applicantInfo.ts

interface ApplicantInfoPayload {
  ubrn: string;
  dob: string; // format: DD/MM/YYYY
  name: string;
  relation: string; // GUARDIAN | FATHER | MOTHER etc.
}

interface ApplicantInfoOptions {
  cookieString: string;
  csrf: string;
}

export async function applicantInfo(
  payload: ApplicantInfoPayload,
  options: ApplicantInfoOptions
) {
  const url = `${process.env.BDRIS_PROXY}/api/br/applicant-info`;

  // Form URL Encoded Body (same as curl)
  const body = new URLSearchParams({
    "ubrn[]": payload.ubrn,
    "dob[]": payload.dob,
    name: payload.name,
    relation: payload.relation,
  }).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,bn;q=0.8",
      client: "bris",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: "https://bdris.gov.bd",
      referer: "https://bdris.gov.bd/br/correction",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "x-csrf-token": options.csrf,
      "x-requested-with": "XMLHttpRequest",
      cookie: options.cookieString,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    return JSON.parse(text); // returns error response as JSON
  }

  return res.json(); // returns JSON response
}