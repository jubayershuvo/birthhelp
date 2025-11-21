import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  (await cookieStore).delete("token");
  (await cookieStore).delete("refreshToken");

  return Response.json({ success: true }, { status: 200 });
}
