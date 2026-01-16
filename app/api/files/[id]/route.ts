
import { connectDB } from "@/lib/mongodb";
import PostFile from "@/models/PostFile";
import { NextResponse } from "next/server";
import fs from "fs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Id not found" }, { status: 404 });
    }

    // 1. Fetch record
    const record = await PostFile.findById(id);
    if (!record) {
      console.log("File record not found");
      return NextResponse.json(
        { error: "File record not found" },
        { status: 404 }
      );
    }

    const filePath = record.path;

    const fileName = `${record.name}_${record._id}` || "download";

    const safeFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_");

    if (!fs.existsSync(filePath)) {
      console.log("File not found on server", filePath);
      return NextResponse.json(
        { error: "File not found on server" },
        { status: 404 }
      );
    }

    // 2. Read file as a buffer
    const fileBuffer = fs.readFileSync(filePath);

    // 3. Prepare headers
    const headers = new Headers({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeFileName}${record.ext}"`,
    });

    return new Response(fileBuffer, { headers });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
