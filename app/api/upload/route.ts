import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";
import PostFile from "@/models/PostFile";

async function ensureUploadDir() {
  const uploadPath = path.join(process.cwd(), "upload", "post-files");

  try {
    await fs.access(uploadPath);
  } catch {
    await fs.mkdir(uploadPath, { recursive: true });
  }

  return uploadPath;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUser();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" });
    }

    // Ensure folder exists
    const folderPath = await ensureUploadDir();

    // Convert file -> buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // File extension
    const ext = path.extname(file.name) || "";

    // Unique filename
    const filename = `${user._id}_${Date.now()}${ext}`;

    // Complete path
    const fullFilePath = path.join(folderPath, filename);

    // Write file
    await fs.writeFile(fullFilePath, buffer);

    // Save DB record
    const uploadedFile = await PostFile.create({
      name: name || file.name,
      path: fullFilePath,
      ext,
    });

    return NextResponse.json({
      success: true,
      fileId: uploadedFile._id.toString(),
      filename,
      url: `/uploads/post-files/${filename}`,
      name: uploadedFile.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({
      success: false,
      message: "Upload failed",
      error: error instanceof Error ? error.message : error,
    });
  }
}
