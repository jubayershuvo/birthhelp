import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import { getReseller } from "@/lib/getReseller";
import Earnings from "@/models/Earnings";
import PostFile from "@/models/PostFile";
import path from "path";
import fs from "fs/promises";
import User from "@/models/User";
import Reseller from "@/models/Reseller";
import {
  sendOrderDeliveryTemplate,
  sendOrderTextDeliveryTemplate,
} from "@/lib/whatsAppCloude";
import { sendWhatsAppFile, sendWhatsAppText } from "@/lib/whatsappApi";
import { nodeFileToWebFile } from "@/lib/makeFile";

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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const user = await getReseller();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: postId } = await params;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const deliveryNote = formData.get("deliveryNote") as string | null;

    // Validate that at least one of file or deliveryNote is provided
    if (!file && !deliveryNote?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide either a delivery file or a delivery note",
        },
        { status: 400 },
      );
    }

    // Find the post
    const post = await Post.findById(postId).populate("service");

    const poster = await User.findById(post.user);

    const poster_reseller = await Reseller.findById(poster?.reseller);

    if (!post || !poster) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 },
      );
    }
    if (!poster.isSpecialUser && !poster_reseller) {
      return NextResponse.json(
        { success: false, message: "Poster reseller not found" },
        { status: 404 },
      );
    }
    // Check if worker is assigned to this post
    if (post.worker?.toString() !== user._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not assigned to this work",
        },
        { status: 403 },
      );
    }

    // Check if post is in processing status
    if (post.status !== "processing") {
      return NextResponse.json(
        {
          success: false,
          message: "This work is not in processing status",
        },
        { status: 400 },
      );
    }

    let uploadedFile = null;

    // Handle file upload if provided
    if (file) {
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
      uploadedFile = await PostFile.create({
        name: `${post.service.title}_${Date.now()}`,
        path: fullFilePath,
        ext: fileExt,
      });
    }

    // Update post to completed
    post.status = "completed";

    // Set delivery file if provided
    if (uploadedFile) {
      post.deliveryFile = {
        name: uploadedFile.name,
        fileId: uploadedFile._id.toString(),
      };
    }

    // Set delivery note if provided
    if (deliveryNote?.trim()) {
      post.deliveryNote = deliveryNote.trim();
    }

    post.updatedAt = new Date();
    post.completedAt = new Date();

    // ================= BALANCE & EARNINGS LOGIC =================
    const isSameUser =
      poster_reseller && user._id.toString() === poster_reseller._id.toString();

    if (!poster.isSpecialUser && poster_reseller) {
      if (isSameUser) {
        // Worker and reseller are SAME → add combined amount once
        const totalAmount = Number(post.worker_fee) + Number(post.reseller_fee);

        user.balance += totalAmount;
        await user.save();

        await Earnings.create({
          user: poster._id,
          reseller: user._id,
          service: post.service._id,
          amount: totalAmount,
          data: post._id.toString(),
          dataSchema: "CompletedWorkCombined",
        });
      } else {
        // Different accounts → normal split

        // Reseller commission
        poster_reseller.balance += Number(post.reseller_fee);
        await poster_reseller.save();

        await Earnings.create({
          user: poster._id,
          reseller: poster_reseller._id,
          service: post.service._id,
          amount: post.reseller_fee,
          data: post._id.toString(),
          dataSchema: "CompletedWorkCommission",
        });

        // Worker payment
        user.balance += Number(post.worker_fee);
        await user.save();

        await Earnings.create({
          user: poster._id,
          reseller: user._id,
          service: post.service._id,
          amount: post.worker_fee,
          data: post._id.toString(),
          dataSchema: "CompletedWork",
        });
      }
    } else {
      // Special user → only worker gets paid
      user.balance += Number(post.worker_fee);
      await user.save();

      await Earnings.create({
        user: poster._id,
        reseller: user._id,
        service: post.service._id,
        amount: post.worker_fee,
        data: post._id.toString(),
        dataSchema: "CompletedWork",
      });
    }
    await post.save();
    if (poster.whatsapp) {
      // Send WhatsApp notification
      try {
        if (uploadedFile) {
          // const file = nodeFileToWebFile(uploadedFile.path);
          // await sendWhatsAppFile({
          //   files: [file],
          //   number: poster.whatsapp,
          //   caption: `File: ${post.service.title}`,
          // })
        } else if (deliveryNote) {
          // await sendWhatsAppText(poster.whatsapp, `Delivery note: ${deliveryNote} for ${post.service.title}`);
        }
      } catch (error) {
        console.log(error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Work marked as completed successfully",
      post: {
        _id: post._id.toString(),
        status: post.status,
        deliveryFile: post.deliveryFile,
        deliveryNote: post.deliveryNote,
        completedAt: post.completedAt,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/reseller/works/complete/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
