import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import AddressPreset from "@/models/AddressPreset";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const addressData = await AddressPreset.find({ user: user._id });
    if (!addressData) {
      return NextResponse.json({ error: "No address found" }, { status: 404 });
    }
    return NextResponse.json({ addresses: addressData }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
