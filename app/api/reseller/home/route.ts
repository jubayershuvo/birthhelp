import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getReseller } from "@/lib/getReseller";
import Earnings from "@/models/Earnings";
import Withdraw from "@/models/Withdaw";
import "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const reseller = await getReseller();
    if(!reseller) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const earnings = await Earnings.find({reseller: reseller._id}).sort({ createdAt: -1 }).populate('user','name email');
    const withdrawals = await Withdraw.find({user: reseller._id}).sort({ createdAt: -1 });

    const data = {
      earnings,
      withdrawals,
    };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
