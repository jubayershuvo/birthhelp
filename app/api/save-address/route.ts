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
        { status: 400 }
      );
    }

    // 🔥 Update if exists, otherwise create new
    const updatedAddress = await AddressPreset.findOneAndUpdate(
      { user: user._id }, // find by user
      { address },        // update this
      {
        new: true,        // return updated document
        upsert: true,     // create if not exists
        runValidators: true,
      }
    );

    return NextResponse.json(updatedAddress, { status: 200 });

  } catch (error) {
    console.error("Address save error:", error);
    return NextResponse.json(
      { error: "Failed to save address data" },
      { status: 500 }
    );
  }
}
