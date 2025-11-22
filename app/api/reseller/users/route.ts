import { getReseller } from "@/lib/getReseller";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Reseller from "@/models/Reseller"; // Import Reseller model
import "@/models/Services";
import { Types } from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const reseller = await getReseller();

    if (!reseller) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Populate the users array to get full user documents
    const populatedReseller = await reseller.populate("users");

    // Extract users from the reseller
    const users = populatedReseller.users;

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching reseller users:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const reseller = await getReseller();

    if (!reseller) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const exitingUser = await User.findOne({ email: body.email });
    if (exitingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    const exitingUsername = await User.findOne({ username: body.username });
    if (exitingUsername) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }


    const safeUsername = body.username.replace(/[^a-zA-Z0-9]/g, "-").replace(/ /g, "");

   

    // Create the user with reseller reference
    const user = await User.create({
      name: body.name,
      email: body.email,
      username: safeUsername.toLowerCase().replace(/-/g, ""),
      password: body.password,
      isEmailVerified: true,
      isActive: true,
      reseller: reseller._id,
      services: body.services.map(
        (service: { service: string; fee: number }) => {
          return {
            service: new Types.ObjectId(service.service),
            fee: service.fee,
          };
        }
      ),
    });
    // Add the new user to reseller's users array
    await Reseller.findByIdAndUpdate(
      reseller._id,
      { $push: { users: user._id } },
      { new: true }
    );

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
