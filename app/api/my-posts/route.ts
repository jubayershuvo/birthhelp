// app/api/my-posts/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import PostService from "@/models/PostService";
import Reseller from "@/models/Reseller";
import { getUser } from "@/lib/getUser";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get user using your getUser helper
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch posts for this user with populated fields
    const posts = await Post.find({ user: user._id })
      .populate({
        path: 'service',
        model: PostService,
        select: 'title description'
      })
      .populate({
        path: 'worker',
        model: Reseller,
        select: 'name email phone'
      })
      .sort({ createdAt: -1 })
      .lean();



    return NextResponse.json({
      success: true,
      posts,
    });
    
  } catch (error) {
    console.error("Error in GET /api/my-posts:", error);
    
    
    return NextResponse.json(
      { 
        success: false, 
        message: error || "Internal server error" 
      },
      { status: 500 }
    );
  }
}
