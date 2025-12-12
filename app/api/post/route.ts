import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import PostService from "@/models/PostService";
import { getUser } from "@/lib/getUser";
import Spent from "@/models/Use";

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUser();

    const body = await req.json();
    const { service_id, description, files } = body;

    if (!service_id || !description) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Validate service
    const service = await PostService.findById(service_id);
    if (!service) {
      return NextResponse.json(
        { success: false, message: "Invalid service selected." },
        { status: 404 }
      );
    }

    // Validate file count
    if (files.length !== service.attachments.length) {
      return NextResponse.json(
        {
          success: false,
          message: "All required files must be uploaded.",
        },
        { status: 400 }
      );
    }
    const total = service.admin_fee + service.worker_fee + service.reseller_fee;
    if (user.balance < total) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance." },
        { status: 400 }
      );
    }
    user.balance -= total;
    await user.save();

    // Create Post
    const newPost = await Post.create({
      service: service_id,
      user: user._id,
      description,
      admin_fee: service.admin_fee,
      worker_fee: service.worker_fee,
      reseller_fee: service.reseller_fee,
      files: JSON.parse(JSON.stringify(files)) || [],
      status: "pending",
    });

    await Spent.create({
      user: user._id,
      service: service._id,
      amount: total,
      data: newPost._id,
      dataSchema: "WorkPost",
    });

    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err || "Server error" },
      { status: 500 }
    );
  }
}
