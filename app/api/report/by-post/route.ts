import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import { Report } from "@/models/Report";
import Reseller from "@/models/Reseller";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { postId, reason } = body;

    if (!postId || !reason) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    const post = await Post.findById(postId);
    const worker = await Reseller.findById(post.worker);

    if (!post || !worker) {
      return NextResponse.json(
        { error: "Post or worker not found" },
        { status: 404 }
      );
    }
    await Report.create({ reason, user: user._id });

    return NextResponse.json(
      { message: "Post reported successfully", success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
