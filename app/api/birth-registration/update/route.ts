import { NextRequest, NextResponse } from "next/server";
import BirthCertificate from "@/models/BirthCertificate";
import { connectDB } from "@/lib/mongodb";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { birthRegNumber } = body;

    // Validate input
    if (!birthRegNumber) {
      return NextResponse.json(
        { success: false, message: "birthRegNumber is required" },
        { status: 400 }
      );
    }

    // Check if data exists in DB
    const existingDoc = await BirthCertificate.findOne({ birthRegNumber });
    if (!existingDoc) {
      return NextResponse.json(
        { success: false, message: "No birth certificate found for this number" },
        { status: 404 }
      );
    }

    // Prevent modification of birthRegNumber
    const { birthRegNumber: _, _id, createdAt, updatedAt, ...updateData } = body;

    // Update document
    const updatedDoc = await BirthCertificate.findOneAndUpdate(
      { birthRegNumber },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Birth certificate updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error updating birth certificate:", error);
    return NextResponse.json(
      { success: false, message: "Server error", details: error },
      { status: 500 }
    );
  }
}
