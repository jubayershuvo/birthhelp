import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await connectDB();
    const dataCount = await db.collection("datas").countDocuments();
    if (dataCount === 0) {
      db.collection("datas").insertOne({
        percentage: 0,
      });
    }
    const data = await db.collection("datas").findOne();
    NextResponse.json(data);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
