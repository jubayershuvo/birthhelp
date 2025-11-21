import { getReseller } from "@/lib/getReseller";
import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdaw";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const reseller = await getReseller();

    if (!reseller) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const withdrawals = await Withdraw.find({ user: reseller._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ withdrawals, success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
