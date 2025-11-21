import BirthCertificate from "@/models/BirthCertificate";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }
    const certificate = await BirthCertificate.findById(id);
    return NextResponse.json(certificate);
  } catch (error) {
    return NextResponse.json({
      status: 500,
    });
  }
}
