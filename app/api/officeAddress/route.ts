import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, geoOrder, geoType, cookie, csrf } = body;
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!id || !geoOrder || !geoType || !cookie || !csrf) {
      console.log(id, geoOrder, geoType, cookie, csrf);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cityUrl = `https://bdris.gov.bd/v1/api/geo/parentGeoIdWithGeoGroupAndGeoOrder/${id}?geoGroup=officeAddr&geoOrder=${geoOrder}&geoType=${geoType}`;
    const officeUrl = `https://bdris.gov.bd/api/office/find-office-geo-projection-by-geo-id/${id}?geoGroup=officeAddr&geoOrder=${geoOrder}&geoType=${geoType}`;
    const url = geoOrder === "0" ? cityUrl : officeUrl;
    const headers = new Headers({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "X-Requested-With": "XMLHttpRequest",
      "X-Csrf-Token": csrf,
      Referer: "https://bdris.gov.bd/br/application",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "Sec-GPC": "1",
      Cookie: cookie, // must include full browser cookies
    });

    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
