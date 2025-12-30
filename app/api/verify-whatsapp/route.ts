
import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { verifyOtp } from "@/lib/otp";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { whatsapp, otp } = body;

    if (!whatsapp || !otp) {
      return NextResponse.json(
        { error: "WhatsApp number and OTP are required" },
        { status: 400 }
      );
    }

    const formattedWhatsapp = whatsapp.startsWith("+")
      ? whatsapp.replace(/\s+/g, "")
      : `+${whatsapp.replace(/\s+/g, "")}`;
    await connectDB();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isOtpValid = verifyOtp(otp, formattedWhatsapp);
    if (isOtpValid) {
      user.whatsapp = formattedWhatsapp;
      await user.save();

      const newUser = await User.findById(user._id).select("-password");
      return NextResponse.json(
        { message: "OTP is valid", user: newUser },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
