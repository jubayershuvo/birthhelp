import { connectDB } from "@/lib/mongodb";
import PostService from "@/models/PostService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const services = await PostService.find({}).sort({ createdAt: -1 });
    return NextResponse.json(services || []);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
