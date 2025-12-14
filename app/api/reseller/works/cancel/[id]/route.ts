// app/api/reseller/works/accept/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import Service from "@/models/PostService";
import { getReseller } from "@/lib/getReseller";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database
    await connectDB();

    const { id: postId } = await params;
    const { note } = await request.json();

    // Check if user exists and is a reseller/worker
    const user = await getReseller();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Find the post
    const post = await Post.findById(postId).populate({
      path: "service",
      model: Service,
      select: "title amount",
    });
    const poster = await User.findById(post.user);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Work not found" },
        { status: 404 }
      );
    }

    // Check if post is available (status: pending)
    if (post.status !== "processing") {
      return NextResponse.json(
        {
          success: false,
          message: `Can't cancel work with status ${post.status}`,
        },
        { status: 400 }
      );
    }

    // Check if post already has a worker assigned
    if (post.worker.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "Unathorized: Work already has a worker assigned",
        },
        { status: 400 }
      );
    }

    post.status = "cancelled";
    post.updatedAt = new Date();
    post.note = note;
    poster.balance += post.admin_fee + post.worker_fee + post.reseller_fee;
    await Transaction.create({
      user: poster._id,
      amount: post.admin_fee + post.worker_fee + post.reseller_fee,
      trxId: "REFUND",
      number: "Refunded",
      method: "ADMIN",
      status: "SUCCESS",
    });
    await poster.save();
    await post.save();

    return NextResponse.json({
      success: true,
      message: "Work cancelled successfully",
      post: {
        _id: post._id,
        service: post.service,
        description: post.description,
        files: post.files,
        status: post.status,
        user: post.user,
        worker: post.worker,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error cancelling work:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel work",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
