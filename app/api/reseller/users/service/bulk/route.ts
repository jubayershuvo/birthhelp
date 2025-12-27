import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import Service from "@/models/Services";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";

interface ServiceBulkItem {
  service: string;
  fee: number;
}

interface BulkServiceRequest {
  users: string[];
  action: "add" | "remove";
  services: ServiceBulkItem[];
}

interface BulkServiceResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: BulkServiceRequest = await request.json();

    // Validate request body
    if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
      return NextResponse.json(
        { success: false, error: "No users provided" },
        { status: 400 }
      );
    }

    if (!body.action || (body.action !== "add" && body.action !== "remove")) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "add" or "remove"' },
        { status: 400 }
      );
    }

    if (
      !body.services ||
      !Array.isArray(body.services) ||
      body.services.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "No services provided" },
        { status: 400 }
      );
    }

    // Validate service IDs and fees
    for (const serviceItem of body.services) {
      if (
        !serviceItem.service ||
        !Types.ObjectId.isValid(serviceItem.service)
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid service ID provided" },
          { status: 400 }
        );
      }

      // Check if service exists
      const serviceExists = await Service.findById(serviceItem.service);
      if (!serviceExists) {
        return NextResponse.json(
          {
            success: false,
            error: `Service with ID ${serviceItem.service} not found`,
          },
          { status: 400 }
        );
      }

      if (
        body.action === "add" &&
        (serviceItem.fee < 0 || serviceItem.fee === undefined)
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid fee for service" },
          { status: 400 }
        );
      }
    }

    // Validate user IDs
    const validUserIds = body.users.filter((id) => Types.ObjectId.isValid(id));
    if (validUserIds.length !== body.users.length) {
      return NextResponse.json(
        { success: false, error: "Invalid user IDs provided" },
        { status: 400 }
      );
    }

    // Get all users
    const users = await User.find({ _id: { $in: validUserIds } });
    if (users.length !== validUserIds.length) {
      return NextResponse.json(
        { success: false, error: "Some users not found" },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const errors: string[] = [];

    if (body.action === "add") {
      // Add services to users
      for (const user of users) {
        try {
          for (const serviceItem of body.services) {
            const serviceId = new Types.ObjectId(serviceItem.service);

            // Check if user already has this service
            const existingServiceIndex = user.services.findIndex(
              (s: { service: string }) =>
                s.service.toString() === serviceId.toString()
            );

            if (existingServiceIndex >= 0) {
              // Update existing service fee
              user.services[existingServiceIndex].fee = serviceItem.fee;
            } else {
              // Add new service
              user.services.push({
                service: serviceId,
                fee: serviceItem.fee,
              });
            }
          }

          await user.save();
          updatedCount++;
        } catch (error) {
          errors.push(`Failed to update user`);
        }
      }
    } else if (body.action === "remove") {
      // Remove services from users
      for (const user of users) {
        try {
          let hasChanges = false;

          for (const serviceItem of body.services) {
            const serviceId = new Types.ObjectId(serviceItem.service);

            // Remove the service if it exists
            const initialLength = user.services.length;
            user.services = user.services.filter(
              (s: { service: string }) =>
                s.service.toString() !== serviceId.toString()
            );

            if (user.services.length < initialLength) {
              hasChanges = true;
            }
          }

          if (hasChanges) {
            await user.save();
            updatedCount++;
          }
        } catch (error) {
          errors.push(`Failed to update user`);
        }
      }
    }

    const response: BulkServiceResponse = {
      success: errors.length === 0,
      message: `Successfully ${
        body.action === "add" ? "added" : "removed"
      } services for ${updatedCount} users`,
      updatedCount,
    };

    if (errors.length > 0) {
      response.error = `Some operations failed: ${errors.join(", ")}`;
    }

    return NextResponse.json(response, {
      status: errors.length > 0 ? 207 : 200,
    }); // 207 Multi-Status
  } catch (error) {
    console.error("Bulk service operation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error || "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST for bulk operations.",
    },
    { status: 405 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST for bulk operations.",
    },
    { status: 405 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST for bulk operations.",
    },
    { status: 405 }
  );
}
