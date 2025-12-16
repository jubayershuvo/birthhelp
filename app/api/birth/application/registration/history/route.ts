import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthRegistration from "@/models/BirthRegistration";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const history = await BirthRegistration.find({ user: user._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ history });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
