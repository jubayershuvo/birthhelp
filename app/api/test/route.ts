import {
  sendNewOrderToReseller,
  sendOrderAcceptedTemplate,
  sendOrderDeliveryTemplate,
  sendOtpTemplate,
  sendUserOrderAcceptedTemplate,
} from "@/lib/whatsAppCloude";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await sendOrderAcceptedTemplate(
      "8801964753086",
      "reseller",
      "service_1",
    );

    return NextResponse.json(
      { message: "Message sent successfully", data: res },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
