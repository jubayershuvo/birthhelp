import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import NidData from "@/models/NidData";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const history = await NidData.find({ user: user._id }).sort({
      createdAt: -1,
    });
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
