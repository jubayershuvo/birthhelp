// app/api/reseller/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";
import Services from "@/models/Services";
import { getReseller } from "@/lib/getReseller";

interface ServiceInput {
  service: string;
  fee: number;
}

interface ServiceDocument {
  service: {
    _id: Types.ObjectId;
    name: string;
  };
  fee: number;
}

interface UserResponse {
  _id: Types.ObjectId;
  email: string;
  username: string;
  services: Array<{
    serviceId: Types.ObjectId;
    serviceName: string;
    fee: number;
  }>;
  [key: string]: unknown;
}

interface UpdateData {
  email?: string;
  username?: string;
  password?: string;
  services?: Array<{
    service?: string;
    fee: number;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = (await request.json()) as Partial<{
      email: string;
      username: string;
      password: string;
      balance?: number;
      services: ServiceInput[];
    }>;
    const reseller = await getReseller();

    if (!reseller || !reseller._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.reseller.toString() !== reseller._id.toString()) {
      return NextResponse.json(
        { error: "You are not authorized to update this user" },
        { status: 401 }
      );
    }

    if (body.balance) {
      delete body.balance;
    }

    if (body.username) {
      const safeUsername = body.username
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/ /g, "");
      body.username = safeUsername.toLowerCase().replace(/-/g, "");
    }

    // Check for duplicates (excluding current user)
    if (body.email || body.username) {
      const duplicate = await User.findOne({
        _id: { $ne: id },
        $or: [{ email: body.email }, { username: body.username }],
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Email or username already exists" },
          { status: 400 }
        );
      }
    }

    // Remove password if not provided or empty
    if (!body.password || body.password === "") {
      delete body.password;
    }

    if (body.balance) {
      delete body.balance;
    }

    // Transform services data
    const updateData: UpdateData = {
      ...body,
    };

    if (body.services) {
      updateData.services = body.services.map((service: ServiceInput) => ({
        service: service.service,
        fee: service.fee,
      }));
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("services.service", "name");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform the response
    const userObject = updatedUser.toObject();
    const transformedUser: UserResponse = {
      ...userObject,
      services: updatedUser.services.map((service: ServiceDocument) => ({
        serviceId: service.service?._id,
        serviceName: service.service?.name || "",
        fee: service.fee,
      })),
    };

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: transformedUser,
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
