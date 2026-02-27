import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { sendOtp } from "@/lib/sendOtp";
import { NextRequest, NextResponse } from "next/server";

const userAgentString =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

// 🔒 এগুলো ফিক্সড থাকবে
const FIXED_PERSON_UBRN = "20007518535017636"; // নিবন্ধন নম্বর (UBRN)
const FIXED_APPLICANT_NAME = "ইয়াবানুর বেগম"; // নাম
const FIXED_RELATION = "SELF";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // এখন body থেকে শুধু phone, cookies, csrf নেব
    const { phone, cookies, csrf, email, personUbrn } = await req.json();

    // personUbrn, applicantName, relation আর body থেকে আশা করব না
    if (!phone || !csrf) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (phone / csrf)" },
        { status: 400 },
      );
    }

    const result = await sendOtp(
      {
        phone: phone,
        personUbrn: "19979612886030271",
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
