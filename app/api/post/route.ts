import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import PostService from "@/models/PostService";
import { getUser } from "@/lib/getUser";
import Spent from "@/models/Use";
import Reseller from "@/models/Reseller";
import { sendWhatsAppText } from "@/lib/whatsappApi";
async function notifyResellers(title: string, name: string) {
  const allResellers = await Reseller.find();

  for (const reseller of allResellers) {
    if (!reseller.whatsapp) continue;

    console.log(`➡️ Sending to ${reseller.whatsapp}...`);

    try {
      const response = await sendWhatsAppText(
        reseller.whatsapp,
        `New Order: ${title} post by ${name}`
      );

      console.log(`✅ Sent to ${reseller.whatsapp}`, response);
    } catch (err) {
      console.error(`❌ Failed for ${reseller.whatsapp}`, err);
    }

    // rate-limit safety
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}


export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUser();

    const body = await req.json();
    const { service_id, description, files } = body;

    if (!service_id || !description) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 },
      );
    }

    // Validate service
    const service = await PostService.findById(service_id);
    const userService = user.postServices.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString(),
    );
    if (!service || !userService || !service.isAvailable) {
      console.log(userService);
      return NextResponse.json(
        { success: false, message: "Invalid service selected." },
        { status: 404 },
      );
    }

    // Validate file count
    if (files.length !== service.attachments.length) {
      return NextResponse.json(
        {
          success: false,
          message: "All required files must be uploaded.",
        },
        { status: 400 },
      );
    }
    const total =
      service.admin_fee + service.worker_fee + userService.reseller_fee;
    if (user.balance < total) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance." },
        { status: 400 },
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
      reseller_fee: userService.reseller_fee,
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

   // send response immediately
const response = NextResponse.json(
  { success: true, post: newPost },
  { status: 201 }
);

// run background task (DON'T await)
notifyResellers(service.title, user.name)
  .catch(err => console.error("WhatsApp notify error:", err));

return response;

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err || "Server error" },
      { status: 500 },
    );
  }
}
