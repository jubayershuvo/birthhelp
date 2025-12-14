import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import PostService from "@/models/PostService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const services = await PostService.find({}).sort({ createdAt: -1 });
    const userServices = user.postServices || [];

    const availablePostServices = services
      .map((service) => {
        const purchased = userServices.find(
          (s: { service: string }) =>
            s.service.toString() === service._id.toString()
        );

        if (!purchased) return null;

        return {
          ...service.toObject(),
          reseller_fee: purchased.reseller_fee,
        };
      })
      .filter(Boolean);
    return NextResponse.json(availablePostServices || [], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
