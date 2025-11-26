import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthCertificate from "@/models/BirthCertificate";
import Reseller from "@/models/Reseller";
import Services from "@/models/Services";
import { NextRequest, NextResponse } from "next/server";
import Spent from "@/models/Use";
import Earnings from "@/models/Earnings";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { message: "Certificate ID is required" },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/birth/certificate";

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

    if (user.balace < serviceCost) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 402 }
      );
    }

    const reseller = await Reseller.findById(user.reseller);

    const certificate = await BirthCertificate.findById(id);
    if (!certificate) {
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 }
      );
    }
    certificate.user = user._id;
    certificate.birthPlaceBn = `${certificate.birthPlaceBn}, বাংলাদেশ`;
    certificate.birthPlaceEn = `${certificate.birthPlaceEn}, BANGLADESH`;
    user.balance -= serviceCost;
    reseller.balance += userService.fee;

    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: certificate._id,
      dataSchema: "BirthCertificate",
    });
    await Earnings.create({
      user: user._id,
      reseller: reseller._id,
      service: userService._id,
      amount: userService.fee,
      data: certificate._id,
      dataSchema: "BirthCertificate",
    });
    await reseller.save();
    await user.save();
    await certificate.save();
    return NextResponse.json(certificate, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
