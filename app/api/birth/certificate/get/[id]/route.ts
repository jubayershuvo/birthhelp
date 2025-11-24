import { generateBarcode, generateQRCode } from "@/lib/genImage";
import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthCertificate from "@/models/BirthCertificate";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Certificate ID is required" },
      { status: 400 }
    );
  }

  try {
    // Connect to MongoDB
    await connectDB();

    // Get the current user from request
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find the certificate by ID
    const certificate = await BirthCertificate.findById(id);

    if (!certificate) {
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 }
      );
    }

    const qrCode = await generateQRCode(certificate.qrCodeData);
    const barCode = generateBarcode(certificate.barcodeData);


    // Create a properly typed certificate object
    const certificateData = {
      ...certificate.toJSON(),
      qrCode: qrCode,
      barCode: barCode,
    };

    // Return certificate
    return NextResponse.json(certificateData);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
