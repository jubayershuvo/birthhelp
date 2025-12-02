import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import NidData from "@/models/NidData";
import { NextResponse } from "next/server";
import fs from "fs";
import Services from "@/models/Services";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/nid/make";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString()
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 }
      );
    }
    const serviceCost = userService.fee + service.fee;

    const nid = await NidData.findById(id);
    if (!nid) {
      return NextResponse.json({ error: "NID not found" }, { status: 404 });
    }

    const photoPath = nid.photo;
    const signaturePath = nid.signature;
    const barCodePath = nid.barcode;

    const photoBase64 = fs.readFileSync(photoPath, "base64");
    const signatureBase64 = fs.readFileSync(signaturePath, "base64");
    const barCodeBase64 = fs.readFileSync(barCodePath, "base64");

    const photo = `data:image/png;base64,${photoBase64}`;
    const signature = `data:image/png;base64,${signatureBase64}`;
    const barcode = `data:image/png;base64,${barCodeBase64}`;

    const sendData = {
      ...nid.toObject(),
      photo,
      signature,
      barcode,
    };

    return NextResponse.json(
      { data: sendData, serviceCost, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
