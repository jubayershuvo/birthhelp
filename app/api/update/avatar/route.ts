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
      return NextResponse.json(
        { error: "Avatar is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const buffer = Buffer.from(avatar, "base64");
    const ext = avatar.split(";")[0].split("/")[1];
    const filename = `${user._id}.${ext}`;
    const filepath = path.join(process.cwd(), "public/users/photo", filename);
    fs.writeFileSync(filepath, buffer);
    user.avatar = `/users/photo/${filename}`;
    const newUser = await User.findById(user._id);
    return NextResponse.json({ user: newUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
