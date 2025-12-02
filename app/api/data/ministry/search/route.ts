// app/api/download/route.ts
import { NextResponse } from "next/server";
import { encryptFile } from "@/lib/encryptFile";

export async function GET() {

  const searchResults = {
    name: "Encoded Name",
  };

  // Encrypt data
  const fileBuffer = encryptFile(searchResults);

  // Create a new ArrayBuffer copy (safe)
  const arrayBuffer = new Uint8Array(fileBuffer).buffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="search_results.sbd"',
    },
  });
}
