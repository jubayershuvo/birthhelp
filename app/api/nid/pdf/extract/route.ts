import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import NidData from "@/models/NidData";
import axios from "axios";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Buffer } from "buffer";
import { generateNidBarcode } from "@/lib/genImage";

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formDataBody = await req.formData();
    const profilePdf = formDataBody.get("profile_pdf") as File | null;

    if (!profilePdf) {
      console.error("Error: PDF file not found in request.");
      return NextResponse.json(
        { error: "PDF file not found" },
        { status: 400 }
      );
    }

    // Send PDF to first server
    let pdfResponse;
    try {
      const formData = new FormData();
      formData.append("profile_pdf", profilePdf);
      pdfResponse = await fetch("https://applicationzone.top/upload.php", {
        method: "POST",
        body: formData,
      });
    } catch (fetchError) {
      console.error("Failed to send PDF to server:", fetchError);
      return NextResponse.json(
        { error: "Failed to send PDF to server", details: fetchError },
        { status: 502 }
      );
    }

    if (!pdfResponse.ok) {
      console.error("Failed to send PDF to server:", pdfResponse.statusText);
      return NextResponse.json(
        {
          error: "Failed to send PDF to server",
          details: pdfResponse.statusText,
        },
        { status: 502 }
      );
    }
    let pdfResult;

    try {
      pdfResult = await pdfResponse.json();
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON response from server", details: jsonError },
        { status: 502 }
      );
    }
    if (!pdfResult.data.nid) {
      return NextResponse.json(
        { error: "NID not found in PDF" },
        { status: 502 }
      );
    }

    // Send PDF to second API to extract images
    let imageResponse;
    try {
      const imageFormData = new FormData();
      imageFormData.append("pdf", profilePdf);
      const res = await axios.post(
        "https://api.applicationzone.top/extract",
        imageFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      imageResponse = res.data;
    } catch (error) {
      console.error("Failed to extract images:", error);
      return NextResponse.json(
        { error: "Failed to extract images", details: error },
        { status: 502 }
      );
    }

    function formatDate(dateStr: string): string {
      const date = new Date(dateStr);

      const day = date.toLocaleString("en-US", { day: "2-digit" });
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();

      return `${month} ${day} ${year}`; // No comma
    }

    const barcodeData = `<pin>${pdfResult.data.pincode}</pin><name>${
      pdfResult.data.name_en
    }</name><DOB>${formatDate(
      pdfResult.data.dob
    )}</DOB><FP></FP><F>Right Index</F><TYPE>A</TYPE><V>2.0</V><ds>302c02167da6b272e960dfaf8a7ccca6b031da99defe8d24c44882580f7a9b3fea93b99040f65c34e8edafe9de63</ds>`;

    const photoBase64 = imageResponse.photos[0];
    const signatureBase64 = imageResponse.signatures[0];
    const barCodeBase64 = generateNidBarcode(barcodeData);

    if (!photoBase64 || !signatureBase64) {
      return NextResponse.json(
        { error: "Photo or signature not returned from API" },
        { status: 502 }
      );
    }

    // Save data to MongoDB
    const nidData = new NidData({
      ...pdfResult.data,
      user: user._id,
      dob: formatDate(pdfResult.data.dob),
    });
    const nid = await nidData.save();

    const id = nid._id.toString();
    const imageDirPath = path.join(process.cwd(), "upload", "images", id);
    if (!fs.existsSync(imageDirPath))
      fs.mkdirSync(imageDirPath, { recursive: true });

    // Convert base64 to buffer
    function base64ToBuffer(dataUrl: string) {
      const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid data URL");
      const base64Data = matches[2]; // strip the prefix
      return Buffer.from(base64Data, "base64");
    }

    // usage
    const photoBuffer = base64ToBuffer(photoBase64);
    const signatureBuffer = base64ToBuffer(signatureBase64);
    const barCodeBuffer = base64ToBuffer(barCodeBase64);

    const photoPath = path.join(imageDirPath, "photo.png");
    const signaturePath = path.join(imageDirPath, "signature.png");
    const barCodePath = path.join(imageDirPath, "barCode.png");

    fs.writeFileSync(photoPath, photoBuffer);
    fs.writeFileSync(signaturePath, signatureBuffer);
    fs.writeFileSync(barCodePath, barCodeBuffer);

    nid.photo = photoPath;
    nid.signature = signaturePath;
    nid.barcode = barCodePath;
    await nid.save();

    return NextResponse.json(nid, { status: pdfResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
