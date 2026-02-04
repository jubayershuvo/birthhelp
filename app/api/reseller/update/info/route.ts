import { getReseller } from "@/lib/getReseller";
import { connectDB } from "@/lib/mongodb";
import { generateOtp } from "@/lib/otp";
import { sendWhatsAppText } from "@/lib/whatsappApi";
import Reseller from "@/models/Reseller";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, telegramId, whatsapp } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Avatar is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const user = await getReseller();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const existingEmailUser = await Reseller.findOne({
      email,
      _id: { $ne: user._id },
    });
    if (existingEmailUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    user.name = name;
    user.phone = phone;
    user.telegramId = telegramId;

    await user.save();
    if (email && email !== user.email) {
      const existingUser = await Reseller.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      user.email = email;
      await user.save();
    }
    const newUser = await Reseller.findById(user._id);
    if (whatsapp && whatsapp !== user.whatsapp) {
      const existingUser = await Reseller.findOne({ whatsapp });
      if (existingUser) {
        return NextResponse.json(
          { error: "WhatsApp number already in use" },
          { status: 400 }
        );
      }
      try {
        const otp = generateOtp(whatsapp);
       await sendWhatsAppText(whatsapp, `Your verification code is: ${otp}`);
      } catch (error) {
        console.log(error);
      }
      return NextResponse.json(
        { user: newUser, redirect: `/reseller/verify?whatsapp=${whatsapp}` },
        { status: 200 }
      );
    }

    return NextResponse.json({ user: newUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
