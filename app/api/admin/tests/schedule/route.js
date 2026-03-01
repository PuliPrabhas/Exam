import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Test from "@/models/Test";

export async function POST(req) {
  await dbConnect();
  try {
    const { title, startTime, endTime } = await req.json();
    if (!startTime || !endTime) return NextResponse.json({ success: false, message: "Missing times" }, { status: 400 });

    // ensure no active test exists
    const existing = await Test.findOne({ active: true }).lean();
    if (existing) {
      return NextResponse.json({ success: false, message: "An active test already exists" }, { status: 409 });
    }

    const test = await Test.create({
      title: title || "Scheduled Test",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      active: true,
    });

    return NextResponse.json({ success: true, test });
  } catch (err) {
    console.error("Schedule error:", err);
    return NextResponse.json({ success: false, message: "Schedule failed" }, { status: 500 });
  }
}