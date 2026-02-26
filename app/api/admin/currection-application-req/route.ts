import { connectDB } from "@/lib/mongodb";
import CorrectionApplication from "@/models/CurrectionReq";
import { NextResponse } from "next/server";

import "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const applications = await CorrectionApplication.find().populate("user", "name email").sort({
      createdAt: -1,
    });
    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "An error occurred while fetching correction application requests.",
      },
      { status: 500 },
    );
  }
}
