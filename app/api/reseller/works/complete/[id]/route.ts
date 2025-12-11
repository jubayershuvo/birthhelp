import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import { getReseller } from "@/lib/getReseller";
import Earnings from "@/models/Earnings";
import PostFile from "@/models/PostFile";
import path from "path";
import fs from "fs/promises";

// Helper function to ensure upload directory exists
async function ensureUploadDir() {
  const uploadPath = path.join(process.cwd(), "upload", "delivery-files");

  try {
    await fs.access(uploadPath);
  } catch {
    await fs.mkdir(uploadPath, { recursive: true });
  }

  return uploadPath;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await getReseller();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: postId } = await params;

    // Parse form data for file upload
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Delivery file is required" },
        { status: 400 }
      );
    }

    // Find the post
    const post = await Post.findById(postId).populate("service");

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    // Check if worker is assigned to this post
    if (post.worker?.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not assigned to this work",
        },
        { status: 403 }
      );
    }

    // Check if post is in processing status
    if (post.status !== "processing") {
      return NextResponse.json(
        {
          success: false,
          message: "This work is not in processing status",
        },
        { status: 400 }
      );
    }

    // Handle file upload
    const uploadPath = await ensureUploadDir();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get file extension
    const fileExt = path.extname(file.name) || "";

    // Create unique filename
    const uniqueFilename = `${postId}_${Date.now()}${fileExt}`;
    const fullFilePath = path.join(uploadPath, uniqueFilename);

    // Save file to disk
    await fs.writeFile(fullFilePath, buffer);

    // Create file record in database
    const uploadedFile = await PostFile.create({
      name: `${post.service.title}_${Date.now()}`,
      path: fullFilePath,
      ext: fileExt,
    });

    // Update post to completed
    post.status = "completed";
    post.deliveryFile = {
      name: uploadedFile.name,
      fileId: uploadedFile._id.toString(),
    };
    post.updatedAt = new Date();
    post.completedAt = new Date();

    // Update user balance
    user.balance += Number(post.deal_amount);

    await user.save();
    await post.save();

    // Create earnings record
    await Earnings.create({
      user: post.user.toString(),
      reseller: user._id,
      service: post.service._id,
      amount: post.deal_amount,
      data: post._id.toString(),
      dataSchema: "CompletedWork",
    });

    return NextResponse.json({
      success: true,
      message: "Work marked as completed successfully",
      post: {
        _id: post._id.toString(),
        status: post.status,
        deliveryFile: post.deliveryFile,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/works/complete/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
