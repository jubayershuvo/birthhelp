// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import { getUser } from "@/lib/getUser";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getUser();
    const { id: postId } = await params;

    // Find the post and verify ownership
    const post = await Post.findOne({ _id: postId, user: user._id });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found or unauthorized" },
        { status: 404 }
      );
    }

    // Only allow deletion of pending posts
    if (post.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Only pending posts can be deleted" },
        { status: 400 }
      );
    }

    user.balance += post.deal_amount;
    await user.save();

    await Post.findByIdAndDelete(postId);

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { success: false, message: error },
      { status: 500 }
    );
  }
}
