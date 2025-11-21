// app/api/reseller/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";
import Services from "@/models/Services";

interface ServiceInput {
  serviceId: string;
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

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    if (body.balance){
      delete body.balance
    }

    // Transform services data
    const updateData: UpdateData = {
      ...body,
    };

    if (body.services) {
      updateData.services = body.services.map((service: ServiceInput) => ({
        service: service.serviceId,
        fee: service.fee,
      }));
    }
    if (body.services) {
      // Fetch all official services using IDs from the request
      const existingServices = await Services.find({
        _id: {
          $in: body.services.map(
            (service: { serviceId: string; fee: number }) => service.serviceId
          ),
        },
      });

      // Check: all provided service IDs must exist
      if (existingServices.length !== body.services.length) {
        return NextResponse.json(
          { message: "One or more services not found" },
          { status: 404 }
        );
      }



      // Validate each requested fee with official fee
      const invalidFee = body.services.some(
        (serviceBody: { serviceId: string; fee: number }) => {
          const official = existingServices.find(
            (s) => s._id.toString() === serviceBody.serviceId
          );

          // console.log("official", official);
          // console.log("boby", serviceBody);
          if (!official) return true;
          console.log(serviceBody.fee, official.fee);
          // ❌ Reject if new fee > official fee
          return serviceBody.fee < official.fee;
        }
      );

      if (invalidFee) {
        return NextResponse.json(
          { message: "Service fee cannot be laser than official fee" },
          { status: 400 }
        );
      }
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
