import { getUser } from "@/lib/getUser";
import "@/models/Services";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUser();
    if (!user || !user._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userWithServices = await User.findById(user._id).populate(
      "services.service"
    );
 

    const services = userWithServices.services || [];

    return NextResponse.json(services);
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
