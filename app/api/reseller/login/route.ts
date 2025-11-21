// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import Reseller, { IReseller } from "@/models/Reseller";

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const generateTokens = (
  userId: string,
  email: string,
  rememberMe = false
) => {
  const payload = { userId, email, type: "access" } as const;

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: rememberMe ? "30d" : "1d",
  });

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
};

interface LoginRequestBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: LoginRequestBody = await req.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password)
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 }
      );
    if (!validateEmail(email))
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });

    const emailLower = email.toLowerCase().trim();

    // Check if user recently logged in successfully

    await connectDB();

    const user = (await Reseller.findOne({ email: emailLower }).select(
      "+password +isEmailVerified +isActive +loginAttempts +lockUntil"
    )) as IReseller;

    if (!user)
      return NextResponse.json({ message: "No user found" }, { status: 401 });

    if (user.isBanned)
      return NextResponse.json(
        { message: "Account banned", isBanned: true },
        { status: 403 }
      );

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await user.save();
      return NextResponse.json(
        {
          message: `Wrong password`,
        },
        { status: 401 }
      );
    }

    const clientIpHeader = req.headers.get("x-forwarded-for");
    const ip = clientIpHeader ? clientIpHeader.split(",")[0].trim() : "unknown";

    user.lastLogin = new Date();
    user.lastLoginIp = ip;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      rememberMe
    );

    const userWithoutPassword = await Reseller.findById(user._id).select(
      "-password"
    );

    const responseBody = {
      message: "Login successful",
      token: accessToken,
      refreshToken,
      reseller: userWithoutPassword,
      expiresIn: rememberMe ? "30d" : "1d",
    };

    const res = NextResponse.json(responseBody, { status: 200 });
    res.cookies.set({
      name: "resellerRefreshToken",
      value: refreshToken,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    res.cookies.set({
      name: "resellerToken",
      value: accessToken,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// JWT verification for protected routes
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  } catch {
    return null;
  }
};
