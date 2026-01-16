// app/api/reseller/works/accept/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import Service from "@/models/PostService";
import { getReseller } from "@/lib/getReseller";
import User from "@/models/User";
import { sendWhatsAppText } from "@/lib/whatsapp";
import Reseller from "@/models/Reseller";
import {
  sendOrderAcceptedTemplate,
  sendUserOrderAcceptedTemplate,
} from "@/lib/whatsAppCloude";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database
    await connectDB();

    const { id: postId } = await params;

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

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Work not found" },
        { status: 404 }
      );
    }

    // Check if post is available (status: pending)
    if (post.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: `This work is already ${post.status}. Cannot accept.`,
        },
        { status: 400 }
      );
    }

    // Check if post already has a worker assigned
    if (post.worker) {
      return NextResponse.json(
        {
          success: false,
          message: "This work has already been accepted by another worker",
        },
        { status: 400 }
      );
    }

    // Check if worker is trying to accept their own post
    if (post.user.toString() === user._id.toString()) {
      return NextResponse.json(
        { success: false, message: "You cannot accept your own work request" },
        { status: 400 }
      );
    }

    // Update the post
    post.worker = user._id;
    post.status = "processing";
    post.updatedAt = new Date();

    await post.save();

    const poster = await User.findById(post.user);
    if (poster && poster.whatsapp) {
      try {
        await sendUserOrderAcceptedTemplate(
          poster.whatsapp,
          poster.name,
          post.service.title,
          user.name
        );
      } catch (error) {
        console.log(error);
      }
    }

    const resellers = await Reseller.find({});
    for (const reseller of resellers) {
      if (reseller.whatsapp) {
        try {
          await sendOrderAcceptedTemplate(
            reseller.whatsapp,
            user.name,
            post.service.title
          );
        } catch (error) {
          console.log(error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Work accepted successfully",
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
    console.error("Error accepting work:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to accept work",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
