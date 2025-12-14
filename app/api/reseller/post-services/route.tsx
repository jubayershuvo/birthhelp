import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const db = await connectDB();
        const services = await db.collection("postservices").find({}).toArray();
     
        return NextResponse.json(services);
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}