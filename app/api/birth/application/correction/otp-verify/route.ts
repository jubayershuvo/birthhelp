import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { verifyOtp } from "@/lib/verifyOtp";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const { personUbrn, cookies, csrf, phone, email, otp } = await req.json();

    if (!personUbrn || !phone || !csrf) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const result = await verifyOtp(
      {
        otp,
        phone,
        personUbrn,
        relation: "GUARDIAN",
        applicantName: "RABEYA AKTER",
        applicantBrn: "19979612886030271",
        applicantDob: "05/07/1997",
      },
      {
        cookieString: cookies.join("; "),
        csrf,
      },
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    console.error("BDRIS request error:", err);

    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Internal server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
