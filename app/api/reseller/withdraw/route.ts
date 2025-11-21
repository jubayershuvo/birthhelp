import { getReseller } from "@/lib/getReseller";
import { connectDB } from "@/lib/mongodb";
import Reseller from "@/models/Reseller";
import Withdraw from "@/models/Withdaw";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const db = await connectDB();
    const reseller = await getReseller();

    if (!reseller) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await db.collection("datas").findOne();

    if (!data) {
      return NextResponse.json({ message: "Data not found" }, { status: 404 });
    }

    const calculateFee = (amount: number): number => {
      const fee = (amount * data.percentage) / 100;
      return Math.ceil(fee); // Round up to nearest integer
    };

    const body = await request.json();
    const { amount, number, method } = body;

    if (!amount || !number || !method) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const fee = calculateFee(amount);
    const netAmount = amount + fee;

    await Withdraw.create({
      user: reseller._id,
      amount,
      fee,
      method,
      number,
      status: "pending",
      note: "Withdrawal request.",
    });
    reseller.balance -= netAmount;
    await reseller.save();
    const allWithdrawals = await Withdraw.find({ user: reseller._id }).sort({
      createdAt: -1,
    });

    const newReseller = await Reseller.findById(reseller._id).lean();
    return NextResponse.json(
      { withdrawals: allWithdrawals, reseller: newReseller, success: true },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
