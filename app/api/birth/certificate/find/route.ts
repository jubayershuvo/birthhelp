import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthCertificate from "@/models/BirthCertificate";
import Services from "@/models/Services";
import { NextResponse } from "next/server";

interface RequestBody {
  ubrn: string;
  dob: string;
}

export async function POST(req: Request) {
  try {
    const { ubrn, dob }: RequestBody = await req.json();

    if (!ubrn || !dob) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
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
    console.log(ubrn,dob)
    const response = await fetch(
      `http://api.sheva247.site/birth_test/api/birth_verification_get.php?ubrn=${ubrn}&dob=${dob}`
    );

    const jsonData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: jsonData.error || "Failed to fetch data" },
        { status: response.status }
      );
    }

    const certificate = await BirthCertificate.create(jsonData.data);

    const sendData = {
      _id: certificate._id,
      birthRegNumber: certificate.birthRegNumber,
      personNameEn: certificate.personNameEn,
      personNameBn: certificate.personNameBn,
      dateOfBirth: certificate.dateOfBirth,
      cost: serviceCost,
    };

    return NextResponse.json({ success: true, data: sendData });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
