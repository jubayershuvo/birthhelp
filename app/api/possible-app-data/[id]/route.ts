import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Earnings from "@/models/Earnings";
import Reseller from "@/models/Reseller";
import Services from "@/models/Services";
import { NextResponse } from "next/server";
import Spent from "@/models/Use";
import AppData from "@/models/AppData";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/possible-app-data";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString()
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 }
      );
    }
    const serviceCost = user.isSpecialUser
      ? userService.fee
      : userService.fee + service.fee;

    if (user.balance < serviceCost) {
      return NextResponse.json(
        { success: false, error: "User does not have enough balance" },
        { status: 403 }
      );
    }

    const reseller = await Reseller.findById(user.reseller);
    const response = await fetch(
      `https://api.fortest.top/possible.php?appId=${id}`
    );
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = await response.json();

    if (!data.status) {
      return new Response(JSON.stringify({ error: "No data found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    user.balance -= serviceCost;

    const appdata = await AppData.create({
      user: user._id,
      appId: id,
      data: data.data,
    });

    await Spent.create({
      user: user._id,
      service: userService._id,
      amount: serviceCost,
      data: appdata._id,
      dataSchema: "AppData",
    });
    if (reseller && !user.isSpecialUser) {
      reseller.balance += userService.fee;
      await Earnings.create({
        user: user._id,
        reseller: reseller._id,
        service: userService._id,
        amount: userService.fee,
        data: appdata._id,
        dataSchema: "AppData",
      });
      await reseller.save();
    }

    await user.save();
    return new Response(JSON.stringify(data.data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
