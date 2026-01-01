import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import NidData from "@/models/NidData";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import Spent from "@/models/Use";
import Reseller from "@/models/Reseller";
import Services from "@/models/Services";
import Earnings from "@/models/Earnings";

// Helper function to save file
async function saveFile(file: File, filepath: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(filepath, buffer);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const reseller = await Reseller.findById(user.reseller);
    if (!reseller) {
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
    const serviceCost = user.isSpecialUser
      ? userService.fee
      : userService.fee + service.fee;

    const nid = await NidData.findById(id);
    if (!nid) {
      return NextResponse.json({ error: "NID not found" }, { status: 404 });
    }

    // Parse FormData
    const formData = await req.formData();

    // Get JSON data
    const dataString = formData.get("data") as string;
    if (!dataString) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const body = JSON.parse(dataString);

    // Handle file uploads
    const photoPath = nid.photo;
    const signaturePath = nid.signature;

    const photoFile = formData.get("photo") as File;
    const signatureFile = formData.get("signature") as File;

    if (photoFile && photoFile.size > 0) {
      await saveFile(photoFile, photoPath);
    }

    if (signatureFile && signatureFile.size > 0) {
      await saveFile(signatureFile, signaturePath);
    }

    if (!nid.user) {
      user.balance -= serviceCost;

      await Spent.create({
        user: user._id,
        service: userService._id,
        amount: serviceCost,
        data: id,
        dataSchema: "NIDMake",
      });

      if (reseller && !user.isSpecialUser) {
        reseller.balance += userService.fee;
        await Earnings.create({
          user: user._id,
          reseller: reseller._id,
          service: userService._id,
          amount: userService.fee,
          data: id,
          dataSchema: "NIDMake",
        });
        await reseller.save();
      }
      await user.save();
    }

    // Prepare update data
    const dataSet = {
      ...body,
      photo: photoPath,
      signature: signaturePath,
      barcode: nid.barcode,
      user: user._id,
    };

    await NidData.updateOne({ _id: id }, { $set: dataSet });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...dataSet,
          _id: id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Edit NID error:", error);
    return NextResponse.json(
      {
        error: error || "Server error",
      },
      { status: 500 }
    );
  }
}
