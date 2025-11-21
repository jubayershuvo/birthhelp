import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { avatar } = body;

    if (!avatar) {
      return NextResponse.json({ error: "Avatar is required" }, { status: 400 });
    }

    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Extract metadata + base64 part
    const matches = avatar.match(/^data:(image\/\w+);base64,(.+)$/);

    if (!matches) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const mimeType = matches[1]; // image/png
    const base64Data = matches[2]; // pure base64 string
    const ext = mimeType.split("/")[1]; // png

    const buffer = Buffer.from(base64Data, "base64");

    // File name
    const filename = `${user._id}.${ext}`;
    const filepath = path.join(process.cwd(), "public/users/photo", filename);

    // Ensure folder exists
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    // Write file
    fs.writeFileSync(filepath, buffer);

    // Update user
    const update = await User.findByIdAndUpdate(
      user._id,
      { avatar: `/users/photo/${filename}` },
      { new: true }
    );

    return NextResponse.json({ user: update }, { status: 200 });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
