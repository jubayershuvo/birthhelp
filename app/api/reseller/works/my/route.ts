import { getReseller } from "@/lib/getReseller";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import "@/models/PostService";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const reseller = await getReseller();
    const myWorks = await Post.find({ worker: reseller._id })
      .populate("service")
      .sort({
        createdAt: -1,
      });
    return NextResponse.json(
      { posts: myWorks, success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
