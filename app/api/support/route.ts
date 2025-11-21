import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Reseller from "@/models/Reseller";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const supportUser = await Reseller.findById(user.reseller).select(
        '-password -lastLogin -balance -isEmailVerified -isActive -loginAttempts -lockUntil -_id -users -createdAt -updatedAt -__v -isBanned'
    );

    return NextResponse.json(supportUser);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
