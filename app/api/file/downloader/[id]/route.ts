import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/ApplicationPDF";
import { getUser } from "@/lib/getUser";

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

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch record
    const record = await Application.findById(id);
    if (!record) {
      return NextResponse.json({ error: "File record not found" }, { status: 404 });
    }

    // 2. Permission check
    if (record.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = record.path;

    // 3. File exists?
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found on server" },
        { status: 404 }
      );
    }

    // 4. Detect mime type dynamically
    const mimeType = mime.getType(filePath) || "application/octet-stream";

    // 5. Get file name automatically
    const fileName = record.name || path.basename(filePath);

    // 6. Read file buffer
    const fileBuffer = fs.readFileSync(filePath);

    // 7. Return binary response
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong", detail: err },
      { status: 500 }
    );
  }
}
