import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const services = await Post.find({ status: "pending" }).populate("service").sort({
      createdAt: -1,
    });
    return NextResponse.json({ posts: services, success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
