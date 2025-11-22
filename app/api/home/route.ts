import { connectDB } from "@/lib/mongodb";
import Spent from "@/models/Use";
import Transaction from "@/models/Transaction";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    await connectDB();

    const spentList = await Spent.find({}).sort({ createdAt: -1 });
    const recharges = await Transaction.find({}).sort({ createdAt: -1 });

    const data = {
      spentList,
      recharges,
    };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
