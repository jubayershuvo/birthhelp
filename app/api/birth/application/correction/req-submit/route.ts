// app/api/birth-registration/correction/route.ts
import { connectDB } from "@/lib/mongodb";
import Currection from "@/models/CurrectionReq";
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/getUser";
import Services from "@/models/Services";
import Reseller from "@/models/Reseller";
import Spent from "@/models/Use";
import Earnings from "@/models/Earnings";

export const runtime = "nodejs";

// Define types for the request body
interface CorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
}

interface Address {
  country: string;
  geoId: string;
  division: string | number;
  divisionName: string;
  district: string | number;
  districtName: string;
  cityCorpCantOrUpazila: string | number;
  upazilaName: string;
  paurasavaOrUnion: string | number;
  unionName: string;
  postOfc: string;
  postOfcEn: string;
  vilAreaTownBn: string;
  vilAreaTownEn: string;
  houseRoadBn: string;
  houseRoadEn: string;
  ward: string | number;
  wardName: string;
}

interface ApplicantInfo {
  name: string;
  officeId?: number;
  email: string;
  phone: string;
  relationWithApplicant: string;
}

interface FileInfo {
  id: number;
  name: string;
  url: string;
  deleteUrl: string;
  attachmentTypeId: string;
  fileType: string;
}

interface CorrectionRequestBody {
  _id?: string;
  ubrn: string;
  dob: string;
  correctionInfos: CorrectionInfo[];
  addresses: {
    birthPlace: Address;
    permAddress: Address;
    prsntAddress: Address;
  };
  applicantInfo: ApplicantInfo;
  files: FileInfo[];
  otp: string;
  captcha: string;
  csrf: string;
  cookies: string[];
  isPermAddressIsSameAsBirthPlace: boolean;
  isPrsntAddressIsSameAsPermAddress: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CorrectionRequestBody = await request.json();

    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/birth/application/correction/request";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString(),
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 },
      );
    }
    const serviceCost = user.isSpecialUser
      ? userService.fee
      : userService.fee + service.fee;

    if (user.balance < serviceCost) {
      return NextResponse.json(
        { success: false, error: "User does not have enough balance" },
        { status: 403 },
      );
    }

    const reseller = await Reseller.findById(user.reseller);

    // Validate required fields
    if (!body.ubrn || !body.captcha || !body.csrf || !body.cookies) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "অনুগ্রহ করে সকল আবশ্যক তথ্য প্রদান করুন।",
        },
        { status: 400 },
      );
    }

    const { _id, ...rest } = body;

    const currection = await Currection.create({ ...rest, user: user._id });

    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: currection._id,
      dataSchema: "CurrectionApplication",
    });

    if (reseller && !user.isSpecialUser) {
      reseller.balance += userService.fee;
      await Earnings.create({
        user: user._id,
        reseller: reseller._id,
        service: userService._id,
        amount: userService.fee,
        data: currection._id,
        dataSchema: "CurrectionApplication",
      });
      await reseller.save();
    }
    await user.save();
    await currection.save();

    // Return the result from external API
    return NextResponse.json(currection);
  } catch (error) {
    console.error("Error processing birth registration correction:", error);

    // Return user-friendly error message
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          error ||
          "আপনার আবেদনের সেশনের মেয়াদ শেষ অথবা নিবন্ধন সার্ভার সমস্যা। দয়া করে আবার চেষ্টা করুন।",
      },
      { status: 500 },
    );
  }
}
