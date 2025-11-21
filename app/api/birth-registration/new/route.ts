
import { connectDB } from "@/lib/mongodb";
import BirthCertificate from "@/models/BirthCertificate";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    const certificate = await BirthCertificate.create(data);

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Error generating images:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
