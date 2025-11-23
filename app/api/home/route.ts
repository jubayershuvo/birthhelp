import { connectDB } from "@/lib/mongodb";
import Spent from "@/models/Use";
import Transaction from "@/models/Transaction";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/getUser";


export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if(!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const spentList = await Spent.find({user: user._id}).sort({ createdAt: -1 });
    const recharges = await Transaction.find({user: user._id}).sort({ createdAt: -1 });

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
