
import { sendNewOrderToReseller, sendOtpTemplate } from "@/lib/whatsAppCloude";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // await sendOtpTemplate("8801964753086", "123456");
    await sendNewOrderToReseller("8801964753086", "service", "user");
    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
