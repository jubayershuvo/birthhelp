import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import PostService from "@/models/PostService";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";

interface PostServiceBulkItem {
  service: string;
  fee: number;
}

interface BulkPostServiceRequest {
  users: string[];
  action: "add" | "remove";
  postServices: PostServiceBulkItem[];
}

interface BulkPostServiceSuccessResponse {
  success: true;
  message: string;
  updatedCount: number;
}

interface BulkPostServiceErrorResponse {
  success: false;
  message: string;
  error: string;
  updatedCount?: number;
}

type BulkPostServiceResponse =
  | BulkPostServiceSuccessResponse
  | BulkPostServiceErrorResponse;

export async function POST(
  request: NextRequest
): Promise<NextResponse<BulkPostServiceResponse>> {
  try {
    await connectDB();

    const body: BulkPostServiceRequest = await request.json();

    // Validate request body
    if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No users provided",
          error: "No users provided",
        } as BulkPostServiceErrorResponse,
        { status: 400 }
      );
    }

    if (!body.action || (body.action !== "add" && body.action !== "remove")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action",
          error: 'Invalid action. Must be "add" or "remove"',
        } as BulkPostServiceErrorResponse,
        { status: 400 }
      );
    }

    if (
      !body.postServices ||
      !Array.isArray(body.postServices) ||
      body.postServices.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "No post services provided",
          error: "No post services provided",
        } as BulkPostServiceErrorResponse,
        { status: 400 }
      );
    }

    // Validate post service IDs and fees
    for (const postServiceItem of body.postServices) {
      if (
        !postServiceItem.service ||
        !Types.ObjectId.isValid(postServiceItem.service)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid post service ID",
            error: "Invalid post service ID provided",
          } as BulkPostServiceErrorResponse,
          { status: 400 }
        );
      }

      // Check if post service exists
      const postServiceExists = await PostService.findById(
        postServiceItem.service
      );
      if (!postServiceExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Post service not found",
            error: `Post service with ID ${postServiceItem.service} not found`,
          } as BulkPostServiceErrorResponse,
          { status: 400 }
        );
      }

      if (
        body.action === "add" &&
        (postServiceItem.fee < 0 || postServiceItem.fee === undefined)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid fee",
            error: "Invalid fee for post service",
          } as BulkPostServiceErrorResponse,
          { status: 400 }
        );
      }
    }

    // Validate user IDs
    const validUserIds = body.users.filter((id) => Types.ObjectId.isValid(id));
    if (validUserIds.length !== body.users.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user IDs",
          error: "Invalid user IDs provided",
        } as BulkPostServiceErrorResponse,
        { status: 400 }
      );
    }

    // Get all users
    const users = await User.find({ _id: { $in: validUserIds } });
    if (users.length !== validUserIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Users not found",
          error: "Some users not found",
        } as BulkPostServiceErrorResponse,
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const errors: string[] = [];

    if (body.action === "add") {
      // Add post services to users
      for (const user of users) {
        try {
          for (const postServiceItem of body.postServices) {
            const postServiceId = new Types.ObjectId(postServiceItem.service);

            // Check if user already has this post service
            const existingPostServiceIndex = user.postServices.findIndex(
              (ps: {
                service: Types.ObjectId;
                reseller_fee: number;
              }) => ps.service.toString() === postServiceId.toString()
            );

            if (existingPostServiceIndex >= 0) {
              // Update existing post service fee
              user.postServices[existingPostServiceIndex].reseller_fee =
                postServiceItem.fee;
            } else {
              return NextResponse.json(
                {
                  success: false,
                  message: "Post service not found for user",
                  error: `User ${user._id} does not have post service ${postServiceId} to update`,
                } as BulkPostServiceErrorResponse,
                { status: 400 }
              );
            }
          }

          await user.save();
          updatedCount++;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          errors.push(`Failed to update user ${user._id}: ${errorMessage}`);
        }
      }
    } else if (body.action === "remove") {
      // Remove post services from users
      for (const user of users) {
        try {
          let hasChanges = false;

          for (const postServiceItem of body.postServices) {
            const postServiceId = new Types.ObjectId(postServiceItem.service);

            // Remove the post service if it exists
            const initialLength = user.postServices.length;
            user.postServices = user.postServices.filter(
              (ps: { service: Types.ObjectId; reseller_fee: number }) =>
                ps.service.toString() !== postServiceId.toString()
            );

            if (user.postServices.length < initialLength) {
              hasChanges = true;
            }
          }

          if (hasChanges) {
            await user.save();
            updatedCount++;
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          errors.push(`Failed to update user ${user._id}: ${errorMessage}`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Partially ${
            body.action === "add" ? "added" : "removed"
          } post services for ${updatedCount} users`,
          error: `Some operations failed: ${errors.join(", ")}`,
          updatedCount,
        } as BulkPostServiceErrorResponse,
        { status: 207 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully ${
          body.action === "add" ? "added" : "removed"
        } post services for ${updatedCount} users`,
        updatedCount,
      } as BulkPostServiceSuccessResponse,
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Bulk post service operation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        message: "Operation failed",
        error: errorMessage,
      } as BulkPostServiceErrorResponse,
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<BulkPostServiceResponse>> {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed",
      error: "Method not allowed. Use POST for bulk operations.",
    } as BulkPostServiceErrorResponse,
    { status: 405 }
  );
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<BulkPostServiceResponse>> {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed",
      error: "Method not allowed. Use POST for bulk operations.",
    } as BulkPostServiceErrorResponse,
    { status: 405 }
  );
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<BulkPostServiceResponse>> {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed",
      error: "Method not allowed. Use POST for bulk operations.",
    } as BulkPostServiceErrorResponse,
    { status: 405 }
  );
}
