import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Services from "@/models/Services";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/birth/certificate";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString(),
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 },
      );
    }
    const serviceCost = user.isSpecialUser
      ? userService.fee
      : userService.fee + service.fee;
    const sessionUrl =
      "https://my.applicationzone.top/api/birth_test/fetch_captcha.php";
    const response = await fetch(sessionUrl);

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: 500 });
    }
    const sendData = {
      session_id: data.session_id,
      captcha_image: data.captcha_image,
      csrf_token: data.csrf_token,
      captcha_de_text: data.captcha_de_text,
    };
    return NextResponse.json({
      data: sendData,
      serviceCost,
      success: true,
      note: service.note,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
