import { applicantInfo } from "@/lib/applicantInfo";
import { sendOtp } from "@/lib/sendOtp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if(!data.personUbrn) return NextResponse.json({ error: "Person UBRN is required." }, { status: 400 });
    if(!data.relation) return NextResponse.json({ error: "Relation is required." }, { status: 400 });
    if(!data.applicantName) return NextResponse.json({ error: "Applicant name is required." }, { status: 400 });
    if(!data.applicantBrn) return NextResponse.json({ error: "Applicant BRN is required." }, { status: 400 });
    if(!data.applicantDob) return NextResponse.json({ error: "Applicant DOB is required." }, { status: 400 });
    const aplicant = await applicantInfo(
      {
        ubrn: data.applicantBrn,
        dob: data.applicantDob,
        name: data.applicantName,
        relation: data.relation,
      },
      {
        cookieString: data.session.cookieString,
        csrf: data.session.csrf,
      }
    );
    
    if (!aplicant.success) {
    
      return NextResponse.json(
        { error: aplicant.message || "Failed to fetch applicant information." },
        { status: 404 },
      );

    }
    if (!aplicant.phone) {
      return NextResponse.json(
        { error: "Failed to fetch applicant information." },
        { status: 500 },
      );
    }
    const result = await sendOtp(
      {
        phone: aplicant.phone,
        personUbrn: data.personUbrn,
        relation: data.relation,
        applicantName: data.applicantName,
        applicantBrn: data.applicantBrn,
        applicantDob: data.applicantDob,
      },
      {
        cookieString: data.session.cookies.join("; "),
        csrf: data.session.csrf,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending OTP:", error);
    return new Response("Failed to send OTP", { status: 500 });
  }
}
