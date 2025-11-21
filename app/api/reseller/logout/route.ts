import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  (await cookieStore).delete("resellerToken");
  (await cookieStore).delete("resellerRefreshToken");

  return Response.json({ success: true }, { status: 200 });
}
