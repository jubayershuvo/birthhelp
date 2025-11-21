import BirthRegistrationForm from "@/components/BirthApplication";

export default async function BirthApplicationPage() {
  const url = "https://bdris.gov.bd/br/application";

  // Fetch the BDRIS page (this gives us HTML + cookies)
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
  });

  const html = await res.text();

  // Extract CSRF token from meta tag
  const csrfToken =
    html.match(/<meta name="_csrf" content="([^"]+)"/)?.[1] || "";

  // Extract Set-Cookie from server response
  const rawCookies = res.headers.get("set-cookie") || "";
  console.log(rawCookies)
  // Format cookies for later use
  const cookieString = rawCookies
    .split(",")
    .map((c) => c.split(";")[0])
    .join("; ");

  return (
    <BirthRegistrationForm
      csrf={csrfToken}
      cookieString={cookieString}
    />
  );
}
