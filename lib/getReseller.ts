// lib/getUser.ts
import { cookies, headers } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import Reseller from "@/models/Reseller";

interface TokenPayload extends JwtPayload {
  userId: string;
}

export async function getReseller() {
  try {
    const headerList = headers();
    const cookieStore = cookies();

    // 1️⃣ Try from Bearer token (Authorization header)
    const authHeader = (await headerList).get("authorization");
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2️⃣ Fallback to cookie token
    if (!token) {
      token = (await cookieStore).get("resellerToken")?.value || null;
    }

    // 3️⃣ If no token found → unauthenticated
    if (!token) return null;

    // 4️⃣ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    if (!decoded?.userId) return null;

    // 5️⃣ Fetch user
    const reseller = await Reseller.findById(decoded.userId).select(
      "+password"
    );
    return reseller;
  } catch (err) {
    console.error("❌ getUser error:", err);
    return null;
  }
}
