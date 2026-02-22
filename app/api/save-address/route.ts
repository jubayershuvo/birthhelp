import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import AddressPreset from "@/models/AddressPreset";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectDB();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Address data is required" },
        { status: 400 },
      );
    }
    //create always a new address preset for the user, do not update existing one
    const updatedAddress = await AddressPreset.create({
      user: user._id,
      address,
    });

    return NextResponse.json(updatedAddress, { status: 200 });
  } catch (error) {
    console.error("Address save error:", error);
    return NextResponse.json(
      { error: "Failed to save address data" },
      { status: 500 },
    );
  }
}
