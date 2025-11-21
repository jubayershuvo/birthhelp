import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, trxId, number } = body;

    // Validate fields
    if (!amount || !trxId || !number) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await connectDB();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Prevent duplicate trxId for same user
    const existingTrx = await Transaction.findOne({
      trxId,
    });

    if (existingTrx) {
      return NextResponse.json(
        { error: "Transaction ID already submitted" },
        { status: 400 }
      );
    }

    // Save new transaction
    await Transaction.create({
      user: user._id,
      amount,
      trxId,
      number,
      method: "Bkash",
      status: "SUCCESS",
    });

    user.balance += Number(amount);
    await user.save();
    const userWithoutPassword = await User.findById(user._id).select(
      "-password"
    );
    // Get all transactions sorted (latest first)
    const allTransactions = await Transaction.find({ user: user._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        success: true,
        transactions: allTransactions,
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Transaction API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
