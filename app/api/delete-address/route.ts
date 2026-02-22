// app/api/delete-address/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddressPreset from "@/models/AddressPreset";
import { getUser } from "@/lib/getUser";

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    // Get the user from the session
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the address ID from the URL
    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    // Find and delete the address, ensuring it belongs to the user
    const deletedAddress = await AddressPreset.findOneAndDelete({
      _id: addressId,
      user: user._id,
    });

    if (!deletedAddress) {
      return NextResponse.json(
        { error: "Address not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Address deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}