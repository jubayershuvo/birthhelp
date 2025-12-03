import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BdrisData from "@/models/BdrisData";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const data = await BdrisData.find({ user: user._id }).sort({ createdAt: -1 });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}