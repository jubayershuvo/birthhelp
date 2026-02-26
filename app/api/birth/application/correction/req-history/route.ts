import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import CorrectionApplication from "@/models/CurrectionReq";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const history = await CorrectionApplication.find({ user: user._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching request history",
      },
      { status: 500 },
    );
  }
}
